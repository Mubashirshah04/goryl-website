'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, UserPlus, MessageCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import ProfileImage from '@/components/ProfileImage';
export default function EnhancedUserSearch({ currentUserId, onStartChat, onFollow, followingStatus = new Map() }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    // Enhanced search function
    const searchUsers = async (query) => {
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
                const userData = doc.data();
                // Clean user name to remove strange text
                const cleanedName = (userData.name || userData.displayName || 'Unknown User')
                    .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
                    .trim() || 'User';
                return Object.assign(Object.assign({ id: doc.id }, userData), { name: cleanedName });
            })
                .filter((userData) => {
                var _a, _b, _c;
                // Exclude current user from search results
                if (userData.id === currentUserId)
                    return false;
                const name = ((_a = userData.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                const email = ((_b = userData.email) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                const displayName = ((_c = userData.displayName) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '';
                const searchTerm = query.toLowerCase();
                return name.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    displayName.includes(searchTerm);
            })
                // Remove duplicates by ID and filter out users with example.com images
                .filter((user, index, self) => index === self.findIndex((u) => u.id === user.id) &&
                (!user.photoURL || !user.photoURL.includes('example.com')))
                .map((userData) => {
                var _a, _b;
                return ({
                    id: userData.id,
                    name: userData.name,
                    username: userData.username || ((_a = userData.displayName) === null || _a === void 0 ? void 0 : _a.toLowerCase().replace(/\s+/g, '')) || ((_b = userData.email) === null || _b === void 0 ? void 0 : _b.split('@')[0]) || 'user',
                    email: userData.email || '',
                    // Preserve all image fields
                    customPhotoURL: userData.customPhotoURL || '',
                    photoURL: userData.photoURL || '',
                    profilePic: userData.profilePic || '',
                    avatar: userData.avatar || '',
                    isOnline: Math.random() > 0.5, // Random online status for demo
                    lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
                });
            });
            setSearchResults(realUsers);
        }
        catch (error) {
            console.error('Error searching users:', error);
            toast.error('Failed to search users');
            setSearchResults([]);
        }
        finally {
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
                    const userData = doc.data();
                    // Clean user name to remove strange text
                    const cleanedName = (userData.name || userData.displayName || 'Unknown User')
                        .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
                        .trim() || 'User';
                    return Object.assign(Object.assign({ id: doc.id }, userData), { name: cleanedName });
                })
                    .filter((userData) => userData.id !== currentUserId)
                    // Remove duplicates by ID and filter out users with example.com images
                    .filter((user, index, self) => index === self.findIndex((u) => u.id === user.id) &&
                    (!user.photoURL || !user.photoURL.includes('example.com')))
                    .map((userData) => ({
                    id: userData.id,
                    name: userData.name,
                    // Preserve all image fields
                    customPhotoURL: userData.customPhotoURL || '',
                    photoURL: userData.photoURL || '',
                    profilePic: userData.profilePic || '',
                    avatar: userData.avatar || '',
                    mutualFriends: Math.floor(Math.random() * 5),
                    isVerified: Math.random() > 0.7
                }));
                setSuggestedUsers(suggested);
            }
            catch (error) {
                console.error('Error loading suggested users:', error);
            }
        };
        loadSuggestedUsers();
    }, [currentUserId]);
    const handleFollow = (userId) => {
        // Check if already following
        if (followingStatus.get(userId)) {
            toast.info('You are already following this user');
            return;
        }
        // Call the parent onFollow function
        onFollow(userId);
    };
    return (<div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find People</h2>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => setActiveTab('search')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'search'
            ? 'bg-purple-600 text-white'
            : 'text-gray-600 hover:text-gray-900'}`}>
            <Search className="w-4 h-4 inline mr-2"/>
            Search
          </button>
          <button onClick={() => setActiveTab('suggested')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'suggested'
            ? 'bg-purple-600 text-white'
            : 'text-gray-600 hover:text-gray-900'}`}>
            <Users className="w-4 h-4 inline mr-2"/>
            Suggested
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input type="text" placeholder="Search by name, email, or username..." value={searchQuery} onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
            }} className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
          </div>
          
          {/* Loading */}
          {searching && (<div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            </div>)}
          
          {/* Search Results */}
          {searchResults.length > 0 && (<div className="space-y-3 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (<motion.div key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <div className="relative">
                    <ProfileImage user={{
                        customPhotoURL: user.customPhotoURL,
                        photoURL: user.photoURL,
                        profilePic: user.profilePic,
                        avatar: user.avatar,
                        name: user.name
                    }} size={48} className="rounded-full"/>
                    {user.isOnline && (<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {user.name || 'User'}
                    </h3>
                    <p className="text-sm text-gray-300">@{user.username}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleFollow(user.id)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50" disabled={followingStatus.get(user.id)}>
                      <UserPlus className="w-4 h-4"/>
                      <span>{followingStatus.get(user.id) ? 'Following' : 'Follow'}</span>
                    </button>
                    <button onClick={() => onStartChat(user.id, user.name, user.photoURL)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4"/>
                      <span>Chat</span>
                    </button>
                  </div>
                </motion.div>))}
            </div>)}
          
          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !searching && (<div className="text-center py-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500"/>
              </div>
              <p className="text-gray-300 text-lg">No users found</p>
              <p className="text-gray-400 text-sm">Try searching with different keywords</p>
            </div>)}
        </motion.div>)}

      {/* Suggested Tab */}
      {activeTab === 'suggested' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestedUsers.map((user) => (<motion.div key={user.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <ProfileImage user={{
                    customPhotoURL: user.customPhotoURL,
                    photoURL: user.photoURL,
                    profilePic: user.profilePic,
                    avatar: user.avatar,
                    name: user.name
                }} size={40} className="rounded-full"/>
                    {user.isVerified && (<div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white"/>
                      </div>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.name || 'User'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {user.mutualFriends} mutual friends
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button onClick={() => handleFollow(user.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={followingStatus.get(user.id)}>
                    {followingStatus.get(user.id) ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={() => onStartChat(user.id, user.name, user.photoURL)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                    Chat
                  </button>
                </div>
              </motion.div>))}
          </div>
          
          {suggestedUsers.length === 0 && (<div className="text-center py-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400 dark:text-gray-500"/>
              </div>
              <p className="text-gray-300 text-lg">No suggestions yet</p>
              <p className="text-gray-400 text-sm">We'll show you people you might know</p>
            </div>)}
        </motion.div>)}
    </div>);
}
