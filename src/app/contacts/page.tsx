'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  UserPlus, 
  Search, 
  Filter,
  Globe,
  Clock,
  Star,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services

interface Contact {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  photoURL: string;
  bio: string;
  location: string;
  role: 'user' | 'personal_seller' | 'brand' | 'company';
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  distance?: number; // in km
  mutualConnections: number;
}

export default function ContactsPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [nearbyContacts, setNearbyContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'nearby' | 'sellers'>('all');
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  // Get user's contacts
  const getContacts = async () => {
    setLoading(true);
    try {
      // Mock contacts data - in real app, this would come from Firebase
      const mockContacts: Contact[] = [
        {
          id: 'contact-1',
          name: 'Sarah Johnson',
          username: 'sarah_j',
          email: 'sarah@example.com',
          phone: '+92 300 1234567',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          bio: 'Fashion enthusiast and local seller',
          location: 'Lahore, Pakistan',
          role: 'personal_seller',
          followersCount: 1250,
          followingCount: 890,
          isVerified: true,
          isOnline: true,
          lastSeen: new Date(),
          distance: 2.5,
          mutualConnections: 15
        },
        {
          id: 'contact-2',
          name: 'Ahmed Ali',
          username: 'ahmed_tech',
          email: 'ahmed@example.com',
          phone: '+92 301 2345678',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
          bio: 'Tech seller and gadget enthusiast',
          location: 'Karachi, Pakistan',
          role: 'personal_seller',
          followersCount: 2100,
          followingCount: 1200,
          isVerified: false,
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          distance: 5.2,
          mutualConnections: 8
        },
        {
          id: 'contact-3',
          name: 'Fatima Khan',
          username: 'fatima_beauty',
          email: 'fatima@example.com',
          phone: '+92 302 3456789',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
          bio: 'Beauty products and cosmetics',
          location: 'Islamabad, Pakistan',
          role: 'brand',
          followersCount: 5600,
          followingCount: 2100,
          isVerified: true,
          isOnline: true,
          lastSeen: new Date(),
          distance: 1.8,
          mutualConnections: 23
        },
        {
          id: 'contact-4',
          name: 'Hassan Sheikh',
          username: 'hassan_food',
          email: 'hassan@example.com',
          phone: '+92 303 4567890',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hassan',
          bio: 'Food delivery and restaurant owner',
          location: 'Lahore, Pakistan',
          role: 'company',
          followersCount: 3200,
          followingCount: 1500,
          isVerified: true,
          isOnline: false,
          lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          distance: 3.1,
          mutualConnections: 12
        },
        {
          id: 'contact-5',
          name: 'Ayesha Malik',
          username: 'ayesha_art',
          email: 'ayesha@example.com',
          phone: '+92 304 5678901',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayesha',
          bio: 'Artist and handmade crafts seller',
          location: 'Lahore, Pakistan',
          role: 'personal_seller',
          followersCount: 890,
          followingCount: 650,
          isVerified: false,
          isOnline: true,
          lastSeen: new Date(),
          distance: 0.8,
          mutualConnections: 6
        }
      ];

      setContacts(mockContacts);
      setNearbyContacts(mockContacts.filter(contact => contact.distance && contact.distance < 5));
    } catch (error) {
      console.error('Error getting contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.success('Location permission granted');
          setShowLocationPermission(false);
          // Refresh nearby users with location data
          getContacts();
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Location permission denied');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  // Start chat with contact
  const startChatWithContact = (contact: Contact) => {
    // Navigate to chat page with the contact
    window.location.href = `/chat?user=${contact.id}`;
  };

  // Follow/Unfollow contact
  const toggleFollowContact = (contact: Contact) => {
    // In real app, this would update Firebase
    toast.success(`Following ${contact.name}`);
  };

  useEffect(() => {
    getContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'all') return true;
    if (filter === 'online') return contact.isOnline;
    if (filter === 'nearby') return contact.distance && contact.distance < 5;
    if (filter === 'sellers') return contact.role === 'personal_seller' || contact.role === 'brand' || contact.role === 'company';
    
    return true;
  });

  const getLastSeenText = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span>Contacts</span>
            </h1>
            <button
              onClick={() => setShowLocationPermission(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
            </button>
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
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'All Contacts', icon: Users },
            { key: 'online', label: 'Online', icon: Clock },
            { key: 'nearby', label: 'Nearby', icon: MapPin },
            { key: 'sellers', label: 'Sellers', icon: Star }
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

        {/* Location Permission Modal */}
        <AnimatePresence>
          {showLocationPermission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full"
              >
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Enable Location Access
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Allow location access to find nearby contacts and sellers in your area.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowLocationPermission(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={requestLocationPermission}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Allow
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Contacts List */}
        <AnimatePresence>
          {filteredContacts.length > 0 ? (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={contact.photoURL}
                        alt={contact.name}
                        width="56"
                        height="56"
                        className="rounded-full"
                      />
                      {contact.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                      {contact.isVerified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {contact.name}
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          {contact.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">@{contact.username}</p>
                      {contact.bio && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {contact.bio}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{contact.location}</span>
                        </div>
                        {contact.distance && (
                          <span>{contact.distance}km away</span>
                        )}
                        <span>{contact.mutualConnections} mutual</span>
                        {!contact.isOnline && (
                          <span>Last seen {getLastSeenText(contact.lastSeen)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startChatWithContact(contact)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Message"
                      >
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => toggleFollowContact(contact)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Follow"
                      >
                        <UserPlus className="w-5 h-5 text-gray-600" />
                      </button>
                      <Link
                        href={`/profile/${contact.id}`}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try adjusting your search terms' : 'Start connecting with people around you'}
              </p>
              <Link
                href="/search-users"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Find People
              </Link>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

