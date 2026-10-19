import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { Conversation, Message, User } from '../types';
import { Avatar } from '../components/ui/avatar';
import {
  Send,
  Image,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Smile,
  X,
  Phone,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatBoxProps {
  conversationId?: string;
  targetUser?: User;
}

const ChatBox: React.FC<ChatBoxProps> = ({ conversationId: propConvId, targetUser: propTargetUser }) => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, onlineUsers } = useSocketStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(propTargetUser || null);
  const [loading, setLoading] = useState(true);

  // Message input state
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Typing state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // Load conversation and messages
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        if (userId) {
          // Open or create conversation with this user
          const res = await api.get(`/messages/conversations/${userId}`);
          if (res.data.success && res.data.conversation) {
            setConversation(res.data.conversation);
            setOtherUser(res.data.conversation.otherUser || null);

            // Fetch messages for this conversation
            const msgRes = await api.get(`/messages/${res.data.conversation.id}`);
            if (msgRes.data.success) {
              setMessages(msgRes.data.messages || []);
            }
          }
        } else if (propConvId) {
          const msgRes = await api.get(`/messages/${propConvId}`);
          if (msgRes.data.success) {
            setMessages(msgRes.data.messages || []);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast.error('Could not load chat conversation.');
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [userId, propConvId]);

  // Setup Socket.IO listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    socket.emit('join_conversation', conversation.id);

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversationId === conversation.id) {
        setMessages((prev) => [...prev, newMsg]);
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setIsOtherTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', conversation.id);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, conversation, user?.id]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!socket || !conversation || !user) return;

    socket.emit('typing', {
      conversationId: conversation.id,
      userId: user.id,
      username: user.username,
    });

    const timeout = setTimeout(() => {
      socket.emit('stop_typing', {
        conversationId: conversation.id,
        userId: user.id,
      });
    }, 1500);

    return () => clearTimeout(timeout);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || (!text.trim() && !mediaFile) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (mediaFile) formData.append('media', mediaFile);

      const res = await api.post(`/messages/${conversation.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.message) {
        const sentMessage = res.data.message;

        // Broadcast through socket
        socket?.emit('send_message', {
          conversationId: conversation.id,
          message: sentMessage,
          receiverId: otherUser?.id,
        });

        // Add to local state if not already received from socket
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });

        setText('');
        setMediaFile(null);
        setMediaPreview(null);
      }
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 -ml-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 sm:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="relative">
              <Avatar src={otherUser?.profilePicture} fallback={otherUser?.fullName || 'User'} size="md" />
              {isOtherOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">{otherUser?.fullName || 'Chat'}</h3>
              <p className="text-[11px] text-gray-500">
                {isOtherOnline ? (
                  <span className="text-emerald-600 font-semibold">Active now</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action shortcuts */}
        <div className="flex items-center gap-1 sm:gap-2 text-indigo-600">
          <button
            onClick={() => toast('Voice calling feature coming soon!')}
            className="p-2 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
            title="Start call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast('Video calling feature coming soon!')}
            className="p-2 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
            title="Start video"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/60 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Avatar src={otherUser?.profilePicture} fallback={otherUser?.fullName} size="xl" className="mb-3" />
            <h4 className="text-base font-bold text-gray-800">{otherUser?.fullName}</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Say hello! Send your first real-time message to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[78%] sm:max-w-[65%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <Avatar src={otherUser?.profilePicture} fallback={otherUser?.fullName} size="sm" className="mt-1" />
                  )}

                  <div className="space-y-1">
                    {/* Media image if present */}
                    {msg.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden max-h-60 max-w-xs shadow-xs">
                        <img src={msg.mediaUrl} alt="Attached" className="object-cover w-full h-full" />
                      </div>
                    )}

                    {/* Text bubble */}
                    {msg.text && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Time */}
                    <div className={`text-[10px] text-gray-400 px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>{otherUser?.fullName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Media upload preview banner */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-slate-100 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mediaPreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border" />
            <span className="text-xs text-gray-600 truncate max-w-xs">{mediaFile?.name}</span>
          </div>
          <button
            onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
            }}
            className="p-1 hover:bg-slate-200 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Input Bar Footer */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
          title="Attach image"
        >
          <Image className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={handleTyping}
          className="flex-1 bg-slate-100 border border-transparent rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !mediaFile) || isSending}
          className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white shadow-sm transition cursor-pointer flex items-center justify-center"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
