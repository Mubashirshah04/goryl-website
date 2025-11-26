'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X, Send, MoreVertical, Search, Users, Smile } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
import { getUserChats, sendMessage, getDocument, startChatIfNeeded, followUser, unfollowUser, getFollowStatus, subscribeToUserFollowCounts, subscribeToFollowStatus } from '@/lib/firestore';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import EnhancedUserSearch from '@/components/chat/EnhancedUserSearch';
export default function Messenger({ isOpen, onClose }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const { user } = useAuthStore();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [mobileView, setMobileView] = useState('chats');
    const [isSidebarHidden, setIsSidebarHidden] = useState(false); // New state for sidebar toggle
    const messagesEndRef = useRef(null);
    const [userPresence, setUserPresence] = useState(new Map());
    const [followingStatus, setFollowingStatus] = useState(new Map());
    const [userFollowCounts, setUserFollowCounts] = useState(new Map());
    const [followingUsers, setFollowingUsers] = useState(new Set()); // Track users being followed
    // Initialize services only on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsClient(true);
        }
    }, []);
    // Update user presence when messenger opens/closes
    useEffect(() => {
        if (!user || !isClient)
            return;
        const updatePresence = async (isOnline) => {
            try {
                const presenceData = {
                    userId: user.sub,
                    isOnline,
                    lastSeen: new Date()
                };
                // Use setDoc with merge option to ensure document is created if it doesn't exist
                // or updated if it does exist
                const presenceRef = doc(db, 'userPresence', user.sub);
                await setDoc(presenceRef, presenceData, { merge: true });
                console.log('Presence updated successfully for user:', user.sub, presenceData);
            }
            catch (error) {
                console.error('Error updating presence for user:', user.sub, error);
            }
        };
        if (isOpen) {
            // User is online
            updatePresence(true);
        }
        // Cleanup function to set user as offline when component unmounts
        return () => {
            if (isOpen && user) {
                updatePresence(false);
            }
        };
    }, [user, isOpen, isClient]);
    // Subscribe to presence updates for all chat participants
    useEffect(() => {
        if (!chats.length || !isOpen || !isClient)
            return;
        const unsubscribers = [];
        // Subscribe to presence updates for all chat participants
        chats.forEach(chat => {
            var _a;
            if ((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) {
                const presenceDoc = doc(db, 'userPresence', chat.otherUser.id);
                const unsubscribe = onSnapshot(presenceDoc, (doc) => {
                    if (doc.exists()) {
                        const presenceData = doc.data();
                        setUserPresence(prev => {
                            const newMap = new Map(prev);
                            newMap.set(chat.otherUser.id, {
                                userId: presenceData.userId,
                                isOnline: presenceData.isOnline,
                                lastSeen: presenceData.lastSeen
                            });
                            return newMap;
                        });
                    }
                });
                unsubscribers.push(unsubscribe);
            }
        });
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [chats, isOpen, isClient]);
    // Subscribe to selected chat user's presence updates
    useEffect(() => {
        var _a;
        if (!((_a = selectedChat === null || selectedChat === void 0 ? void 0 : selectedChat.otherUser) === null || _a === void 0 ? void 0 : _a.id) || !isOpen || !isClient)
            return;
        const presenceDoc = doc(db, 'userPresence', selectedChat.otherUser.id);
        const unsubscribe = onSnapshot(presenceDoc, (doc) => {
            if (doc.exists()) {
                const presenceData = doc.data();
                setUserPresence(prev => {
                    const newMap = new Map(prev);
                    newMap.set(selectedChat.otherUser.id, {
                        userId: presenceData.userId,
                        isOnline: presenceData.isOnline,
                        lastSeen: presenceData.lastSeen
                    });
                    return newMap;
                });
            }
        });
        return () => unsubscribe();
    }, [selectedChat, isOpen, isClient]);
    // Start chat with user from search
    const startChatWithUser = async (userId, userName, userPhoto) => {
        if (!user)
            return;
        try {
            // Check if chat already exists
            const existingChat = chats.find(chat => { var _a; return ((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) === userId; });
            if (existingChat) {
                setSelectedChat(existingChat);
                setShowUserSearch(false);
                setMobileView('chat');
                toast.success(`Opened chat with ${userName}`);
                return;
            }
            // Create a new chat with the selected user
            const chatId = await startChatIfNeeded(user.sub, userId);
            const newChat = {
                id: chatId,
                participants: [user.sub, userId],
                lastMessage: null,
                lastMessageTime: null,
                otherUser: {
                    id: userId,
                    name: userName,
                    photoURL: userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName.trim())}`
                }
            };
            setSelectedChat(newChat);
            setChats(prev => [newChat, ...prev]);
            setShowUserSearch(false);
            setMobileView('chat');
            toast.success(`Started chat with ${userName}`);
        }
        catch (error) {
            console.error('Error starting chat:', error);
            toast.error('Failed to start chat');
        }
    };
    // Handle emoji reactions
    const sendReaction = async (emoji) => {
        if (!selectedChat || !user)
            return;
        try {
            await sendMessage(selectedChat.id, user.sub, emoji, user.displayName || 'User');
            toast.success('Reaction sent!');
        }
        catch (error) {
            console.error('Error sending reaction:', error);
            toast.error('Failed to send reaction');
        }
    };
    // Typing indicator
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            // Simulate typing indicator (in real app, you'd send this to other users)
            setTimeout(() => setIsTyping(false), 3000);
        }
    };
    // Quick emoji reactions
    const quickEmojis = ['❤️', '😂', '👍', '😮', '😢', '😡'];
    // Emoji picker - common emojis
    const emojis = [
        '😀', '😂', '🥰', '😎', '🤩', '😍', '🤗', '🤔', '🙄', '😴',
        '🥳', '🤪', '😜', '🤓', '🥺', '😤', '😡', '🤯', '🥶', '😱',
        '👍', '👎', '👏', '🙌', '👌', '🙏', '🤝', '💪', '👀', '🧠',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
        '🌸', '🌺', '🌻', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾',
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
        '❤️', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
    ];
    // Add emoji to message
    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };
    // Check if user is following another user
    const checkFollowingStatus = async (userId) => {
        if (!user)
            return false;
        try {
            const isFollowed = await getFollowStatus(user.sub, userId);
            setFollowingStatus(prev => new Map(prev).set(userId, isFollowed));
            return isFollowed;
        }
        catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    };
    // Follow user with real-time updates
    const handleFollow = async (userId, userName) => {
        if (!user)
            return;
        try {
            // Check if already following
            const isAlreadyFollowing = followingStatus.get(userId);
            if (isAlreadyFollowing) {
                toast.info(`You are already following ${userName}`);
                return;
            }
            // Add to following set to prevent multiple clicks
            setFollowingUsers(prev => new Set(prev).add(userId));
            // Get current follow counts before updating
            const currentUserCounts = userFollowCounts.get(user.sub) || { followers: 0, following: 0 };
            const targetUserCounts = userFollowCounts.get(userId) || { followers: 0, following: 0 };
            // Optimistically update UI
            setFollowingStatus(prev => new Map(prev).set(userId, true));
            // Optimistically update follow counts
            setUserFollowCounts(prev => {
                const newMap = new Map(prev);
                newMap.set(user.sub, {
                    followers: currentUserCounts.followers,
                    following: currentUserCounts.following + 1
                });
                newMap.set(userId, {
                    followers: targetUserCounts.followers + 1,
                    following: targetUserCounts.following
                });
                return newMap;
            });
            // Update the chats list to reflect the new follow status
            const updatedChats = chats.map(chat => {
                var _a;
                if (((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) === userId) {
                    return Object.assign(Object.assign({}, chat), { otherUser: Object.assign(Object.assign({}, chat.otherUser), { isFollowed: true }) });
                }
                return chat;
            });
            setChats(updatedChats);
            // Perform the actual follow operation
            await followUser(user.sub, userId);
            toast.success(`Followed ${userName} successfully!`);
        }
        catch (error) {
            // Rollback on error
            setFollowingStatus(prev => new Map(prev).set(userId, false));
            // Remove from following set on error
            setFollowingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            console.error('Error following user:', error);
            toast.error('Failed to follow user');
        }
    };
    // Unfollow user with real-time updates
    const handleUnfollow = async (userId, userName) => {
        if (!user)
            return;
        try {
            // Check if already not following
            const isAlreadyFollowing = followingStatus.get(userId);
            if (!isAlreadyFollowing) {
                toast.info(`You are not following ${userName}`);
                return;
            }
            // Remove from following set
            setFollowingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            // Get current follow counts before updating
            const currentUserCounts = userFollowCounts.get(user.sub) || { followers: 0, following: 0 };
            const targetUserCounts = userFollowCounts.get(userId) || { followers: 0, following: 0 };
            // Optimistically update UI
            setFollowingStatus(prev => new Map(prev).set(userId, false));
            // Optimistically update follow counts
            setUserFollowCounts(prev => {
                const newMap = new Map(prev);
                newMap.set(user.sub, {
                    followers: currentUserCounts.followers,
                    following: Math.max(0, currentUserCounts.following - 1)
                });
                newMap.set(userId, {
                    followers: Math.max(0, targetUserCounts.followers - 1),
                    following: targetUserCounts.following
                });
                return newMap;
            });
            // Update the chats list to reflect the new follow status
            const updatedChats = chats.map(chat => {
                var _a;
                if (((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) === userId) {
                    return Object.assign(Object.assign({}, chat), { otherUser: Object.assign(Object.assign({}, chat.otherUser), { isFollowed: false }) });
                }
                return chat;
            });
            setChats(updatedChats);
            // Perform the actual unfollow operation
            await unfollowUser(user.sub, userId);
            toast.success(`Unfollowed ${userName} successfully!`);
        }
        catch (error) {
            // Rollback on error
            setFollowingStatus(prev => new Map(prev).set(userId, true));
            // Add back to following set on error
            setFollowingUsers(prev => new Set(prev).add(userId));
            console.error('Error unfollowing user:', error);
            toast.error('Failed to unfollow user');
        }
    };
    // Toggle follow status
    const toggleFollow = async (userId, userName) => {
        const isFollowed = followingStatus.get(userId);
        if (isFollowed) {
            await handleUnfollow(userId, userName);
        }
        else {
            await handleFollow(userId, userName);
        }
    };
    // Update the EnhancedUserSearch onFollow prop
    const handleSearchFollow = async (userId) => {
        var _a;
        if (!user)
            return;
        try {
            // Find the user in chats to get their name
            let userName = 'User';
            for (const chat of chats) {
                if (((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) === userId) {
                    userName = chat.otherUser.name || 'User';
                    break;
                }
            }
            await handleFollow(userId, userName);
        }
        catch (error) {
            console.error('Error following from search:', error);
            toast.error('Failed to follow user');
        }
    };
    // Load chats when component opens
    useEffect(() => {
        if (!user || !isOpen || !isClient)
            return;
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
                            // Check follow status for each user
                            const isFollowed = await checkFollowingStatus(otherUserId);
                            return Object.assign(Object.assign({}, chat), { otherUser: otherUser ? {
                                    id: otherUser.id,
                                    name: otherUser.name || otherUser.displayName || 'Unknown User',
                                    photoURL: otherUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((otherUser.name || otherUser.displayName || 'user').trim())}`,
                                    isFollowed: isFollowed
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
                // Check if it's a permissions error
                if (error.code === 'permission-denied') {
                    toast.error('Please check your Firestore security rules for chats collection');
                }
                else {
                    toast.error('Failed to load chats');
                }
                setChats([]); // Set empty array on error
            }
        };
        loadChats();
    }, [user, isOpen]);
    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !user || loading)
            return;
        setLoading(true);
        try {
            // Simplified message sending without file upload
            await sendMessage(selectedChat.id, user.sub, newMessage.trim(), user.displayName || 'User');
            setNewMessage('');
        }
        catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
        finally {
            setLoading(false);
        }
    };
    // Filter chats based on search
    const filteredChats = chats.filter(chat => { var _a; return (_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.name.toLowerCase().includes(searchQuery.toLowerCase()); });
    // Format time
    const formatTime = (timestamp) => {
        if (!timestamp)
            return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    // Format last seen time
    const formatLastSeen = (timestamp) => {
        if (!timestamp)
            return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'just now';
        if (diffMins < 60)
            return `${diffMins} min ago`;
        if (diffHours < 24)
            return `${diffHours} hr ago`;
        return `${diffDays} day ago`;
    };
    // Handle back to chats list
    const handleBackToChats = () => {
        setSelectedChat(null);
        setMobileView('chats');
    };
    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarHidden(!isSidebarHidden);
    };
    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0 && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
    }, [messages]);
    // Also scroll to bottom when user is typing a new message
    useEffect(() => {
        if (newMessage && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
    }, [newMessage]);
    // Subscribe to user profile updates for real-time follow count updates
    useEffect(() => {
        if (!chats.length || !isOpen || !isClient || !user)
            return;
        const unsubscribers = [];
        // Subscribe to profile updates for all chat participants
        chats.forEach(chat => {
            var _a;
            if ((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.id) {
                // Subscribe to user follow count updates
                const unsubscribeFollowCounts = subscribeToUserFollowCounts(chat.otherUser.id, (counts) => {
                    setUserFollowCounts(prev => {
                        const newMap = new Map(prev);
                        newMap.set(chat.otherUser.id, counts);
                        return newMap;
                    });
                });
                // Subscribe to follow status updates
                const unsubscribeFollowStatus = subscribeToFollowStatus(user.sub, chat.otherUser.id, (isFollowing) => {
                    setFollowingStatus(prev => {
                        const newMap = new Map(prev);
                        newMap.set(chat.otherUser.id, isFollowing);
                        return newMap;
                    });
                    // Update chat list with follow status
                    setChats(prevChats => prevChats.map(c => {
                        var _a, _b;
                        if (((_a = c.otherUser) === null || _a === void 0 ? void 0 : _a.id) === ((_b = chat.otherUser) === null || _b === void 0 ? void 0 : _b.id) && c.otherUser) {
                            return Object.assign(Object.assign({}, c), { otherUser: Object.assign(Object.assign({}, c.otherUser), { isFollowed: isFollowing }) });
                        }
                        return c;
                    }));
                });
                unsubscribers.push(unsubscribeFollowCounts);
                unsubscribers.push(unsubscribeFollowStatus);
            }
        });
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [chats, isOpen, isClient, user]);
    // Subscribe to current user's profile updates
    useEffect(() => {
        if (!user || !isOpen || !isClient)
            return;
        // Subscribe to current user follow count updates
        const unsubscribe = subscribeToUserFollowCounts(user.sub, (counts) => {
            setUserFollowCounts(prev => {
                const newMap = new Map(prev);
                newMap.set(user.sub, counts);
                return newMap;
            });
        });
        return () => unsubscribe();
    }, [user, isOpen, isClient]);
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-lg w-full max-w-5xl h-[85vh] flex flex-col">
        <style jsx>{`
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @media (max-width: 768px) {
            .mobile-fullscreen {
              width: 100vw !important;
              height: 100vh !important;
              max-width: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-purple-600"/>
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={toggleSidebar} className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100" title={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}>
              {isSidebarHidden ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>)}
            </button>
            <button onClick={() => setShowUserSearch(!showUserSearch)} className={`p-2 rounded-lg transition-colors ${showUserSearch
            ? 'bg-purple-100 text-purple-600'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`} title="Find new contacts">
              <Users className="w-5 h-5"/>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Enhanced User Search */}
        {showUserSearch && (<div className="p-4 border-b border-gray-200 bg-gray-50">
            <EnhancedUserSearch currentUserId={(user === null || user === void 0 ? void 0 : user.sub) || ''} onStartChat={startChatWithUser} onFollow={handleSearchFollow} followingStatus={followingStatus}/>
          </div>)}

        <div className="flex flex-1 overflow-hidden">
          {/* Chats List - WhatsApp style */}
          <div className={`border-r border-gray-200 flex flex-col transition-all duration-300 ${isSidebarHidden
            ? 'w-0 md:w-0 overflow-hidden'
            : 'w-full md:w-1/3'} ${
        // On mobile, hide sidebar when viewing chat
        (window.innerWidth < 768 && mobileView === 'chat') ? 'hidden' : ''}`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
              </div>
            </div>
            
            {/* Chats List */}
            <div className="flex-1 overflow-y-auto bg-white scrollbar-hidden">
              {filteredChats.length === 0 ? (<div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300"/>
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Use the search feature to find people to chat with</p>
                </div>) : (filteredChats.map((chat) => {
            var _a, _b, _c, _d;
            return (<motion.div key={chat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => {
                    setSelectedChat(chat);
                    // For mobile, switch to chat view
                    if (window.innerWidth < 768) {
                        setMobileView('chat');
                    }
                }} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${(selectedChat === null || selectedChat === void 0 ? void 0 : selectedChat.id) === chat.id ? 'bg-gray-100' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <img src={((_a = chat.otherUser) === null || _a === void 0 ? void 0 : _a.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${((_b = chat.otherUser) === null || _b === void 0 ? void 0 : _b.name) || 'user'}`} alt={((_c = chat.otherUser) === null || _c === void 0 ? void 0 : _c.name) || 'User'} width="40" height="40" className="rounded-full" referrerPolicy="no-referrer"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {((_d = chat.otherUser) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        {chat.lastMessageTime && (<p className="text-xs text-gray-400 mt-1">
                            {formatTime(chat.lastMessageTime)}
                          </p>)}
                      </div>
                    </div>
                  </motion.div>);
        }))}
            </div>
          </div>

          {/* Chat Area - WhatsApp style */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarHidden
            ? 'w-full md:w-full'
            : 'w-full md:w-2/3'} ${
        // On mobile, show chat area when viewing chat
        (window.innerWidth < 768 && mobileView === 'chats') ? 'hidden' : ''}`}>
            {selectedChat ? (<>
                {/* Chat Header - WhatsApp style */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <button onClick={handleBackToChats} className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <div className="relative flex-shrink-0">
                      <img src={((_a = selectedChat.otherUser) === null || _a === void 0 ? void 0 : _a.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${((_b = selectedChat.otherUser) === null || _b === void 0 ? void 0 : _b.name) || 'user'}`} alt={((_c = selectedChat.otherUser) === null || _c === void 0 ? void 0 : _c.name) || 'User'} width="32" height="32" className="rounded-full" referrerPolicy="no-referrer"/>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm md:text-base">{((_d = selectedChat.otherUser) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown User'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {((_f = userPresence.get(((_e = selectedChat.otherUser) === null || _e === void 0 ? void 0 : _e.id) || '')) === null || _f === void 0 ? void 0 : _f.isOnline)
                ? 'Online'
                : `Last seen ${formatLastSeen((_h = userPresence.get(((_g = selectedChat.otherUser) === null || _g === void 0 ? void 0 : _g.id) || '')) === null || _h === void 0 ? void 0 : _h.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button onClick={() => { var _a; return ((_a = selectedChat.otherUser) === null || _a === void 0 ? void 0 : _a.id) && toggleFollow(selectedChat.otherUser.id, selectedChat.otherUser.name || 'User'); }} disabled={followingStatus.get(((_j = selectedChat.otherUser) === null || _j === void 0 ? void 0 : _j.id) || '') === undefined} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${((_k = selectedChat.otherUser) === null || _k === void 0 ? void 0 : _k.isFollowed)
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'} ${followingStatus.get(((_l = selectedChat.otherUser) === null || _l === void 0 ? void 0 : _l.id) || '') === undefined ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {((_m = selectedChat.otherUser) === null || _m === void 0 ? void 0 : _m.isFollowed) ? 'Unfollow' : 'Follow'}
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <MoreVertical className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

                {/* Messages - WhatsApp style */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 bg-gray-100 scrollbar-hidden">
                  {messages.length === 0 ? (<div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300"/>
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start the conversation!</p>
                    </div>) : (<>
                      {messages.map((message) => (<div key={message.id} className={`flex ${message.senderId === (user === null || user === void 0 ? void 0 : user.sub) ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg relative group ${message.senderId === (user === null || user === void 0 ? void 0 : user.sub)
                        ? 'bg-green-100 text-gray-900 rounded-tr-none'
                        : 'bg-white text-gray-900 rounded-tl-none'}`}>
                            {/* Check if message is an image */}
                            {/* Removed image display functionality */}
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${message.senderId === (user === null || user === void 0 ? void 0 : user.sub) ? 'text-gray-500' : 'text-gray-500'}`}>
                              {formatTime(message.createdAt)}
                              {/* Removed message status indicators as requested */}
                            </p>
                            
                            {/* Quick Reaction Buttons */}
                            <div className="absolute -top-8 left-0 bg-white rounded-full shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              {quickEmojis.map((emoji, idx) => (<button key={idx} onClick={() => sendReaction(emoji)} className="hover:scale-125 transition-transform text-sm" title={`React with ${emoji}`}>
                                  {emoji}
                                </button>))}
                            </div>
                          </div>
                        </div>))}
                      
                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (<div className="flex justify-start">
                          <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>)}
                      
                      {/* Scroll to bottom anchor - for auto-scrolling */}
                      <div ref={messagesEndRef}/>
                    </>)}
                </div>

                {/* Message Input - WhatsApp style */}
                <div className="p-3 md:p-4 border-t border-gray-200 bg-white relative">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
                      <Smile className="w-5 h-5"/>
                    </button>
                    <input type="text" value={newMessage} onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
            }} placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={loading || !newMessage.trim()} className="bg-green-500 text-white p-2 rounded-full disabled:opacity-50 hover:bg-green-600 transition-all">
                      <Send className="w-4 h-4"/>
                    </motion.button>
                  </form>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (<div className="absolute bottom-full left-0 mb-2 w-64 h-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                      <div className="grid grid-cols-10 gap-1 p-2 h-full overflow-y-auto">
                        {emojis.map((emoji, index) => (<button key={index} onClick={() => addEmoji(emoji)} className="text-xl p-1 hover:bg-gray-100 rounded transition-colors" title={emoji}>
                            {emoji}
                          </button>))}
                      </div>
                    </div>)}
                </div>
              </>) : (<div className="flex-1 flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500 p-4">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm mb-4">Choose someone to start chatting with</p>
                  <button onClick={() => setShowUserSearch(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all">
                    Find People to Chat
                  </button>
                </div>
              </div>)}
          </div>
        </div>
      </motion.div>
    </div>);
}


