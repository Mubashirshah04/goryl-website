'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, MoreVertical, Search, Users, Smile, Heart, ThumbsUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
import {
  getUserChats,
  getMessages as getChatMessages,
  sendMessage,
  getChatRoom as startChatIfNeeded,
  subscribeToUserChats
} from '@/lib/awsChatService';
import {
  followUser,
  unfollowUser,
  isFollowing as getFollowStatus
} from '@/lib/followService';
// Firestore removed - using AWS services only
import { getUserProfile } from '@/lib/awsUserService';
import EnhancedUserSearch from './chat/EnhancedUserSearch';

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageTime: any;
  otherUser?: {
    id: string;
    name: string;
    photoURL: string;
    isFollowed?: boolean;
  };
}

interface ChatOtherUser {
  id: string;
  name: string;
  photoURL: string;
  isFollowed?: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  status?: 'sent' | 'delivered' | 'read'; // Add status property for message indicators
}

interface UserData {
  id: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  followers?: number;
  following?: number;
  [key: string]: any;
}

interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: any;
}

interface MessengerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Messenger({ isOpen, onClose }: MessengerProps) {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mobileView, setMobileView] = useState<'chats' | 'chat'>('chats');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false); // New state for sidebar toggle
  const [isMobile, setIsMobile] = useState(false); // Track mobile viewport
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map());
  const [followingStatus, setFollowingStatus] = useState<Map<string, boolean>>(new Map());
  const [userFollowCounts, setUserFollowCounts] = useState<Map<string, { followers: number; following: number }>>(new Map());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set()); // Track users being followed

  // Initialize services only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      // Check if mobile on mount
      setIsMobile(window.innerWidth < 768);

      // Handle resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when dialog closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Update user presence when messenger opens/closes
  useEffect(() => {
    if (!user || !isClient) return;

    const updatePresence = async (isOnline: boolean) => {
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
      } catch (error) {
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
    if (!chats.length || !isOpen || !isClient) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to presence updates for all chat participants
    chats.forEach(chat => {
      if (chat.otherUser?.id) {
        const presenceDoc = doc(db, 'userPresence', chat.otherUser.id);

        const unsubscribe = onSnapshot(presenceDoc, (doc: any) => {
          if (doc.exists()) {
            const presenceData = doc.data();
            setUserPresence(prev => {
              const newMap = new Map(prev);
              newMap.set(chat.otherUser!.id, {
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
    if (!selectedChat?.otherUser?.id || !isOpen || !isClient) return;

    const presenceDoc = doc(db, 'userPresence', selectedChat.otherUser.id);

    const unsubscribe = onSnapshot(presenceDoc, (doc: any) => {
      if (doc.exists()) {
        const presenceData = doc.data();
        setUserPresence(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedChat.otherUser!.id, {
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

  // Load and subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat?.id || !isOpen || !isClient) {
      setMessages([]);
      return;
    }

    console.log('Subscribing to messages for chat:', selectedChat.id);

    // Real-time subscription to messages
    const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot: any) => {
        const messagesData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt || new Date().toISOString()
        })) as Message[];

        console.log('Messages received:', messagesData.length);
        setMessages(messagesData);
      },
      (error: any) => {
        console.error('Error subscribing to messages:', error);
        toast.error('Failed to load messages');
      }
    );

    return () => {
      console.log('Unsubscribing from messages');
      unsubscribe();
    };
  }, [selectedChat?.id, isOpen, isClient]);

  // Start chat with user from search
  const startChatWithUser = async (userId: string, userName: string, userPhoto: string) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => chat.otherUser?.id === userId);
      if (existingChat) {
        setSelectedChat(existingChat);
        setShowUserSearch(false);
        setMobileView('chat');
        toast.success(`Opened chat with ${userName}`);
        return;
      }

      // Create a new chat with the selected user
      const chatId = await startChatIfNeeded(user.sub, userId);

      const newChat: Chat = {
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
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  // Handle emoji reactions
  const sendReaction = async (emoji: string) => {
    if (!selectedChat || !user) return;

    try {
      await sendMessage(
        user.sub,
        selectedChat.otherUser?.id || '',
        emoji,
        user.name || 'User',
        '' // Photo URL
      );
      toast.success('Reaction sent!');
    } catch (error) {
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
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Check if user is following another user
  const checkFollowingStatus = async (userId: string) => {
    if (!user) return false;
    try {
      const isFollowed = await getFollowStatus(user.sub, userId);
      setFollowingStatus(prev => new Map(prev).set(userId, isFollowed));
      return isFollowed;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  // Follow user with real-time updates
  const handleFollow = async (userId: string, userName: string) => {
    if (!user) return;
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
        if (chat.otherUser?.id === userId) {
          return {
            ...chat,
            otherUser: {
              ...chat.otherUser,
              isFollowed: true
            }
          };
        }
        return chat;
      });
      setChats(updatedChats);

      // Perform the actual follow operation
      await followUser(user.sub, userId);

      toast.success(`Followed ${userName} successfully!`);
    } catch (error) {
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
  const handleUnfollow = async (userId: string, userName: string) => {
    if (!user) return;
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
        if (chat.otherUser?.id === userId) {
          return {
            ...chat,
            otherUser: {
              ...chat.otherUser,
              isFollowed: false
            }
          };
        }
        return chat;
      });
      setChats(updatedChats);

      // Perform the actual unfollow operation
      await unfollowUser(user.sub, userId);

      toast.success(`Unfollowed ${userName} successfully!`);
    } catch (error) {
      // Rollback on error
      setFollowingStatus(prev => new Map(prev).set(userId, true));
      // Add back to following set on error
      setFollowingUsers(prev => new Set(prev).add(userId));
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  // Toggle follow status
  const toggleFollow = async (userId: string, userName: string) => {
    const isFollowed = followingStatus.get(userId);
    if (isFollowed) {
      await handleUnfollow(userId, userName);
    } else {
      await handleFollow(userId, userName);
    }
  };

  // Update the EnhancedUserSearch onFollow prop
  const handleSearchFollow = async (userId: string) => {
    if (!user) return;
    try {
      // Find the user in chats to get their name
      let userName = 'User';
      for (const chat of chats) {
        if (chat.otherUser?.id === userId) {
          userName = chat.otherUser.name || 'User';
          break;
        }
      }

      await handleFollow(userId, userName);
    } catch (error) {
      console.error('Error following from search:', error);
      toast.error('Failed to follow user');
    }
  };

  // Load chats when component opens
  useEffect(() => {
    if (!user || !isOpen || !isClient) return;

    const loadChats = async () => {
      try {
        const chatsData = await getUserChats(user.sub);

        // Get other user details for each chat
        const chatsWithUsers = await Promise.all(
          chatsData.map(async (chat: any) => {
            const otherUserId = chat.participants?.find((id: string) => id !== user.sub);
            if (otherUserId) {
              try {
                const otherUser = await getUserProfile(otherUserId) as UserData | null;
                // Check follow status for each user
                const isFollowed = await checkFollowingStatus(otherUserId);
                return {
                  ...chat,
                  otherUser: otherUser ? {
                    id: otherUser.id,
                    name: otherUser.name || otherUser.displayName || 'Unknown User',
                    photoURL: otherUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((otherUser.name || otherUser.displayName || 'user').trim())}`,
                    isFollowed: isFollowed
                  } : undefined
                };
              } catch (error) {
                console.error('Error fetching user:', error);
                return chat;
              }
            }
            return chat;
          })
        );

        setChats(chatsWithUsers);
      } catch (error: any) {
        console.error('Error loading chats:', error);
        // Check if it's a permissions error
        if (error.code === 'permission-denied') {
          toast.error('Please check your Firestore security rules for chats collection');
        } else {
          toast.error('Failed to load chats');
        }
        setChats([]); // Set empty array on error
      }
    };

    loadChats();
  }, [user, isOpen]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user || loading) return;

    setLoading(true);
    try {
      // Simplified message sending without file upload
      await sendMessage(
        user.sub,
        selectedChat.otherUser?.id || '',
        newMessage.trim(),
        user.name || 'User',
        '' // Photo URL
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format last seen time
  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
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
    if (!chats.length || !isOpen || !isClient || !user) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to profile updates for all chat participants
    chats.forEach(chat => {
      if (chat.otherUser?.id) {
        // Subscribe to user follow count updates
        const unsubscribeFollowCounts = subscribeToUserFollowCounts(chat.otherUser.id, (counts: any) => {
          setUserFollowCounts(prev => {
            const newMap = new Map(prev);
            newMap.set(chat.otherUser!.id, counts);
            return newMap;
          });
        });

        // Subscribe to follow status updates
        const unsubscribeFollowStatus = subscribeToFollowStatus(user.sub, chat.otherUser.id, (isFollowing: boolean) => {
          setFollowingStatus(prev => {
            const newMap = new Map(prev);
            newMap.set(chat.otherUser!.id, isFollowing);
            return newMap;
          });

          // Update chat list with follow status
          setChats(prevChats =>
            prevChats.map(c => {
              if (c.otherUser?.id === chat.otherUser?.id && c.otherUser) {
                return {
                  ...c,
                  otherUser: {
                    ...c.otherUser,
                    isFollowed: isFollowing
                  }
                };
              }
              return c;
            })
          );
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
    if (!user || !isOpen || !isClient) return;

    // Subscribe to current user follow count updates
    const unsubscribe = subscribeToUserFollowCounts(user.sub, (counts: any) => {
      setUserFollowCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(user.sub, counts);
        return newMap;
      });
    });

    return () => unsubscribe();
  }, [user, isOpen, isClient]);

  // Render to portal (document.body) to ensure it's above header
  const messengerContent = isOpen ? (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-0 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isMobile) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100
      }}
    >
      <AnimatePresence>
        <motion.div
          key="messenger-dialog"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`bg-white dark:bg-gray-900 w-full h-full flex flex-col shadow-2xl relative ${isMobile
            ? 'rounded-none'
            : 'md:rounded-xl md:w-[95vw] md:max-w-[95vw] md:h-[95vh] md:max-h-[95vh] md:my-auto md:mx-auto'
            }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            height: isMobile ? '100vh' : '95vh',
            maxHeight: isMobile ? '100vh' : '95vh',
            width: isMobile ? '100%' : '95vw',
            maxWidth: isMobile ? '100%' : '95vw'
          }}
        >
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
          {/* Header - Hide when chat is selected */}
          {!selectedChat && (
            <>
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  {!isMobile && (
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                      title={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
                    >
                      {isSidebarHidden ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowUserSearch(!showUserSearch)}
                    className={`p-2 rounded-lg transition-colors ${showUserSearch
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    title="Find new contacts"
                  >
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Enhanced User Search */}
              {showUserSearch && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <EnhancedUserSearch
                    currentUserId={user?.sub || ''}
                    onStartChat={startChatWithUser}
                    onFollow={handleSearchFollow}
                    followingStatus={followingStatus}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-1 overflow-hidden relative">
            {/* Chats List - Hide when chat is selected */}
            {!selectedChat && (
              <div className={`border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 bg-white dark:bg-gray-900 ${isSidebarHidden && !isMobile
                ? 'w-0 overflow-hidden'
                : isMobile && mobileView === 'chat'
                  ? 'hidden'
                  : isMobile
                    ? 'w-full'
                    : 'w-full md:w-1/3'
                }`}>
                {/* Search */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Chats List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-hidden">
                  {filteredChats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Use the search feature to find people to chat with</p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          setSelectedChat(chat);
                          // For mobile, switch to chat view
                          if (isMobile) {
                            setMobileView('chat');
                          }
                        }}
                        className={`p-2 md:p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={chat.otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.otherUser?.name || 'user'}`}
                              alt={chat.otherUser?.name || 'User'}
                              width="40"
                              height="40"
                              className="rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                              {chat.otherUser?.name || 'Unknown User'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                            {chat.lastMessageTime && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTime(chat.lastMessageTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Chat Area - Full screen when chat is selected */}
            {selectedChat ? (
              <div className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900">
                {/* Chat Header - Back button + User name */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-shrink-0">
                        <img
                          src={selectedChat.otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.otherUser?.name || 'user'}`}
                          alt={selectedChat.otherUser?.name || 'User'}
                          width="32"
                          height="32"
                          className="rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                          {selectedChat.otherUser?.name || selectedChat.otherUser?.username || 'Unknown User'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {userPresence.get(selectedChat.otherUser?.id || '')?.isOnline
                            ? 'Online'
                            : `Last seen ${formatLastSeen(userPresence.get(selectedChat.otherUser?.id || '')?.lastSeen)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages - WhatsApp style */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 bg-gray-100 dark:bg-gray-800 scrollbar-hidden">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] md:max-w-md px-3 py-2 rounded-lg relative group ${message.senderId === user?.sub
                              ? 'bg-purple-500 dark:bg-purple-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                              }`}
                          >
                            {/* Check if message is an image */}
                            {/* Removed image display functionality */}
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${message.senderId === user?.sub ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                              {formatTime(message.createdAt)}
                              {/* Removed message status indicators as requested */}
                            </p>

                            {/* Quick Reaction Buttons */}
                            <div className="absolute -top-8 left-0 bg-white rounded-full shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              {quickEmojis.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => sendReaction(emoji)}
                                  className="hover:scale-125 transition-transform text-sm"
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg rounded-tl-none">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scroll to bottom anchor - for auto-scrolling */}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input - WhatsApp style */}
                <div className="p-2 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Smile className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-3 md:px-4 py-2 text-sm md:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                      className="bg-purple-500 dark:bg-purple-600 text-white p-2 md:p-2.5 rounded-full disabled:opacity-50 hover:bg-purple-600 dark:hover:bg-purple-700 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </form>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 md:w-80 h-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                      <div className="grid grid-cols-10 gap-1 p-2 h-full overflow-y-auto">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl p-1 hover:bg-gray-100 rounded transition-colors"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`flex-1 flex flex-col transition-all duration-300 bg-white dark:bg-gray-900 ${isSidebarHidden && !isMobile
                ? 'w-full md:w-full'
                : isMobile
                  ? mobileView === 'chats' ? 'hidden' : 'w-full'
                  : 'w-full md:w-2/3'
                }`}>
                <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                    <MessageCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-base md:text-lg font-medium mb-2 text-gray-900 dark:text-white">Select a conversation</h3>
                    <p className="text-xs md:text-sm mb-4">Choose someone to start chatting with</p>
                    <button
                      onClick={() => setShowUserSearch(true)}
                      className="bg-purple-500 dark:bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 transition-all text-sm md:text-base"
                    >
                      Find People to Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  ) : null;

  // Use portal to render at body level for proper z-index stacking
  if (typeof window !== 'undefined') {
    return createPortal(messengerContent, document.body);
  }

  return null;
}

