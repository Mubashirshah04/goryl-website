'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { signOut } from '@/lib/firebaseAuth';
import { auth } from '@/lib/firebase';
import { ArrowLeft, Settings, User, MapPin, Bell, LogOut, Save, Plus, X, Shield, Eye, CreditCard, Palette, Lock, Smartphone, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
export default function SettingsPage() {
    const { user } = useAuthStore();
    const { profile, fetchProfile, updateProfile } = useUserProfileStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Form states
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        bio: '',
        about: ''
    });
    const [shippingAddresses, setShippingAddresses] = useState([]);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
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
    const [paymentMethods, setPaymentMethods] = useState([]);
    const { theme, setTheme } = useTheme();
    const [appearanceSettings, setAppearanceSettings] = useState(() => {
        // Try to load theme from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('appearanceSettings');
            if (saved)
                return JSON.parse(saved);
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
        if (typeof window === 'undefined')
            return;
        localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
        if (appearanceSettings.theme === 'dark')
            setTheme('dark');
        if (appearanceSettings.theme === 'light')
            setTheme('light');
    }, [appearanceSettings.theme, setTheme]);
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        marketingCommunications: false
    });
    // Load data only once when component mounts
    useEffect(() => {
        if (!user) {
            router.push('/auth-login');
            return;
        }
        const loadData = async () => {
            setLoading(true);
            try {
                await fetchProfile(user.sub);
                // Initialize with empty shipping addresses instead of demo data
                setShippingAddresses([]);
            }
            catch (error) {
                console.error('Error loading settings:', error);
                toast.error('Failed to load settings');
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []); // Empty dependency array to run only once
    // Update profile data when profile changes
    useEffect(() => {
        if (profile) {
            setProfileData({
                name: profile.name || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                about: profile.about || ''
            });
        }
    }, [profile]);
    const handleProfileSave = async () => {
        if (!user)
            return;
        setSaving(true);
        try {
            await updateProfile(user.sub, {
                name: profileData.name,
                phone: profileData.phone,
                bio: profileData.bio,
                about: profileData.about
            });
            toast.success('Profile updated successfully');
        }
        catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddAddress = () => {
        if (!newAddress.fullName || !newAddress.address || !newAddress.city || !newAddress.country) {
            toast.error('Please fill in all required fields');
            return;
        }
        // Check if we're editing an existing address
        const isEditing = shippingAddresses.some(addr => addr.id === newAddress.id);
        if (isEditing) {
            // Update existing address
            setShippingAddresses(prev => prev.map(addr => addr.id === newAddress.id ? newAddress : addr));
            toast.success('Address updated successfully');
        }
        else {
            // Add new address
            const address = Object.assign(Object.assign({}, newAddress), { id: Date.now().toString() });
            setShippingAddresses(prev => [...prev, address]);
            toast.success('Address added successfully');
        }
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
    };
    const handleDeleteAddress = (id) => {
        setShippingAddresses(prev => prev.filter(addr => addr.id !== id));
        toast.success('Address deleted successfully');
    };
    const handleEditAddress = (address) => {
        setNewAddress(address);
        setShowAddAddress(true);
    };
    const handleSetDefaultAddress = (id) => {
        setShippingAddresses(prev => prev.map(addr => (Object.assign(Object.assign({}, addr), { isDefault: addr.id === id }))));
        toast.success('Default address updated');
    };
    const handleDeletePaymentMethod = (id) => {
        setPaymentMethods(prev => prev.filter(method => method.id !== id));
        toast.success('Payment method deleted successfully');
    };
    const handleSetDefaultPayment = (id) => {
        setPaymentMethods(prev => prev.map(method => (Object.assign(Object.assign({}, method), { isDefault: method.id === id }))));
        toast.success('Default payment method updated');
    };
    const handleAddPaymentMethod = () => {
        const newMethod = {
            id: Date.now().toString(),
            type: 'card',
            last4: '1234',
            brand: 'MasterCard',
            isDefault: paymentMethods.length === 0,
            expiryMonth: '12',
            expiryYear: '2026'
        };
        setPaymentMethods(prev => [...prev, newMethod]);
        toast.success('Payment method added successfully');
    };
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
            toast.success('Signed out successfully');
        }
        catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out');
        }
    };
    if (!user) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login first</h1>
          <p className="text-gray-600 dark:text-gray-300">You need to be authenticated to access settings</p>
        </div>
      </div>);
    }
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${user.sub}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600"/>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage your account preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

             <div className="max-w-4xl mx-auto px-4 py-6">
         {/* Settings Tabs */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
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
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                   <Icon className="w-4 h-4"/>
                   <span>{tab.label}</span>
                 </button>);
        })}
           </div>
         </div>

                 {/* Tab Content */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           {/* Profile Settings */}
           {activeTab === 'profile' && (<div className="space-y-6">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Full Name
                   </label>
                   <input type="text" value={profileData.name} onChange={(e) => setProfileData(prev => (Object.assign(Object.assign({}, prev), { name: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter your full name"/>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Phone Number
                   </label>
                   <input type="tel" value={profileData.phone} onChange={(e) => setProfileData(prev => (Object.assign(Object.assign({}, prev), { phone: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter phone number"/>
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Bio (Short Description)
                 </label>
                 <textarea value={profileData.bio} onChange={(e) => setProfileData(prev => (Object.assign(Object.assign({}, prev), { bio: e.target.value })))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="A short description about yourself..."/>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   About (Detailed Description)
                 </label>
                 <textarea value={profileData.about} onChange={(e) => setProfileData(prev => (Object.assign(Object.assign({}, prev), { about: e.target.value })))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="A detailed description about yourself..."/>
               </div>
               
               <button onClick={handleProfileSave} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                 <Save className="w-4 h-4"/>
                 <span>{saving ? 'Saving...' : 'Save Changes'}</span>
               </button>
             </div>)}

           {/* Security Settings */}
           {activeTab === 'security' && (<div className="space-y-6">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Lock className="w-5 h-5 text-gray-600"/>
                     <div>
                       <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                       <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security to your account</p>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={securitySettings.twoFactorAuth} onChange={(e) => setSecuritySettings(prev => (Object.assign(Object.assign({}, prev), { twoFactorAuth: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Bell className="w-5 h-5 text-gray-600"/>
                     <div>
                       <h3 className="font-medium text-gray-900 dark:text-white">Login Notifications</h3>
                       <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when someone logs into your account</p>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={securitySettings.loginNotifications} onChange={(e) => setSecuritySettings(prev => (Object.assign(Object.assign({}, prev), { loginNotifications: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Smartphone className="w-5 h-5 text-gray-600"/>
                     <div>
                       <h3 className="font-medium text-gray-900 dark:text-white">Device Management</h3>
                       <p className="text-sm text-gray-600 dark:text-gray-300">Manage devices that have access to your account</p>
                     </div>
                   </div>
                   <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                     Manage
                   </button>
                 </div>
               </div>
             </div>)}

           {/* Privacy Settings */}
           {activeTab === 'privacy' && (<div className="space-y-6">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Profile Visibility
                   </label>
                   <select value={privacySettings.profileVisibility} onChange={(e) => setPrivacySettings(prev => (Object.assign(Object.assign({}, prev), { profileVisibility: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                     <option value="public">Public</option>
                     <option value="friends">Friends Only</option>
                     <option value="private">Private</option>
                   </select>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Show Online Status</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Let others see when you're online</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={privacySettings.showOnlineStatus} onChange={(e) => setPrivacySettings(prev => (Object.assign(Object.assign({}, prev), { showOnlineStatus: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Allow Messages</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Let others send you messages</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={privacySettings.allowMessages} onChange={(e) => setPrivacySettings(prev => (Object.assign(Object.assign({}, prev), { allowMessages: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Data Sharing</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Allow us to use your data for improvements</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={privacySettings.dataSharing} onChange={(e) => setPrivacySettings(prev => (Object.assign(Object.assign({}, prev), { dataSharing: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
               </div>
             </div>)}

           {/* Payment Methods */}
           {activeTab === 'payment' && (<div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
                 <button onClick={handleAddPaymentMethod} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                   <Plus className="w-4 h-4"/>
                   <span>Add Payment Method</span>
                 </button>
               </div>
               
               <div className="space-y-4">
                 {paymentMethods.map((method) => (<div key={method.id} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <CreditCard className="w-5 h-5 text-gray-600"/>
                         <div>
                           <div className="flex items-center space-x-2">
                             <h3 className="font-semibold text-gray-900 dark:text-white">{method.brand} •••• {method.last4}</h3>
                             {method.isDefault && (<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                 Default
                               </span>)}
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300">Expires {method.expiryMonth}/{method.expiryYear}</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <button onClick={() => handleSetDefaultPayment(method.id)} className={`text-xs px-2 py-1 rounded ${method.isDefault
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} disabled={method.isDefault}>
                           {method.isDefault ? 'Default' : 'Set Default'}
                         </button>
                         <button onClick={() => handleDeletePaymentMethod(method.id)} className="text-red-600 hover:text-red-700" title="Delete Payment Method">
                           <Trash2 className="w-4 h-4"/>
                         </button>
                       </div>
                     </div>
                   </div>))}
               </div>
             </div>)}

           {/* Appearance Settings */}
           {activeTab === 'appearance' && (<div className="space-y-6">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance Settings</h2>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Theme
                   </label>
                   <select value={appearanceSettings.theme} onChange={(e) => setAppearanceSettings((prev) => (Object.assign(Object.assign({}, prev), { theme: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                     <option value="light">Light</option>
                     <option value="dark">Dark</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Language
                   </label>
                   <select value={appearanceSettings.language} onChange={(e) => setAppearanceSettings((prev) => (Object.assign(Object.assign({}, prev), { language: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                     <option value="en">English</option>
                     <option value="es">Spanish</option>
                     <option value="fr">French</option>
                     <option value="de">German</option>
                     <option value="ar">Arabic</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Font Size
                   </label>
                   <select value={appearanceSettings.fontSize} onChange={(e) => setAppearanceSettings((prev) => (Object.assign(Object.assign({}, prev), { fontSize: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                     <option value="small">Small</option>
                     <option value="medium">Medium</option>
                     <option value="large">Large</option>
                   </select>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Compact Mode</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Reduce spacing for more content</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={appearanceSettings.compactMode} onChange={(e) => setAppearanceSettings((prev) => (Object.assign(Object.assign({}, prev), { compactMode: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
               </div>
                          </div>)}

          {/* Shipping Addresses */}
          {activeTab === 'shipping' && (<div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Addresses</h2>
                <button onClick={() => setShowAddAddress(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Plus className="w-4 h-4"/>
                  <span>Add Address</span>
                </button>
              </div>

              {/* Address List */}
              <div className="space-y-4">
                {shippingAddresses.map((address) => (<div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{address.fullName}</h3>
                          {address.isDefault && (<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default
                            </span>)}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{address.phone}</p>
                        <p className="text-gray-600 text-sm">
                          {address.address}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-gray-600 text-sm">{address.country}</p>
                      </div>
                                             <div className="flex items-center space-x-2">
                         <button onClick={() => handleEditAddress(address)} className="text-gray-600 hover:text-gray-700" title="Edit Address">
                           <Edit className="w-4 h-4"/>
                         </button>
                         <button onClick={() => handleSetDefaultAddress(address.id)} className={`text-xs px-2 py-1 rounded ${address.isDefault
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} disabled={address.isDefault}>
                           {address.isDefault ? 'Default' : 'Set Default'}
                         </button>
                         <button onClick={() => handleDeleteAddress(address.id)} className="text-red-600 hover:text-red-700" title="Delete Address">
                           <X className="w-4 h-4"/>
                         </button>
                       </div>
                    </div>
                  </div>))}
              </div>

              {/* Add Address Modal */}
              {showAddAddress && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                   <div className="bg-white rounded-xl p-6 w-full max-w-md">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                     {newAddress.id ? 'Edit Address' : 'Add New Address'}
                   </h3>
                    
                    <div className="space-y-4">
                      <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { fullName: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                      
                      <input type="tel" placeholder="Phone Number" value={newAddress.phone} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { phone: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                      
                      <input type="text" placeholder="Address" value={newAddress.address} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { address: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { city: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                        <input type="text" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { state: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="ZIP Code" value={newAddress.zipCode} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { zipCode: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                        <input type="text" placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress(prev => (Object.assign(Object.assign({}, prev), { country: e.target.value })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                      <button onClick={() => setShowAddAddress(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                                             <button onClick={handleAddAddress} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                         {newAddress.id ? 'Update Address' : 'Add Address'}
                       </button>
                    </div>
                  </div>
                </div>)}
            </div>)}

          {/* Notifications */}
          {activeTab === 'notifications' && (<div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
              
              <div className="space-y-4">
                                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Receive order updates and promotions via email</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={notificationSettings.emailNotifications} onChange={(e) => setNotificationSettings(prev => (Object.assign(Object.assign({}, prev), { emailNotifications: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Get instant notifications on your device</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={notificationSettings.pushNotifications} onChange={(e) => setNotificationSettings(prev => (Object.assign(Object.assign({}, prev), { pushNotifications: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                   <div>
                     <h3 className="font-medium text-gray-900 dark:text-white">Marketing Communications</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-300">Receive promotional offers and newsletters</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={notificationSettings.marketingCommunications} onChange={(e) => setNotificationSettings(prev => (Object.assign(Object.assign({}, prev), { marketingCommunications: e.target.checked })))} className="sr-only peer"/>
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
              </div>
            </div>)}
        </div>

        {/* Sign Out Button */}
        <div className="mt-6">
          <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <LogOut className="w-4 h-4"/>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>);
}

