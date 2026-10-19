import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSocketStore } from '../store/useSocketStore';
import { Conversation } from '../types';
import Loading from '../components/Loading';
import { Avatar } from '../components/ui/avatar';
import { MessageSquare, Search, Sparkles } from 'lucide-react';
import ChatBox from './ChatBox';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { onlineUsers, socket } = useSocketStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations?.length > 0 && !selectedConv) {
          setSelectedConv(res.data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for message notifications to refresh conversation list
  useEffect(() => {
    if (!socket) return;

    const handleMessageUpdate = () => {
      fetchConversations();
    };

    socket.on('message_notification', handleMessageUpdate);
    socket.on('new_message', handleMessageUpdate);

    return () => {
      socket.off('message_notification', handleMessageUpdate);
      socket.off('new_message', handleMessageUpdate);
    };
  }, [socket]);

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="h-full flex overflow-hidden bg-[#090a10]">
      {/* Conversations List Left Column */}
      <div className="w-full md:w-80 lg:w-96 border-r border-white/[0.08] flex flex-col h-full bg-[#0d0f18] shrink-0">
        <div className="p-4 border-b border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Direct Messages
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {onlineUsers.length} online
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181b2c] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/[0.04]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-white">No chats yet</p>
              <p className="text-xs text-slate-400 mt-1">Visit Discover or Feed to start chatting with friends.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const isOnline = other ? onlineUsers.includes(other.id) : false;
              const isSelected = selectedConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    // On mobile, navigate to full-page chat
                    if (window.innerWidth < 768 && other) {
                      navigate(`/messages/${other.id}`);
                    }
                  }}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-l-4 border-indigo-500 text-white'
                      : 'hover:bg-white/[0.04] text-slate-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={other?.profilePicture}
                      fallback={other?.fullName || 'User'}
                      size="md"
                      className="ring-1 ring-white/10"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f18]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{other?.fullName}</h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {conv.lastMessage?.text || 'Started a conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: ChatBox Active Panel */}
      <div className="hidden md:flex flex-1 h-full flex-col bg-[#0a0b12]">
        {selectedConv && selectedConv.otherUser ? (
          <ChatBox
            key={selectedConv.id}
            conversationId={selectedConv.id}
            targetUser={selectedConv.otherUser}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-[#0a0b12]">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Select a conversation</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Pick a chat from the left sidebar or visit a friend's profile to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
