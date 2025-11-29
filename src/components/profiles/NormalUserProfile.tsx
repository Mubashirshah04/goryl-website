'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { Camera, MoreHorizontal, Smile, Phone, Star, ShoppingCart, Settings, MessageCircle, Share2, Bookmark, Heart, Video, Package, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useUserOrders } from '@/hooks/useUserOrders';
// Firestore removed - using static profile data
import ApplicationTracking from '@/components/ApplicationTracking';
// Firestore removed - using static profile data
import ProfileImage from '@/components/ProfileImage';
import PublicContentTabs from '@/components/profiles/PublicContentTabs';

interface Order {
  id: string;
  items: Array<{
    title: string;
    image: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: any;
  shipping?: {
    address: string;
    tracking: string;
  };
  payment?: {
    method: string;
    status: string;
  };
}

interface NormalUserProfileProps {
  profile: {
    id: string;
    name: string;
    username?: string;
    role: string;
    photoURL?: string;
    customPhotoURL?: string;  // Firebase storage URL
    profilePic?: string;      // Alternative field name
    avatar?: string;          // Another alternative field name
    bio?: string;
    about?: string;
    followers?: string[] | number;
    following?: string[] | number;
    email?: string;
    joinedAt?: any;
    location?: string;
    phone?: string;
    phoneNumber?: string;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  onMessage: () => void;
  onBack?: () => void;
  isLoggedIn?: boolean;
}

export default function NormalUserProfile({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onShare,
  onMessage,
  onBack,
  isLoggedIn = true
}: NormalUserProfileProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about' | 'liked' | 'saved' | 'orders' | 'applications'>('products');
  const { orders, loading: ordersLoading } = useUserOrders(profile.id, 5);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [userList, setUserList] = useState<{id: string, name: string, photoURL?: string}[]>([]);
  const [listTitle, setListTitle] = useState('');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  
  // Clean follower and following counts to remove any strange text
  const cleanFollowCount = (count: any): number => {
    if (typeof count === 'number') return count;
    if (typeof count === 'string') {
      // Remove the strange text and parse as number
      const cleaned = count.replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '').trim();
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (Array.isArray(count)) return count.length;
    return 0;
  };

  const [followCounts, setFollowCounts] = useState({ 
    followers: cleanFollowCount(profile.followers),
    following: cleanFollowCount(profile.following)
  });

  // Subscribe to real-time follow count updates - DISABLED (Firestore removed)
  useEffect(() => {
    // Keep follow counts from profile data
    setFollowCounts({
      followers: cleanFollowCount(profile.followers),
      following: cleanFollowCount(profile.following)
    });
  }, [profile.id, profile.followers, profile.following]);

  function openOrderModal(order: any) {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }
  function closeOrderModal() {
    setShowOrderModal(false);
    setSelectedOrder(null);
  }

  // Fetch user details for modal list (simple version, can be optimized)
  async function fetchUsersByIds(ids: string[] | number | null | undefined) {
    // Validate that ids is an array
    if (!Array.isArray(ids) || ids.length === 0) return [];
    
    // Import Firestore functions
    const { collection, getDocs, query, where } = await import('@/lib/firestore');
    const { db } = await import('@/lib/firebase');
    
    // Firebase has query limits, so we need to batch the requests
    const batchSize = 10;
    const users: any[] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('__name__', 'in', batchIds));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
    }
    
    return users;
  }

  // Update the openFollowers function to refresh the list
  async function openFollowers() {
    setListTitle('Followers');
    setShowFollowers(true);
    try {
      // Get actual follower IDs
      const followerIds = await getUserFollowers(profile.id);
      setUserList(await fetchUsersByIds(followerIds));
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast.error('Failed to load followers');
      setUserList([]);
    }
  }
  
  // Update the openFollowing function to refresh the list
  async function openFollowing() {
    setListTitle('Following');
    setShowFollowing(true);
    try {
      // Get actual following IDs
      const followingIds = await getUserFollowing(profile.id);
      setUserList(await fetchUsersByIds(followingIds));
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error('Failed to load following');
      setUserList([]);
    }
  }
  function closeModal() {
    setShowFollowers(false);
    setShowFollowing(false);
    setUserList([]);
  }

