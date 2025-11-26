'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/hooks/useCustomSession';
import { 
  ArrowLeft, Settings, User, MapPin, Bell, 
  LogOut, Save, Plus, X, Shield, Eye, CreditCard, 
  Palette, Lock, Smartphone, Globe, Trash2, Edit
} from 'lucide-react';
import { toast } from 'sonner';

interface ShippingAddress {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const [profile, setProfile] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'shipping' | 'notifications' | 'security' | 'privacy' | 'payment' | 'appearance'>('profile');
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    bio: '',
    about: ''
  });
  
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    id: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  });

  // Additional settings states
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    deviceManagement: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
    dataSharing: false
  });

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState<Array<{id: string; name: string; lastActive: string; location: string}>>([]);

  const { theme, setTheme } = useTheme();
  const [appearanceSettings, setAppearanceSettings] = useState(() => {
    // Try to load theme from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearanceSettings');
      if (saved) return JSON.parse(saved);
    }
    return {
      theme: 'light',
      language: 'en',
      fontSize: 'medium',
      compactMode: false
    };
  });
  // Theme effect: use next-themes and persist in localStorage for other prefs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
    if (appearanceSettings.theme === 'dark') setTheme('dark');
    if (appearanceSettings.theme === 'light') setTheme('light');
  }, [appearanceSettings.theme, setTheme]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingCommunications: false
  });

  // Fetch profile data
  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/profile?id=${userId}`);
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async (userId: string, updates: any) => {
    try {
      const res = await fetch(`/api/user/profile?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await fetchProfile(userId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Load data when component mounts or user changes
  useEffect(() => {
    // Wait for auth to load
    if (status === 'loading') return;
    
    // Redirect if not authenticated
    if (!user?.id) {
      router.push('/auth-login');
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      try {
        // Fetch fresh profile data
        await fetchProfile(user.id);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user?.id, status, router]); // Run when user or status changes

  // Update profile data and settings when profile changes
  useEffect(() => {
    if (profile) {
      // Update profile form data
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        about: profile.about || ''
      });
      
      // Load all settings from profile - ensure we load everything
      const settings = profile.settings || {};
      
      // Shipping addresses
      if (settings.shippingAddresses && Array.isArray(settings.shippingAddresses)) {
        setShippingAddresses(settings.shippingAddresses);
      } else {
        setShippingAddresses([]);
      }
      
      // Security settings - merge with defaults
      if (settings.security) {
        setSecuritySettings({
          twoFactorAuth: settings.security.twoFactorAuth ?? false,
          loginNotifications: settings.security.loginNotifications ?? true,
          deviceManagement: settings.security.deviceManagement ?? true
        });
      } else {
        setSecuritySettings({
          twoFactorAuth: false,
          loginNotifications: true,
          deviceManagement: true
        });
      }
      
      // Privacy settings - merge with defaults
      if (settings.privacy) {
        setPrivacySettings({
          profileVisibility: settings.privacy.profileVisibility || 'public',
          showOnlineStatus: settings.privacy.showOnlineStatus ?? true,
          allowMessages: settings.privacy.allowMessages ?? true,
          dataSharing: settings.privacy.dataSharing ?? false
        });
      } else {
        setPrivacySettings({
          profileVisibility: 'public',
          showOnlineStatus: true,
          allowMessages: true,
          dataSharing: false
        });
      }
      
      // Notification settings - merge with defaults
      if (settings.notifications) {
        setNotificationSettings({
          emailNotifications: settings.notifications.emailNotifications ?? true,
          pushNotifications: settings.notifications.pushNotifications ?? true,
          marketingCommunications: settings.notifications.marketingCommunications ?? false
        });
      } else {
        setNotificationSettings({
          emailNotifications: true,
          pushNotifications: true,
          marketingCommunications: false
        });
      }
      
      // Payment methods
      if (settings.paymentMethods && Array.isArray(settings.paymentMethods)) {
        setPaymentMethods(settings.paymentMethods);
      } else {
        setPaymentMethods([]);
      }
      
      // Appearance settings - merge with defaults and localStorage
      if (settings.appearance) {
        setAppearanceSettings({
          theme: settings.appearance.theme || 'light',
          language: settings.appearance.language || 'en',
          fontSize: settings.appearance.fontSize || 'medium',
          compactMode: settings.appearance.compactMode ?? false
        });
        
        // Update theme if it changed
        if (settings.appearance.theme && settings.appearance.theme !== theme) {
          setTheme(settings.appearance.theme as 'light' | 'dark');
        }
      } else {
        // Load from localStorage as fallback
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('appearanceSettings');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setAppearanceSettings(parsed);
            } catch (e) {
              // Use defaults
            }
          }
        }
      }
    }
  }, [profile, setTheme, theme]);
  
  // Helper function to save settings to Firebase
  const saveSettings = async (settingsUpdates: any) => {
    if (!user || !user.id) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      // Get current profile from store to ensure we have latest data
      const currentProfile = profile || {};
      const currentSettings = (currentProfile.settings || {}) as any;
      
      // Deep merge nested settings
      const mergedSettings = {
        ...currentSettings,
        ...Object.keys(settingsUpdates).reduce((acc, key) => {
          if (typeof settingsUpdates[key] === 'object' && !Array.isArray(settingsUpdates[key]) && currentSettings[key]) {
            // Merge nested objects
            acc[key] = { ...currentSettings[key], ...settingsUpdates[key] };
          } else {
            // Replace arrays and primitives
            acc[key] = settingsUpdates[key];
          }
          return acc;
        }, {} as any)
      };
      
      // Save to Firebase
      await updateProfile(user.id, {
        settings: mergedSettings
      });
      
      // Update local state immediately for better UX
      if (profile) {
        // Update the store's profile directly
        const updatedProfile = {
          ...profile,
          settings: mergedSettings
        };
        // The store will update automatically through updateProfile
      }
      
      return true;
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
      throw error;
    }
  };
  
  // Load devices on mount
  useEffect(() => {
    if (user && showDevices) {
      // Simulate device loading - in production, fetch from Firebase
      const userDevices = [
        {
          id: '1',
          name: 'Windows PC',
          lastActive: new Date().toISOString(),
          location: 'Current Device'
        },
        ...(localStorage.getItem('devices') ? JSON.parse(localStorage.getItem('devices') || '[]') : [])
      ];
      setDevices(userDevices);
    }
  }, [user, showDevices]);
  
  // Handle 2FA setup
  const handle2FASetup = async () => {
    if (!securitySettings.twoFactorAuth) {
      // User is enabling 2FA - show setup modal
      setShow2FASetup(true);
    } else {
      // User is disabling 2FA - ask for confirmation
      if (confirm('Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.')) {
        const updated = { ...securitySettings, twoFactorAuth: false };
        setSecuritySettings(updated);
        try {
          await saveSettings({ security: updated });
          toast.success('Two-Factor Authentication disabled');
        } catch (error) {
          console.error('Error disabling 2FA:', error);
          toast.error('Failed to disable 2FA');
          setSecuritySettings(securitySettings);
        }
      }
    }
  };
  
  // Complete 2FA setup
  const complete2FASetup = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setSaving(true);
    try {
      // In production, verify code with backend
      // For now, just save the setting
      const updated = { ...securitySettings, twoFactorAuth: true };
      setSecuritySettings(updated);
      await saveSettings({ security: updated });
      
      setShow2FASetup(false);
      setTwoFACode('');
      toast.success('Two-Factor Authentication enabled successfully');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to save settings
  const saveAllSettings = async () => {
    if (!user || !user.id) return;
    
    try {
      await updateProfile(user.id, {
        settings: {
          shippingAddresses,
          security: securitySettings,
          privacy: privacySettings,
          notifications: notificationSettings,
          paymentMethods,
          appearance: appearanceSettings
        }
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const handleProfileSave = async () => {
    if (!user || !user.id) return;
    
    setSaving(true);
    try {
      await updateProfile(user.id, {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        about: profileData.about
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.address || !newAddress.city || !newAddress.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Check if we're editing an existing address
      const isEditing = shippingAddresses.some(addr => addr.id === newAddress.id);
      
      let updatedAddresses: ShippingAddress[];
      
      if (isEditing) {
        // Update existing address
        updatedAddresses = shippingAddresses.map(addr => 
          addr.id === newAddress.id ? newAddress : addr
        );
        toast.success('Address updated successfully');
      } else {
        // Add new address
        const address: ShippingAddress = {
          ...newAddress,
          id: Date.now().toString()
        };
        updatedAddresses = [...shippingAddresses, address];
        toast.success('Address added successfully');
      }
      
      // Update state
      setShippingAddresses(updatedAddresses);
      
      // Save to Firebase
      await saveSettings({ shippingAddresses: updatedAddresses });

      // Reset form
      setNewAddress({
        id: '',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      });
      setShowAddAddress(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setSaving(true);
    const previousAddresses = [...shippingAddresses];
    try {
      const updatedAddresses = shippingAddresses.filter(addr => addr.id !== id);
      setShippingAddresses(updatedAddresses);
      await saveSettings({ shippingAddresses: updatedAddresses });
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
      // Revert state on error
      setShippingAddresses(previousAddresses);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setNewAddress(address);
    setShowAddAddress(true);
  };

  const handleSetDefaultAddress = async (id: string) => {
    setSaving(true);
    try {
      const updatedAddresses = shippingAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      setShippingAddresses(updatedAddresses);
      await saveSettings({ shippingAddresses: updatedAddresses });
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error updating default address:', error);
      toast.error('Failed to update default address');
    } finally {
      setSaving(false);
    }
  };

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    brand: 'Visa' as 'Visa' | 'MasterCard' | 'Amex' | 'Discover'
  });

  const handleDeletePaymentMethod = async (id: string) => {
    setSaving(true);
    const previousMethods = [...paymentMethods];
    try {
      const updatedMethods = paymentMethods.filter(method => method.id !== id);
      setPaymentMethods(updatedMethods);
      await saveSettings({ paymentMethods: updatedMethods });
      toast.success('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
      setPaymentMethods(previousMethods);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    setSaving(true);
    try {
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }));
      setPaymentMethods(updatedMethods);
      await saveSettings({ paymentMethods: updatedMethods });
      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error updating default payment:', error);
      toast.error('Failed to update default payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.cardName || 
        !newPaymentMethod.expiryMonth || !newPaymentMethod.expiryYear || !newPaymentMethod.cvv) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate card number (basic validation)
    const cardNumber = newPaymentMethod.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      toast.error('Invalid card number');
      return;
    }

    // Detect card brand based on first digit
    let detectedBrand: 'Visa' | 'MasterCard' | 'Amex' | 'Discover' = 'Visa';
    if (cardNumber.startsWith('4')) detectedBrand = 'Visa';
    else if (cardNumber.startsWith('5')) detectedBrand = 'MasterCard';
    else if (cardNumber.startsWith('3')) detectedBrand = 'Amex';
    else if (cardNumber.startsWith('6')) detectedBrand = 'Discover';

    setSaving(true);
    try {
      const last4 = cardNumber.slice(-4);
      const newMethod = {
        id: Date.now().toString(),
        type: 'card',
        last4,
        brand: detectedBrand,
        cardName: newPaymentMethod.cardName,
        isDefault: paymentMethods.length === 0,
        expiryMonth: newPaymentMethod.expiryMonth,
        expiryYear: newPaymentMethod.expiryYear
      };
      
      const updatedMethods = [...paymentMethods, newMethod];
      setPaymentMethods(updatedMethods);
      await saveSettings({ paymentMethods: updatedMethods });
      
      // Reset form
      setNewPaymentMethod({
        cardNumber: '',
        cardName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        brand: 'Visa'
      });
      setShowAddPayment(false);
      toast.success('Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/');
      router.refresh();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Show loading while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-black/80 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <Settings className="w-16 h-16 text-black/40 dark:text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Please login first</h1>
          <p className="text-black/80 dark:text-gray-400">You need to be authenticated to access settings</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-black/80 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 text-black dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href={`/profile/${user.id}`}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">Settings</h1>
                <p className="text-sm text-black/80 dark:text-gray-400">Manage your account preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

             <div className="max-w-4xl mx-auto px-4 py-6">
         {/* Settings Tabs */}
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
           <div className="flex overflow-x-auto">
             {[
               { id: 'profile', label: 'Profile', icon: User },
               { id: 'shipping', label: 'Shipping', icon: MapPin },
               { id: 'notifications', label: 'Notifications', icon: Bell },
               { id: 'security', label: 'Security', icon: Shield },
               { id: 'privacy', label: 'Privacy', icon: Eye },
               { id: 'payment', label: 'Payment', icon: CreditCard },
               { id: 'appearance', label: 'Appearance', icon: Palette }
             ].map((tab) => {
               const Icon = tab.icon;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                     activeTab === tab.id
                       ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                       : 'border-transparent text-black/70 dark:text-gray-400 hover:text-black dark:hover:text-white'
                   }`}
                 >
                   <Icon className="w-4 h-4" />
                   <span>{tab.label}</span>
                 </button>
               );
             })}
           </div>
         </div>

                 {/* Tab Content */}
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-black dark:text-white">
           {/* Profile Settings */}
           {activeTab === 'profile' && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold text-black dark:text-white">Profile Information</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Full Name
                   </label>
                   <input
                     type="text"
                     value={profileData.name}
                     onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="Enter your full name"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Phone Number
                   </label>
                   <input
                     type="tel"
                     value={profileData.phone}
                     onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="Enter phone number"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                   Bio (Short Description)
                 </label>
                 <textarea
                   value={profileData.bio}
                   onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                   rows={2}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                   placeholder="A short description about yourself..."
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                   About (Detailed Description)
                 </label>
                 <textarea
                   value={profileData.about}
                   onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                   rows={4}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                   placeholder="A detailed description about yourself..."
                 />
               </div>
               
               <button
                 onClick={handleProfileSave}
                 disabled={saving}
                 className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
               >
                 <Save className="w-4 h-4" />
                 <span>{saving ? 'Saving...' : 'Save Changes'}</span>
               </button>
             </div>
           )}

           {/* Security Settings */}
           {activeTab === 'security' && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold text-black dark:text-white">Security Settings</h2>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Lock className="w-5 h-5 text-black/70 dark:text-gray-400" />
                     <div>
                       <h3 className="font-medium text-black dark:text-white">Two-Factor Authentication</h3>
                       <p className="text-sm text-black/70 dark:text-gray-400">
                         {securitySettings.twoFactorAuth 
                           ? 'Your account is protected with 2FA' 
                           : 'Add an extra layer of security to your account'}
                       </p>
                       {securitySettings.twoFactorAuth && (
                         <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Active</p>
                       )}
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={securitySettings.twoFactorAuth}
                       onChange={handle2FASetup}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 {/* 2FA Setup Modal */}
                 {show2FASetup && (
                   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md text-black dark:text-white">
                       <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                         Set Up Two-Factor Authentication
                       </h3>
                       
                       <div className="space-y-4">
                         <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                           <p className="text-sm text-black/80 dark:text-gray-300 mb-2">
                             <strong>Step 1:</strong> Open your authenticator app (Google Authenticator, Authy, etc.)
                           </p>
                           <p className="text-sm text-black/80 dark:text-gray-300 mb-2">
                             <strong>Step 2:</strong> Scan this QR code or enter the secret key manually
                           </p>
                           <div className="bg-white dark:bg-gray-700 p-4 rounded flex items-center justify-center my-3">
                             <div className="w-32 h-32 bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded">
                               <span className="text-xs text-gray-500">QR Code</span>
                             </div>
                           </div>
                           <p className="text-xs text-black/60 dark:text-gray-400 font-mono bg-white dark:bg-gray-700 p-2 rounded">
                             Secret: ZAILLISY-2FA-{user?.id?.slice(0, 8).toUpperCase()}
                           </p>
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                             Enter 6-digit verification code
                           </label>
                           <input
                             type="text"
                             placeholder="000000"
                             value={twoFACode}
                             onChange={(e) => {
                               const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                               setTwoFACode(value);
                             }}
                             maxLength={6}
                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest font-mono"
                           />
                         </div>
                       </div>
                       
                       <div className="flex space-x-3 mt-6">
                         <button
                           onClick={() => {
                             setShow2FASetup(false);
                             setTwoFACode('');
                           }}
                           className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                         >
                           Cancel
                         </button>
                         <button
                           onClick={complete2FASetup}
                           disabled={saving || twoFACode.length !== 6}
                           className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                         >
                           {saving ? 'Verifying...' : 'Verify & Enable'}
                         </button>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Bell className="w-5 h-5 text-black/70 dark:text-gray-400" />
                     <div>
                       <h3 className="font-medium text-black dark:text-white">Login Notifications</h3>
                       <p className="text-sm text-black/70 dark:text-gray-400">Get notified when someone logs into your account</p>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={securitySettings.loginNotifications}
                       onChange={async (e) => {
                         const newValue = e.target.checked;
                         const updated = { ...securitySettings, loginNotifications: newValue };
                         setSecuritySettings(updated);
                         
                         try {
                           await saveSettings({ security: updated });
                           toast.success(`Login notifications ${newValue ? 'enabled' : 'disabled'}`);
                         } catch (error: any) {
                           console.error('Error saving security settings:', error);
                           toast.error('Failed to save security settings');
                           setSecuritySettings(securitySettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Smartphone className="w-5 h-5 text-black/70 dark:text-gray-400" />
                     <div>
                       <h3 className="font-medium text-black dark:text-white">Device Management</h3>
                       <p className="text-sm text-black/70 dark:text-gray-400">
                         {devices.length > 0 
                           ? `${devices.length} device(s) connected` 
                           : 'Manage devices that have access to your account'}
                       </p>
                     </div>
                   </div>
                   <button 
                     onClick={() => setShowDevices(!showDevices)}
                     className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                   >
                     {showDevices ? 'Hide' : 'Manage'}
                   </button>
                 </div>
                 
                 {/* Devices List */}
                 {showDevices && (
                   <div className="mt-4 space-y-3">
                     {devices.map((device) => (
                       <div key={device.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                         <div className="flex items-center justify-between">
                           <div>
                             <h4 className="font-medium text-black dark:text-white">{device.name}</h4>
                             <p className="text-sm text-black/70 dark:text-gray-400">
                               {device.location} • Last active: {new Date(device.lastActive).toLocaleDateString()}
                             </p>
                           </div>
                           {device.id !== '1' && (
                             <button
                               onClick={async () => {
                                 if (confirm('Remove this device?')) {
                                   const updated = devices.filter(d => d.id !== device.id);
                                   setDevices(updated);
                                   localStorage.setItem('devices', JSON.stringify(updated));
                                   toast.success('Device removed');
                                 }
                               }}
                               className="text-red-600 hover:text-red-700 text-sm"
                             >
                               Remove
                             </button>
                           )}
                         </div>
                       </div>
                     ))}
                     {devices.length === 0 && (
                       <p className="text-sm text-black/70 dark:text-gray-400 text-center py-4">
                         No other devices found
                       </p>
                     )}
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Privacy Settings */}
           {activeTab === 'privacy' && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold text-black dark:text-white">Privacy Settings</h2>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Profile Visibility
                   </label>
                   <select
                     value={privacySettings.profileVisibility}
                     onChange={async (e) => {
                       const newValue = e.target.value;
                       const updated = { ...privacySettings, profileVisibility: newValue };
                       setPrivacySettings(updated);
                       
                       try {
                         await saveSettings({ privacy: updated });
                         toast.success('Privacy settings updated');
                       } catch (error: any) {
                         console.error('Error saving privacy settings:', error);
                         toast.error('Failed to save privacy settings');
                         setPrivacySettings(privacySettings);
                       }
                     }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                   >
                     <option value="public">Public</option>
                     <option value="friends">Friends Only</option>
                     <option value="private">Private</option>
                   </select>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Show Online Status</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Let others see when you're online</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={privacySettings.showOnlineStatus}
                       onChange={async (e) => {
                         const newValue = e.target.checked;
                         const updated = { ...privacySettings, showOnlineStatus: newValue };
                         setPrivacySettings(updated);
                         try {
                           await saveSettings({ privacy: updated });
                           toast.success(`Online status ${newValue ? 'visible' : 'hidden'}`);
                         } catch (error: any) {
                           console.error('Error saving privacy settings:', error);
                           toast.error('Failed to save privacy settings');
                           setPrivacySettings(privacySettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Allow Messages</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Let others send you messages</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={privacySettings.allowMessages}
                       onChange={async (e) => {
                         const newValue = e.target.checked;
                         const updated = { ...privacySettings, allowMessages: newValue };
                         setPrivacySettings(updated);
                         try {
                           await saveSettings({ privacy: updated });
                           toast.success(`Messages ${newValue ? 'allowed' : 'blocked'}`);
                         } catch (error: any) {
                           console.error('Error saving privacy settings:', error);
                           toast.error('Failed to save privacy settings');
                           setPrivacySettings(privacySettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Data Sharing</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Allow us to use your data for improvements</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={privacySettings.dataSharing}
                       onChange={async (e) => {
                         const newValue = e.target.checked;
                         const updated = { ...privacySettings, dataSharing: newValue };
                         setPrivacySettings(updated);
                         try {
                           await saveSettings({ privacy: updated });
                           toast.success(`Data sharing ${newValue ? 'enabled' : 'disabled'}`);
                         } catch (error: any) {
                           console.error('Error saving privacy settings:', error);
                           toast.error('Failed to save privacy settings');
                           setPrivacySettings(privacySettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
               </div>
             </div>
           )}

           {/* Payment Methods */}
           {activeTab === 'payment' && (
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-black dark:text-white">Payment Methods</h2>
                 <button 
                   onClick={() => setShowAddPayment(true)}
                   className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                 >
                   <Plus className="w-4 h-4" />
                   <span>Add Payment Method</span>
                 </button>
               </div>
               
               {/* Payment Method Form Modal */}
               {showAddPayment && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                   <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md text-black dark:text-white">
                     <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                       Add Payment Method
                     </h3>
                     
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                           Cardholder Name
                         </label>
                         <input
                           type="text"
                           placeholder="John Doe"
                           value={newPaymentMethod.cardName}
                           onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardName: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                           Card Number
                         </label>
                         <input
                           type="text"
                           placeholder="1234 5678 9012 3456"
                           value={newPaymentMethod.cardNumber}
                           onChange={(e) => {
                             const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                             setNewPaymentMethod(prev => ({ ...prev, cardNumber: value }));
                           }}
                           maxLength={19}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                         />
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2">
                         <div>
                           <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                             Month
                           </label>
                           <select
                             value={newPaymentMethod.expiryMonth}
                             onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                           >
                             <option value="">MM</option>
                             {Array.from({ length: 12 }, (_, i) => {
                               const month = String(i + 1).padStart(2, '0');
                               return <option key={month} value={month}>{month}</option>;
                             })}
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                             Year
                           </label>
                           <select
                             value={newPaymentMethod.expiryYear}
                             onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                           >
                             <option value="">YYYY</option>
                             {Array.from({ length: 10 }, (_, i) => {
                               const year = String(new Date().getFullYear() + i);
                               return <option key={year} value={year}>{year}</option>;
                             })}
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                             CVV
                           </label>
                           <input
                             type="text"
                             placeholder="123"
                             value={newPaymentMethod.cvv}
                             onChange={(e) => {
                               const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                               setNewPaymentMethod(prev => ({ ...prev, cvv: value }));
                             }}
                             maxLength={4}
                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                           />
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex space-x-3 mt-6">
                       <button
                         onClick={() => {
                           setShowAddPayment(false);
                           setNewPaymentMethod({
                             cardNumber: '',
                             cardName: '',
                             expiryMonth: '',
                             expiryYear: '',
                             cvv: '',
                             brand: 'Visa'
                           });
                         }}
                         className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={handleAddPaymentMethod}
                         disabled={saving}
                         className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                       >
                         {saving ? 'Adding...' : 'Add Card'}
                       </button>
                     </div>
                   </div>
                 </div>
               )}
               
               {paymentMethods.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                   <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-black/70 dark:text-gray-400 mb-2">No payment methods added yet</p>
                   <p className="text-sm text-black/50 dark:text-gray-500">Click "Add Payment Method" to add one</p>
                 </div>
               ) : (
               <div className="space-y-4">
                 {paymentMethods.map((method) => (
                   <div key={method.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <CreditCard className="w-5 h-5 text-black/70 dark:text-gray-400" />
                         <div>
                           <div className="flex items-center space-x-2">
                             <h3 className="font-semibold text-black dark:text-white">{method.brand} •••• {method.last4}</h3>
                             {method.isDefault && (
                               <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                                 Default
                               </span>
                             )}
                           </div>
                           <p className="text-sm text-black/70 dark:text-gray-400">Expires {method.expiryMonth}/{method.expiryYear}</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => handleSetDefaultPayment(method.id)}
                           className={`text-xs px-2 py-1 rounded ${
                             method.isDefault 
                               ? 'bg-green-100 text-green-800' 
                               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
                           disabled={method.isDefault}
                         >
                           {method.isDefault ? 'Default' : 'Set Default'}
                         </button>
                         <button 
                           onClick={() => handleDeletePaymentMethod(method.id)}
                           className="text-red-600 hover:text-red-700"
                           title="Delete Payment Method"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               )}
             </div>
           )}

           {/* Appearance Settings */}
           {activeTab === 'appearance' && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold text-black dark:text-white">Appearance Settings</h2>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Theme
                   </label>
                   <select
                    value={appearanceSettings.theme}
                    onChange={async (e) => {
                      const newValue = e.target.value;
                      const updated = { ...appearanceSettings, theme: newValue };
                      setAppearanceSettings(updated);
                      try {
                        await saveSettings({ appearance: updated });
                        setTheme(newValue as 'light' | 'dark');
                        localStorage.setItem('appearanceSettings', JSON.stringify(updated));
                        toast.success(`Theme changed to ${newValue}`);
                      } catch (error: any) {
                        console.error('Error saving appearance settings:', error);
                        toast.error('Failed to save appearance settings');
                        setAppearanceSettings(appearanceSettings);
                      }
                    }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                   >
                     <option value="light">Light</option>
                     <option value="dark">Dark</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Language
                   </label>
                   <select
                     value={appearanceSettings.language}
                     onChange={async (e) => {
                       const newValue = e.target.value;
                       const updated = { ...appearanceSettings, language: newValue };
                       setAppearanceSettings(updated);
                       try {
                         await saveSettings({ appearance: updated });
                         localStorage.setItem('appearanceSettings', JSON.stringify(updated));
                         toast.success(`Language changed to ${newValue}`);
                       } catch (error: any) {
                         console.error('Error saving appearance settings:', error);
                         toast.error('Failed to save appearance settings');
                         setAppearanceSettings(appearanceSettings);
                       }
                     }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                   >
                     <option value="en">English</option>
                     <option value="es">Spanish</option>
                     <option value="fr">French</option>
                     <option value="de">German</option>
                     <option value="ar">Arabic</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                     Font Size
                   </label>
                   <select
                     value={appearanceSettings.fontSize}
                     onChange={async (e) => {
                       const newValue = e.target.value;
                       const updated = { ...appearanceSettings, fontSize: newValue };
                       setAppearanceSettings(updated);
                       try {
                         await saveSettings({ appearance: updated });
                         localStorage.setItem('appearanceSettings', JSON.stringify(updated));
                         toast.success(`Font size changed to ${newValue}`);
                       } catch (error: any) {
                         console.error('Error saving appearance settings:', error);
                         toast.error('Failed to save appearance settings');
                         setAppearanceSettings(appearanceSettings);
                       }
                     }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                   >
                     <option value="small">Small</option>
                     <option value="medium">Medium</option>
                     <option value="large">Large</option>
                   </select>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Compact Mode</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Reduce spacing for more content</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={appearanceSettings.compactMode}
                       onChange={async (e) => {
                         const newValue = e.target.checked;
                         const updated = { ...appearanceSettings, compactMode: newValue };
                         setAppearanceSettings(updated);
                         try {
                           await saveSettings({ appearance: updated });
                           localStorage.setItem('appearanceSettings', JSON.stringify(updated));
                           toast.success(`Compact mode ${newValue ? 'enabled' : 'disabled'}`);
                         } catch (error: any) {
                           console.error('Error saving appearance settings:', error);
                           toast.error('Failed to save appearance settings');
                           setAppearanceSettings(appearanceSettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
               </div>
                          </div>
           )}

          {/* Shipping Addresses */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black dark:text-white">Shipping Addresses</h2>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address</span>
                </button>
              </div>

              {/* Address List */}
              <div className="space-y-4">
                {shippingAddresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">{address.fullName}</h3>
                          {address.isDefault && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-black/70 dark:text-gray-400 text-sm mb-1">{address.phone}</p>
                        <p className="text-black/70 dark:text-gray-400 text-sm">
                          {address.address}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-black/70 dark:text-gray-400 text-sm">{address.country}</p>
                      </div>
                                             <div className="flex items-center space-x-2">
                         <button
                           onClick={() => handleEditAddress(address)}
                           className="text-black/70 dark:text-gray-400 hover:text-black dark:hover:text-white"
                           title="Edit Address"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleSetDefaultAddress(address.id)}
                           className={`text-xs px-2 py-1 rounded ${
                             address.isDefault 
                               ? 'bg-green-100 text-green-800' 
                               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
                           disabled={address.isDefault}
                         >
                           {address.isDefault ? 'Default' : 'Set Default'}
                         </button>
                         <button
                           onClick={() => handleDeleteAddress(address.id)}
                           className="text-red-600 hover:text-red-700"
                           title="Delete Address"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Address Modal */}
              {showAddAddress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                   <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md text-black dark:text-white">
                   <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                     {newAddress.id ? 'Edit Address' : 'Add New Address'}
                   </h3>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      
                      <input
                        type="text"
                        placeholder="Address"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={newAddress.zipCode}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddAddress(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                                             <button
                         onClick={handleAddAddress}
                         className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                       >
                         {newAddress.id ? 'Update Address' : 'Add Address'}
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-black dark:text-white">Notification Preferences</h2>
              
              <div className="space-y-4">
                                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Email Notifications</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Receive order updates and promotions via email</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={notificationSettings.emailNotifications}
                       onChange={async (e) => {
                         const updated = { ...notificationSettings, emailNotifications: e.target.checked };
                         setNotificationSettings(updated);
                         try {
                           await saveSettings({ notifications: updated });
                         } catch (error) {
                           console.error('Error saving notification settings:', error);
                           toast.error('Failed to save notification settings');
                           setNotificationSettings(notificationSettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Push Notifications</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Get instant notifications on your device</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={notificationSettings.pushNotifications}
                       onChange={async (e) => {
                         const updated = { ...notificationSettings, pushNotifications: e.target.checked };
                         setNotificationSettings(updated);
                         try {
                           await saveSettings({ notifications: updated });
                         } catch (error) {
                           console.error('Error saving notification settings:', error);
                           toast.error('Failed to save notification settings');
                           setNotificationSettings(notificationSettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div>
                     <h3 className="font-medium text-black dark:text-white">Marketing Communications</h3>
                     <p className="text-sm text-black/70 dark:text-gray-400">Receive promotional offers and newsletters</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={notificationSettings.marketingCommunications}
                       onChange={async (e) => {
                         const updated = { ...notificationSettings, marketingCommunications: e.target.checked };
                         setNotificationSettings(updated);
                         try {
                           await saveSettings({ notifications: updated });
                         } catch (error) {
                           console.error('Error saving notification settings:', error);
                           toast.error('Failed to save notification settings');
                           setNotificationSettings(notificationSettings);
                         }
                       }}
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
