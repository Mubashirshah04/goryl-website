'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, MapPin, Users, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

import Link from 'next/link';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  photoURL: string;
  bio: string;
  location: string;
  role: 'user' | 'personal_seller' | 'brand' | 'company';
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
}

export default function SearchUsersPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sellers' | 'brands' | 'companies'>('all');
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Search by name, username, or email
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('name', '>=', query),
        where('name', '<=', query + '\uf8ff'),
        orderBy('name'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const searchResults: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== user?.sub) { // Don't include current user
          searchResults.push({
            id: doc.id,
            name: userData.name || 'Unknown',
            username: userData.username || userData.email?.split('@')[0] || 'unknown',
            email: userData.email || '',
            photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
            bio: userData.bio || '',
            location: userData.location || '',
            role: userData.role || 'user',
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            isVerified: userData.isVerified || false
          });
        }
      });

      // Also search by username
      const usernameQuery = query(
        usersRef,
        where('username', '>=', query),
        where('username', '<=', query + '\uf8ff'),
        orderBy('username'),
        limit(20)
      );

      const usernameSnapshot = await getDocs(usernameQuery);
      usernameSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== user?.sub && !searchResults.find(u => u.id === doc.id)) {
          searchResults.push({
            id: doc.id,
            name: userData.name || 'Unknown',
            username: userData.username || userData.email?.split('@')[0] || 'unknown',
            email: userData.email || '',
            photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
            bio: userData.bio || '',
            location: userData.location || '',
            role: userData.role || 'user',
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            isVerified: userData.isVerified || false
          });
        }
      });

      setUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Get nearby users (mock implementation)
  const getNearbyUsers = async () => {
    setLoading(true);
    try {
      // Mock nearby users - in real app, this would use geolocation
      const mockNearbyUsers: UserProfile[] = [
        {
          id: 'nearby-1',
          name: 'Sarah Johnson',
          username: 'sarah_j',
          email: 'sarah@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          bio: 'Fashion enthusiast and local seller',
          location: 'Lahore, Pakistan',
          role: 'personal_seller',
          followersCount: 1250,
          followingCount: 890,
          isVerified: true
        },
        {
          id: 'nearby-2',
          name: 'Ahmed Ali',
          username: 'ahmed_tech',
          email: 'ahmed@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
          bio: 'Tech seller and gadget enthusiast',
          location: 'Karachi, Pakistan',
          role: 'personal_seller',
          followersCount: 2100,
          followingCount: 1200,
          isVerified: false
        },
        {
          id: 'nearby-3',
          name: 'Fatima Khan',
          username: 'fatima_beauty',
          email: 'fatima@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
          bio: 'Beauty products and cosmetics',
          location: 'Islamabad, Pakistan',
          role: 'brand',
          followersCount: 5600,
          followingCount: 2100,
          isVerified: true
        }
      ];
      setNearbyUsers(mockNearbyUsers);
    } catch (error) {
      console.error('Error getting nearby users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    getNearbyUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'sellers') return user.role === 'personal_seller';
    if (filter === 'brands') return user.role === 'brand';
    if (filter === 'companies') return user.role === 'company';
    return true;
  });

  const filteredNearbyUsers = nearbyUsers.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'sellers') return user.role === 'personal_seller';
    if (filter === 'brands') return user.role === 'brand';
    if (filter === 'companies') return user.role === 'company';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Search Users</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'All Users', icon: Users },
            { key: 'sellers', label: 'Sellers', icon: User },
            { key: 'brands', label: 'Brands', icon: User },
            { key: 'companies', label: 'Companies', icon: User }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({filteredUsers.length})
            </h2>
            <AnimatePresence>
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map((userProfile) => (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={userProfile.photoURL}
                            alt={userProfile.name}
                            width="48"
                            height="48"
                            className="rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          {userProfile.isVerified && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {userProfile.name}
                            </h3>
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                              {userProfile.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">@{userProfile.username}</p>
                          {userProfile.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {userProfile.bio}
                            </p>
                          )}
                          {userProfile.location && (
                            <div className="flex items-center space-x-1 mt-2">
                              <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{userProfile.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{userProfile.followersCount} followers</span>
                            <span>{userProfile.followingCount} following</span>
                          </div>
                        </div>
                        <Link
                          href={`/profile/${userProfile.id}`}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : !loading && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No users found matching your search</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Nearby Users */}
        {!searchQuery && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Nearby Users</span>
            </h2>
            <AnimatePresence>
              {filteredNearbyUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNearbyUsers.map((userProfile) => (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={userProfile.photoURL}
                            alt={userProfile.name}
                            width="48"
                            height="48"
                            className="rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          {userProfile.isVerified && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {userProfile.name}
                            </h3>
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                              {userProfile.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">@{userProfile.username}</p>
                          {userProfile.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {userProfile.bio}
                            </p>
                          )}
                          {userProfile.location && (
                            <div className="flex items-center space-x-1 mt-2">
                              <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{userProfile.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{userProfile.followersCount} followers</span>
                            <span>{userProfile.followingCount} following</span>
                          </div>
                        </div>
                        <Link
                          href={`/profile/${userProfile.id}`}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No nearby users found</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}


