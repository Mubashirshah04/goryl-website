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
          {isOwnProfile && (
            <Link href="/profile/edit" className="p-2 hover:bg-accent rounded-full transition-colors">
              <Camera className="w-6 h-6 text-foreground" />
            </Link>
          )}
          <button 
            className="p-2 hover:bg-accent rounded-full transition-colors"
            onClick={async () => {
              // Show options menu
              const options = isOwnProfile 
                ? ['Edit Profile', 'Settings', 'Share Profile', 'Logout']
                : ['Share Profile', 'Report User', 'Block User'];
              
              // Build the prompt message properly
              let message = 'Options:\n';
              options.forEach((opt, i) => {
                message += `${i + 1}. ${opt}\n`;
              });
              message += `\nEnter number (1-${options.length}):`;
              
              const choice = await new Promise<string | null>((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                modal.innerHTML = `
                  <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Option</h3>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <input type="number" id="choice" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter number">
                    <div class="flex space-x-3 mt-4">
                      <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                      <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                    </div>
                  </div>
                `;
                document.body.appendChild(modal);
                
                modal.querySelector('#cancel')?.addEventListener('click', () => {
                  document.body.removeChild(modal);
                  resolve(null);
                });
                modal.querySelector('#confirm')?.addEventListener('click', () => {
                  const choiceValue = (modal.querySelector('#choice') as HTMLInputElement)?.value;
                  document.body.removeChild(modal);
                  resolve(choiceValue || null);
                });
              });
              const index = parseInt(choice || '0') - 1;
              
              if (index >= 0 && index < options.length) {
                const selectedOption = options[index];
                switch (selectedOption) {
                  case 'Edit Profile':
                    window.location.href = '/profile/edit';
                    break;
                  case 'Settings':
                    window.location.href = '/settings';
                    break;
                  case 'Share Profile':
                    if (navigator.share) {
                      navigator.share({
                        title: `${profile.name}'s Profile`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Profile link copied to clipboard!');
                    }
                    break;
                  case 'Logout':
                    const confirmed = await new Promise<boolean>((resolve) => {
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                      modal.innerHTML = `
                        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                          <h3 class="text-lg font-semibold text-gray-900 mb-4">Logout</h3>
                          <p class="text-gray-600 mb-6">Are you sure you want to logout?</p>
                          <div class="flex space-x-3">
                            <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                            <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Logout</button>
                          </div>
                        </div>
                      `;
                      document.body.appendChild(modal);
                      
                      modal.querySelector('#cancel')?.addEventListener('click', () => {
                        document.body.removeChild(modal);
                        resolve(false);
                      });
                      modal.querySelector('#confirm')?.addEventListener('click', () => {
                        document.body.removeChild(modal);
                        resolve(true);
                      });
                    });
                    
                    if (confirmed) {
                      // Handle logout
                      window.location.href = '/login';
                    }
                    break;
                  case 'Report User':
                    toast.info('Report feature coming soon!');
                    break;
                  case 'Block User':
                    toast.info('Block feature coming soon!');
                    break;
                }
              }
            }}
          >
            <MoreHorizontal className="w-6 h-6 text-foreground" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6">
        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ProfileImage 
              user={{
                customPhotoURL: profile.customPhotoURL,
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

        {/* Followers & Following */}
        <div className="flex justify-center space-x-8 mb-6">
          <button onClick={openFollowers} className="text-center">
            <p className="text-lg font-bold text-foreground">{followCounts.followers}</p>
            <span className="text-muted-foreground text-xs">Followers</span>
          </button>
          <button onClick={openFollowing} className="text-center">
            <p className="text-lg font-bold text-foreground">{followCounts.following}</p>
            <span className="text-muted-foreground text-xs">Following</span>
          </button>
        </div>

        {/* Followers/Following Modal */}
        <Dialog open={showFollowers || showFollowing} onClose={closeModal} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-center justify-center min-h-screen">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-auto p-6 z-50 border border-border">
              <Dialog.Title className="text-lg font-bold mb-4 text-foreground">{listTitle}</Dialog.Title>
              <ul>
                {userList.length === 0 && <li className="text-muted-foreground text-center py-8">No users found.</li>}
                {userList.map((u) => (
                  <li key={u.id} className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-accent rounded px-2" onClick={() => goToUserProfile(u.id)}>
                    <ProfileImage 
                      user={u} 
                      size={32} 
                      className="rounded-full"
                    />
                    <span className="font-medium text-foreground">{u.name}</span>
                  </li>
                ))}
              </ul>
              <button onClick={closeModal} className="mt-4 w-full py-2 bg-accent rounded text-foreground">Close</button>
            </div>
          </div>
        </Dialog>

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
        {/* Order Details Modal */}
        <Dialog open={showOrderModal} onClose={closeOrderModal} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-center justify-center min-h-screen">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-auto p-6 z-50 border border-border">
              <Dialog.Title className="text-lg font-bold mb-4 text-foreground">Order Details</Dialog.Title>
              {selectedOrder && (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      {selectedOrder.items && selectedOrder.items[0]?.image && (
                        <img src={selectedOrder.items[0].image} alt={selectedOrder.items[0].title} className="w-16 h-16 rounded object-cover mr-4" />
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{selectedOrder.items && selectedOrder.items[0]?.title}</div>
                        <div className="text-xs text-muted-foreground">{selectedOrder.items && selectedOrder.items.length} item{selectedOrder.items && selectedOrder.items.length > 1 ? 's' : ''}</div>
                        <div className="text-xs text-muted-foreground">{new Date(selectedOrder.createdAt.toDate()).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground">Total: ${selectedOrder.totalAmount || '0.00'}</div>
                    <div className="text-xs text-muted-foreground">Status: {selectedOrder.status}</div>
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-1 text-foreground">Shipping</div>
                    <div className="text-xs text-muted-foreground">{selectedOrder.shipping?.address || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Tracking: {selectedOrder.shipping?.tracking || 'N/A'}</div>
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-1 text-foreground">Payment</div>
                    <div className="text-xs text-muted-foreground">Method: {selectedOrder.payment?.method || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Status: {selectedOrder.payment?.status || 'N/A'}</div>
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-1 text-foreground">Invoice</div>
                    <div className="text-xs text-muted-foreground">Order ID: {selectedOrder.id}</div>
                  </div>
                </div>
              )}
              <button onClick={closeOrderModal} className="mt-4 w-full py-2 bg-accent rounded text-foreground">Close</button>
            </div>
          </div>
        </Dialog>
                    {isOwnProfile && (
                      <Link 
                        href="/orders" 
                        className="block text-center text-primary hover:text-primary/90 font-medium text-sm mt-4"
                      >
                        View All Orders →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No purchases yet</p>
                    {isOwnProfile && (
                      <Link 
                        href="/" 
                        className="block text-primary hover:text-primary/90 font-medium text-sm mt-2"
                      >
                        Start Shopping →
                      </Link>
                    )}
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