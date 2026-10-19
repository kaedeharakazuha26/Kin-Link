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
  X,
  Phone,
  Video,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

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

  const activeConvId = conversation?.id || propConvId;

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
          setConversation({
            id: propConvId,
            participants: [user?.id || '', propTargetUser?.id || ''],
            otherUser: propTargetUser,
            createdAt: '',
            updatedAt: '',
          });
          if (propTargetUser) {
            setOtherUser(propTargetUser);
          }

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
  }, [userId, propConvId, propTargetUser, user?.id]);

  // Setup Socket.IO listeners
  useEffect(() => {
    if (!socket || !activeConvId) return;

    socket.emit('join_conversation', activeConvId);

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConvId && data.userId !== user?.id) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConvId && data.userId !== user?.id) {
        setIsOtherTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', activeConvId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, activeConvId, user?.id]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!socket || !activeConvId || !user) return;

    socket.emit('typing', {
      conversationId: activeConvId,
      userId: user.id,
      username: user.username,
    });

    const timeout = setTimeout(() => {
      socket.emit('stop_typing', {
        conversationId: activeConvId,
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
    if (!activeConvId || (!text.trim() && !mediaFile) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (mediaFile) formData.append('media', mediaFile);

      const res = await api.post(`/messages/${activeConvId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.message) {
        const sentMessage = res.data.message;

        // Broadcast through socket
        socket?.emit('send_message', {
          conversationId: activeConvId,
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
    } catch (err) {
      console.error('Failed to send message:', err);
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
    <div className="flex flex-col h-full bg-[#0a0b12] text-white relative">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-[#0d0f18]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 md:hidden transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <Avatar
                src={otherUser?.profilePicture}
                fallback={otherUser?.fullName || 'User'}
                size="md"
                className="ring-2 ring-indigo-500/30 group-hover:ring-indigo-400 transition"
              />
              {isOtherOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f18]" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                {otherUser?.fullName || 'Conversation'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isOtherOnline ? (
                  <span className="text-emerald-400 font-medium">Online</span>
                ) : (
                  <span>@{otherUser?.username || 'member'}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
            className="p-2 hover:bg-white/10 hover:text-white rounded-xl transition cursor-pointer"
            title="View Profile"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-[#0a0b12]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Send className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Say hello to {otherUser?.fullName || 'your friend'}!</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Send your first message or share a photo to kick off the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    src={otherUser?.profilePicture}
                    fallback={otherUser?.fullName || 'User'}
                    size="sm"
                    className="shrink-0 mb-1"
                  />
                )}

                <div
                  className={`max-w-[75%] sm:max-w-md rounded-3xl px-4 py-2.5 shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-br-xs shadow-indigo-600/20'
                      : 'bg-[#181a29] border border-white/[0.08] text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Attached Media */}
                  {msg.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden mb-2 border border-white/10">
                      <img
                        src={msg.mediaUrl}
                        alt="Attachment"
                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                      />
                    </div>
                  )}

                  {/* Text content */}
                  {msg.text && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  <div
                    className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${
                      isMe ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing bubble */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <Avatar src={otherUser?.profilePicture} fallback="User" size="sm" />
            <div className="bg-[#181a29] border border-white/[0.08] px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1">typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Media upload preview banner */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-[#141625] border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={mediaPreview} alt="Preview" className="w-10 h-10 object-cover rounded-xl border border-white/10" />
            <span className="text-xs text-slate-300 truncate max-w-xs">{mediaFile?.name}</span>
          </div>
          <button
            onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
            }}
            className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-[#0d0f18] border-t border-white/[0.08] flex items-center gap-2.5"
      >
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
          className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-white/[0.06] rounded-xl transition cursor-pointer"
          title="Attach image"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* Input with crisp white typing color! */}
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={handleTyping}
          className="flex-1 bg-[#181b2c] text-white placeholder:text-slate-500 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !mediaFile) || isSending}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
