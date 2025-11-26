'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  UserPlus, 
  MessageCircle, 
  Star,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import ProfileImage from '@/components/ProfileImage';

interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  photoURL: string;
  customPhotoURL?: string;  // Firebase storage URL
  profilePic?: string;      // Alternative field name
  avatar?: string;          // Another alternative field name
  isOnline: boolean;
  lastSeen: Date;
}

interface SuggestedUser {
  id: string;
  name: string;
  photoURL: string;
  customPhotoURL?: string;  // Firebase storage URL
  profilePic?: string;      // Alternative field name
  avatar?: string;          // Another alternative field name
  mutualFriends: number;
  isVerified: boolean;
}

interface EnhancedUserSearchProps {
  currentUserId: string;
  onStartChat: (userId: string, userName: string, userPhoto: string) => void;
  onFollow: (userId: string) => void;
  followingStatus?: Map<string, boolean>; // Add following status prop
}

export default function EnhancedUserSearch({ 
  currentUserId, 
  onStartChat, 
  onFollow,
  followingStatus = new Map()
}: EnhancedUserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'suggested'>('search');

  // Enhanced search function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Query real users from Firebase
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const realUsers = usersSnapshot.docs
        .map(doc => {
          const userData: any = doc.data();
          // Clean user name to remove strange text
          const cleanedName = (userData.name || userData.displayName || 'Unknown User')
            .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
            .trim() || 'User';
          
          return {
            id: doc.id,
            ...userData,
            name: cleanedName
          };
        })
        .filter((userData: any) => {
          // Exclude current user from search results
          if (userData.id === currentUserId) return false;
          
          const name = userData.name?.toLowerCase() || '';
          const email = userData.email?.toLowerCase() || '';
          const displayName = userData.displayName?.toLowerCase() || '';
          const searchTerm = query.toLowerCase();
          
          return name.includes(searchTerm) || 
                 email.includes(searchTerm) || 
                 displayName.includes(searchTerm);
        })
        // Remove duplicates by ID and filter out users with example.com images
        .filter((user: any, index: any, self: any) => 
          index === self.findIndex((u: any) => u.id === user.id) && 
          (!user.photoURL || !user.photoURL.includes('example.com'))
        )
        .map((userData: any) => ({
          id: userData.id,
          name: userData.name,
          username: userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '') || userData.email?.split('@')[0] || 'user',
          email: userData.email || '',
          // Preserve all image fields
          customPhotoURL: userData.customPhotoURL || '',
          photoURL: userData.photoURL || '',
          profilePic: userData.profilePic || '',
          avatar: userData.avatar || '',
          isOnline: Math.random() > 0.5, // Random online status for demo
          lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        }))

      setSearchResults(realUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Load suggested users
  React.useEffect(() => {
    const loadSuggestedUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const suggested = usersSnapshot.docs
          .map(doc => {
            const userData: any = doc.data();
            // Clean user name to remove strange text
            const cleanedName = (userData.name || userData.displayName || 'Unknown User')
              .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
              .trim() || 'User';
            
            return {
              id: doc.id,
              ...userData,
              name: cleanedName
            };
          })
          .filter((userData: any) => userData.id !== currentUserId)
          // Remove duplicates by ID and filter out users with example.com images
          .filter((user: any, index: any, self: any) => 
            index === self.findIndex((u: any) => u.id === user.id) && 
            (!user.photoURL || !user.photoURL.includes('example.com'))
          )
          .map((userData: any) => ({
            id: userData.id,
            name: userData.name,
            // Preserve all image fields
            customPhotoURL: userData.customPhotoURL || '',
            photoURL: userData.photoURL || '',
            profilePic: userData.profilePic || '',
            avatar: userData.avatar || '',
            mutualFriends: Math.floor(Math.random() * 5),
            isVerified: Math.random() > 0.7
          }))

        setSuggestedUsers(suggested);
      } catch (error) {
        console.error('Error loading suggested users:', error);
      }
    };

    loadSuggestedUsers();
  }, [currentUserId]);

  const handleFollow = (userId: string) => {
    // Check if already following
    if (followingStatus.get(userId)) {
      toast.info('You are already following this user');
      return;
    }
    
    // Call the parent onFollow function
    onFollow(userId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find People</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('suggested')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'suggested'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Suggested
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 h-full overflow-y-auto max-h-[60vh]"
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          
          {/* Loading */}
          {searching && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 dark:border-purple-500"></div>
            </div>
          )}
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {searchResults.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    <ProfileImage 
                      user={{ 
                        customPhotoURL: user.customPhotoURL,
                        photoURL: user.photoURL,
                        profilePic: user.profilePic,
                        avatar: user.avatar,
                        name: user.name
                      }} 
                      size={48} 
                      className="rounded-full"
                    />
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.name || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFollow(user.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                      disabled={followingStatus.get(user.id)}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{followingStatus.get(user.id) ? 'Following' : 'Follow'}</span>
                    </button>
                    <button
                      onClick={() => onStartChat(user.id, user.name, user.photoURL)}
                      className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No users found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Try searching with different keywords</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Suggested Tab */}
      {activeTab === 'suggested' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 h-full overflow-y-auto max-h-[60vh]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestedUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <ProfileImage 
                      user={{ 
                        customPhotoURL: user.customPhotoURL,
                        photoURL: user.photoURL,
                        profilePic: user.profilePic,
                        avatar: user.avatar,
                        name: user.name
                      }} 
                      size={40} 
                      className="rounded-full"
                    />
                    {user.isVerified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.name || 'User'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.mutualFriends} mutual friends
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleFollow(user.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={followingStatus.get(user.id)}
                  >
                    {followingStatus.get(user.id) ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => onStartChat(user.id, user.name, user.photoURL)}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    Chat
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {suggestedUsers.length === 0 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No suggestions yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">We'll show you people you might know</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}