  async function goToUserProfile(uid: string) {
    // Directly navigate to user profile using query parameter format
    window.location.href = `/profile?uid=${uid}`;
  }

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😍', label: 'Loved' },
    { emoji: '😎', label: 'Cool' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '😴', label: 'Sleepy' },
    { emoji: '🔥', label: 'Fired Up' },
    { emoji: '💪', label: 'Motivated' },
    { emoji: '🎉', label: 'Celebrating' },
    { emoji: '😌', label: 'Relaxed' },
  ];

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setShowMoodModal(false);
    toast.success(`Mood set to ${mood}!`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="flex items-center justify-end p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            >
              <MoreHorizontal className="w-6 h-6 text-foreground" />
            </button>
            
            {showMenuDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                {isOwnProfile ? (
                  <>
                    <Link href="/profile/edit" className="block px-4 py-2 hover:bg-accent text-foreground border-b border-border">
                      Edit Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-accent text-foreground border-b border-border">
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${profile.name}'s Profile`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Profile link copied!');
                        }
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-foreground border-b border-border"
                    >
                      Share Profile
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to logout?')) {
                          window.location.href = '/login';
                        }
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-red-500"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${profile.name}'s Profile`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Profile link copied!');
                        }
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-foreground border-b border-border"
                    >
                      Share Profile
                    </button>
                    <button 
                      onClick={() => {
                        toast.info('Report feature coming soon!');
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-foreground border-b border-border"
                    >
                      Report User
                    </button>
                    <button 
                      onClick={() => {
                        toast.info('Block feature coming soon!');
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-foreground"
                    >
                      Block User
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6">
        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ProfileImage 
              user={{
                customPhotoURL: profile.customPhotoURL || profile.photoURL,
                photoURL: profile.photoURL,
                profilePic: profile.profilePic,
                avatar: profile.avatar,
                name: profile.name
              }} 
              size={120} 
              className="rounded-full object-cover"
            />
          </div>
        </div>

        {/* Name and Role */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {profile.name || 'User'}
            </h1>
          </div>
          {profile.username && (
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {profile.role === 'seller' ? 'Personal Shopping Assistant' : 'Normal User'}
          </p>
        </div>

        {/* Mood Selection Modal */}
        <Dialog open={showMoodModal} onClose={() => setShowMoodModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-auto p-6 z-50 border border-border">
              <Dialog.Title className="text-lg font-bold mb-4 text-foreground">Select Your Mood</Dialog.Title>
              <div className="grid grid-cols-5 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodSelect(mood.label)}
                    className="flex flex-col items-center space-y-2 p-3 hover:bg-accent rounded-lg transition-colors"
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs text-foreground">{mood.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowMoodModal(false)} className="mt-6 w-full py-2 bg-accent rounded text-foreground">Cancel</button>
            </div>
          </div>
        </Dialog>

        {/* Call Modal */}
        <Dialog open={showCallModal} onClose={() => setShowCallModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-auto p-6 z-50 border border-border">
              <Dialog.Title className="text-lg font-bold mb-4 text-foreground">Contact Information</Dialog.Title>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-accent rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="text-lg font-semibold text-foreground">
                      {profile.phone || profile.phoneNumber || 'Not available'}
                    </p>
                  </div>
                </div>
                {(profile.phone || profile.phoneNumber) && (
                  <a 
                    href={`tel:${profile.phone || profile.phoneNumber}`}
                    className="flex items-center justify-center space-x-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call Now</span>
                  </a>
                )}
              </div>
              <button onClick={() => setShowCallModal(false)} className="mt-4 w-full py-2 bg-accent rounded text-foreground">Close</button>
            </div>
          </div>
        </Dialog>

        {/* Bio Bubble */}
        {profile.bio && (
          <div className="bg-accent rounded-2xl p-4 mb-8 mx-4">
            <p className="text-center text-foreground text-sm">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex justify-center space-x-8 mb-8">
          <button 
            onClick={() => setShowMoodModal(true)}
            className="flex flex-col items-center space-y-1"
          >
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors">
              <Smile className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Mood</span>
          </button>
          
          <button 
            onClick={() => setShowCallModal(true)}
            className="flex flex-col items-center space-y-1"
          >
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors">
              <Phone className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Call</span>
          </button>
          
          {!isOwnProfile ? (
            <button 
              onClick={onFollow}
              className="flex flex-col items-center space-y-1"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isFollowing ? 'bg-accent' : 'bg-primary'
              }`}>
                <Star className={`w-6 h-6 ${isFollowing ? 'text-foreground' : 'text-primary-foreground'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          ) : (
            <Link href="/profile/edit" className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Edit</span>
            </Link>
          )}
          
          <Link href="/orders" className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors">
              <ShoppingCart className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Orders</span>
          </Link>

          {isOwnProfile && (
            <Link href="/settings" className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Settings</span>
            </Link>
          )}
        </div>

        {/* About Section */}
        <div className="px-4">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">About</h2>
          </div>
          <p className="text-foreground text-sm leading-relaxed">
            {profile.about || profile.bio || ""}
          </p>
        </div>

        {/* Additional Action Buttons for Non-Own Profile */}
        {!isOwnProfile && (
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={onMessage}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Message</span>
            </button>
            <button
              onClick={onShare}
              className="flex items-center space-x-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        )}

        {/* Public Content Tabs */}
        <div className="mt-8">
          <PublicContentTabs 
            profile={profile as any}
            isOwnProfile={isOwnProfile}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Private Tabs for Own Profile */}
        {isOwnProfile && (
          <div className="border-t border-border mt-8 pt-6">
            <nav className="flex space-x-8 mb-6">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Applications
              </button>
            </nav>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-foreground">Recent Purchases</h2>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i}>
                        <div className="bg-accent rounded-lg h-20"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-accent rounded-lg p-4 cursor-pointer hover:bg-accent/80" onClick={() => openOrderModal(order)}>
                        <div className="flex items-center mb-2">
                          {order.items && order.items[0]?.image && (
                            <img src={order.items[0].image} alt={order.items[0].title} className="w-14 h-14 rounded object-cover mr-4" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-foreground">
                              {order.items && order.items[0]?.title ? order.items[0].title : `Order #${order.id.slice(-8).toUpperCase()}`}
                            </h3>
                            <p className="text-xs text-muted-foreground">{order.items && order.items.length} item{order.items && order.items.length > 1 ? 's' : ''}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt.toDate()).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                            <div className="text-sm font-medium mt-1 text-foreground">${order.totalAmount || '0.00'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link href="/orders" className="block mt-4 text-center py-2 px-4 bg-white text-foreground rounded-lg hover:bg-gray-100 transition-colors font-medium border border-border">
                      View All Orders
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Link href="/orders" className="inline-block py-2 px-4 bg-white text-foreground rounded-lg hover:bg-gray-100 transition-colors font-medium border border-border">
                      View All Orders
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <ApplicationTracking userId={profile.id} />
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}