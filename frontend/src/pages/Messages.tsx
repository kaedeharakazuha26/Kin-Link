import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSocketStore } from '../store/useSocketStore';
import { Conversation } from '../types';
import Loading from '../components/Loading';
import { Avatar } from '../components/ui/avatar';
import { MessageCircle, Search } from 'lucide-react';
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
    <div className="h-full flex overflow-hidden bg-white">
      {/* Conversations List Left Column */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col h-full bg-white shrink-0">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Chats</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {onlineUsers.length} online
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-gray-50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
              <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Add friends or search people to start chatting.</p>
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
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={other?.profilePicture} fallback={other?.fullName || 'User'} size="md" />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{other?.fullName}</h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.text || 'Started a conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: ChatBox Active Panel (hidden on mobile, shown on md+) */}
      <div className="hidden md:flex flex-1 h-full flex-col">
        {selectedConv && selectedConv.otherUser ? (
          <ChatBox
            key={selectedConv.id}
            conversationId={selectedConv.id}
            targetUser={selectedConv.otherUser}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <MessageCircle className="w-12 h-12 text-indigo-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-800">Select a conversation</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Pick a chat from the left sidebar or visit a friend's profile to send them a direct message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
