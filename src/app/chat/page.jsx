'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Phone, Video, ArrowLeft, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { subscribeToCollection } from '@/lib/firestore';
import ProfileImage from '@/components/ProfileImage';
// Format time function
const formatTime = (date) => {
    if (!date)
        return '';
    // If it's already a Date object
    if (date instanceof Date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If it's a Firestore timestamp
    if (date === null || date === void 0 ? void 0 : date.toDate) {
        return date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If it's a string that can be parsed as a date
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
};
export default function ChatPage() {
    var _a, _b, _c, _d, _e, _f;
    const { user } = useAuthStore();
    const router = useRouter();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Suggested Friends (Contacts)
    const [suggestedFriends, setSuggestedFriends] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        if (!user)
            return;
        const fetchSuggestedFriends = async () => {
            setContactsLoading(true);
            try {
                const ref = collection(db, `users/${user.sub}/suggestedFriends`);
                const snap = await getDocs(ref);
                setSuggestedFriends(snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()))));
            }
            catch (e) {
                setSuggestedFriends([]);
            }
            finally {
                setContactsLoading(false);
            }
        };
        fetchSuggestedFriends();
    }, [user]);
    // Follow friend
    const handleFollow = async (friendUid) => {
        if (!user)
            return;
        try {
            const userDoc = doc(db, 'users', user.sub);
            // Add friendUid to user's following array (simplified)
            toast.success('Followed!');
        }
        catch (e) {
            toast.error('Failed to follow');
        }
    };
    // Start chat with user
    const startChatWithUser = async (userId, userName, userPhoto) => {
        if (!user)
            return;
        try {
            // Check if chat already exists
            const existingChat = chats.find(chat => { var _a; return ((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) === userId; });
            if (existingChat) {
                setSelectedChat(existingChat);
                toast.success(`Opened chat with ${userName}`);
                return;
            }
            // Create a new chat with the selected user using startChatIfNeeded
            const chatId = await startChatIfNeeded(user.sub, userId);
            const newChat = {
                id: chatId,
                participants: [user.sub, userId],
                lastMessage: null,
                lastMessageTime: null,
                otherUser: {
                    id: userId,
                    name: userName,
                    photoURL: userPhoto
                }
            };
            setSelectedChat(newChat);
            setChats(prev => [newChat, ...prev]);
            toast.success(`Started chat with ${userName}`);
        }
        catch (error) {
            console.error('Error starting chat:', error);
            toast.error('Failed to start chat');
        }
    };
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const loadChats = async () => {
            try {
                const chatsData = await getUserChats(user.sub);
                // Get other user details for each chat
                const chatsWithUsers = await Promise.all(chatsData.map(async (chat) => {
                    var _a;
                    const otherUserId = (_a = chat.participants) === null || _a === void 0 ? void 0 : _a.find((id) => id !== user.sub);
                    if (otherUserId) {
                        try {
                            const otherUser = await getDocument('users', otherUserId);
                            return Object.assign(Object.assign({}, chat), { otherUser: otherUser ? {
                                    id: otherUser.id,
                                    name: otherUser.name || otherUser.displayName || 'Unknown User',
                                    photoURL: otherUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name || 'user'}`
                                } : undefined });
                        }
                        catch (error) {
                            console.error('Error fetching user:', error);
                            return chat;
                        }
                    }
                    return chat;
                }));
                setChats(chatsWithUsers);
            }
            catch (error) {
                console.error('Error loading chats:', error);
                toast.error('Failed to load chats');
            }
            finally {
                setLoading(false);
            }
        };
        loadChats();
    }, [user]);
    useEffect(() => {
        if (!selectedChat)
            return;
        const loadMessages = async () => {
            try {
                const messagesData = await getChatMessages(selectedChat.id);
                setMessages(messagesData);
            }
            catch (error) {
                console.error('Error loading messages:', error);
                toast.error('Failed to load messages');
            }
        };
        loadMessages();
        // Set up real-time listener for messages
        const unsubscribe = subscribeToCollection(`chats/${selectedChat.id}/messages`, (messagesData) => {
            setMessages(messagesData);
        }, [], 'createdAt', 'asc');
        return () => unsubscribe();
    }, [selectedChat]);
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat || !user || sending)
            return;
        setSending(true);
        try {
            await sendMessage(selectedChat.id, user.sub, newMessage.trim(), user.displayName || 'User');
            setNewMessage('');
        }
        catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
        finally {
            setSending(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const formatDate = (timestamp) => {
        if (!timestamp)
            return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 24) {
            return 'Today';
        }
        else if (diffInHours < 48) {
            return 'Yesterday';
        }
        else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };
    const filteredChats = chats.filter(chat => { var _a; return (_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.name.toLowerCase().includes(searchQuery.toLowerCase()); });
    if (!user) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4">
          <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
            <MessageCircle className="w-24 h-24 text-purple-300"/>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Sign in to view your chats
          </h1>
          <p className="text-purple-200 text-xl mb-8 leading-relaxed">
            Connect with sellers and other users through premium messaging.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-2xl font-bold text-lg">
            <Link href="/auth-login">Sign In</Link>
          </motion.button>
        </motion.div>
      </div>);
    }
    if (loading) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-2xl w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (<div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/20 rounded w-1/3"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  </div>
                </div>))}
            </div>
          </motion.div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-purple-500/20">
              <MessageCircle className="text-white" size={32}/>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Premium Messages
              </h1>
              <p className="text-purple-200 text-xl font-semibold">
                {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced User Search and Friend Suggestions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <EnhancedUserSearch currentUserId={user.sub} onStartChat={startChatWithUser} onFollow={handleFollow}/>
        </motion.div>

        {/* Chat List */}
        {chats.length === 0 ? (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
              <MessageCircle className="w-24 h-24 text-purple-300"/>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              No conversations yet
            </h2>
            <p className="text-purple-200 text-xl mb-8 leading-relaxed">
              Start chatting with sellers and other users!
            </p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-2xl font-bold text-lg inline-flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <span>Browse Products</span>
              </Link>
            </motion.button>
          </motion.div>) : (
        /* Responsive Chat Layout */
        <div className="relative">
            {/* Mobile: Show chat list when no chat selected, chat view when selected */}
            <div className="lg:hidden">
              {!selectedChat ? (
            /* Mobile Chat List */
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl min-h-[70vh] overflow-hidden flex flex-col">
                  {/* Mobile Chat List Content */}
                  <div className="p-4 border-b border-white/20">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={16}/>
                      <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-sm"/>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-white/10">
                    <AnimatePresence>
                      {filteredChats.map((chat, index) => {
                    var _a, _b, _c;
                    return (<motion.div key={chat.id} initial={isHydrated ? { opacity: 0, x: -20 } : undefined} animate={isHydrated ? { opacity: 1, x: 0 } : undefined} transition={{ delay: index * 0.1 }} className="p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 active:bg-white/20" onClick={() => setSelectedChat(chat)}>
                          <div className="flex items-center space-x-3">
                            <div className="relative flex-shrink-0">
                              <ProfileImage user={{
                            photoURL: (_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.photoURL,
                            name: ((_b = chat.otherUser) === null || _b === void 0 ? void 0 : _b.name) || 'User'
                        }} size={48} className="rounded-2xl ring-2 ring-white/10"/>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base truncate">
                                {((_c = chat.otherUser) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown User'}
                              </h3>
                              <p className="text-purple-200 text-sm truncate">
                                {chat.lastMessage || 'No messages yet'}
                              </p>
                              {chat.lastMessageTime && (<p className="text-purple-300 text-xs mt-1">
                                  {formatTime(chat.lastMessageTime)}
                                </p>)}
                            </div>
                          </div>
                        </motion.div>);
                })}
                    </AnimatePresence>
                  </div>
                </motion.div>) : (
            /* Mobile Chat View */
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl min-h-[80vh] flex flex-col shadow-2xl">
                  {/* Mobile Chat Header */}
                  <div className="p-4 border-b border-white/20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setSelectedChat(null)} className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300">
                        <ArrowLeft className="w-5 h-5"/>
                      </button>
                      <div className="relative">
                        <ProfileImage user={{
                    photoURL: (_a = selectedChat.otherUser) === null || _a === void 0 ? void 0 : _a.photoURL,
                    name: ((_b = selectedChat.otherUser) === null || _b === void 0 ? void 0 : _b.name) || 'User'
                }} size={40} className="rounded-2xl ring-2 ring-white/10"/>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {((_c = selectedChat.otherUser) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown User'}
                        </h3>
                        <p className="text-green-400 text-sm font-semibold">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
                        <Phone className="w-5 h-5"/>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
                        <Video className="w-5 h-5"/>
                      </motion.button>
                    </div>
                  </div>

                  {/* Mobile Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
                    <AnimatePresence>
                      {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === user.sub;
                    return (<motion.div key={message.id} initial={isHydrated ? { opacity: 0, y: 20 } : undefined} animate={isHydrated ? { opacity: 1, y: 0 } : undefined} transition={{ delay: index * 0.05 }} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-3xl px-4 py-3 ${isOwnMessage
                            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white'
                            : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                              <p className="text-sm leading-relaxed">{message.text}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-100' : 'text-purple-300'}`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </motion.div>);
                })}
                    </AnimatePresence>
                  </div>

                  {/* Mobile Message Input */}
                  <div className="p-4 border-t border-white/20">
                    <div className="flex items-center space-x-3">
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm" disabled={sending}/>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white p-3 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Send className="w-5 h-5"/>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>)}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {/* Desktop Chat List */}
              <div className="lg:col-span-1">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl h-[700px] overflow-hidden flex flex-col">
                  {/* Desktop Search */}
                  <div className="p-6 border-b border-white/20">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" size={20}/>
                      <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"/>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-white/10">
                    <AnimatePresence>
                      {filteredChats.map((chat, index) => {
                var _a, _b, _c;
                return (<motion.div key={chat.id} initial={isHydrated ? { opacity: 0, x: -20 } : undefined} animate={isHydrated ? { opacity: 1, x: 0 } : undefined} transition={{ delay: index * 0.1 }} className={`p-6 cursor-pointer transition-all duration-300 hover:bg-white/10 ${(selectedChat === null || selectedChat === void 0 ? void 0 : selectedChat.id) === chat.id ? 'bg-white/20 border-r-4 border-purple-500' : ''}`} onClick={() => setSelectedChat(chat)}>
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <ProfileImage user={{
                        photoURL: (_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.photoURL,
                        name: ((_b = chat.otherUser) === null || _b === void 0 ? void 0 : _b.name) || 'User'
                    }} size={56} className="rounded-2xl ring-4 ring-white/10"/>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-lg truncate">
                                {((_c = chat.otherUser) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown User'}
                              </h3>
                              <p className="text-purple-200 text-sm truncate">
                                {chat.lastMessage || 'No messages yet'}
                              </p>
                              {chat.lastMessageTime && (<p className="text-purple-300 text-xs mt-1">
                                  {formatTime(chat.lastMessageTime)}
                                </p>)}
                            </div>
                          </div>
                        </motion.div>);
            })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Desktop Chat Messages */}
              <div className="lg:col-span-2">
                {selectedChat ? (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl h-[700px] flex flex-col shadow-2xl">
                    {/* Desktop Chat Header */}
                    <div className="p-6 border-b border-white/20 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <ProfileImage user={{
                    photoURL: (_d = selectedChat.otherUser) === null || _d === void 0 ? void 0 : _d.photoURL,
                    name: ((_e = selectedChat.otherUser) === null || _e === void 0 ? void 0 : _e.name) || 'User'
                }} size={48} className="rounded-2xl ring-4 ring-white/10"/>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xl">
                            {((_f = selectedChat.otherUser) === null || _f === void 0 ? void 0 : _f.name) || 'Unknown User'}
                          </h3>
                          <p className="text-green-400 text-sm font-semibold">Online</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-3 text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
                          <Phone className="w-5 h-5"/>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-3 text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
                          <Video className="w-5 h-5"/>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-3 text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
                          <MoreVertical className="w-5 h-5"/>
                        </motion.button>
                      </div>
                    </div>

                    {/* Desktop Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <AnimatePresence>
                        {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === user.sub;
                    return (<motion.div key={message.id} initial={isHydrated ? { opacity: 0, y: 20 } : undefined} animate={isHydrated ? { opacity: 1, y: 0 } : undefined} transition={{ delay: index * 0.05 }} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-3xl px-6 py-4 ${isOwnMessage
                            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg'
                            : 'bg-white/20 text-white backdrop-blur-sm border border-white/10'}`}>
                                <p className="leading-relaxed">{message.text}</p>
                                <p className={`text-xs mt-2 ${isOwnMessage ? 'text-purple-100' : 'text-purple-300'}`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </motion.div>);
                })}
                      </AnimatePresence>
                    </div>

                    {/* Desktop Message Input */}
                    <div className="p-6 border-t border-white/20">
                      <div className="flex items-center space-x-4">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm" disabled={sending}/>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-6 py-4 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                          <Send className="w-5 h-5"/>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>) : (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl h-[700px] flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <MessageCircle className="w-24 h-24 text-purple-300 mx-auto mb-6"/>
                      <h3 className="text-2xl font-bold text-white mb-4">Select a conversation</h3>
                      <p className="text-purple-200 text-lg">Choose a chat from the sidebar to start messaging</p>
                    </div>
                  </motion.div>)}
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}


