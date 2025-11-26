'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed unused Image import
import { 
  ArrowLeft,
  Camera,
  Save,
  X,
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle
} from 'lucide-react';
import { useSession } from '@/hooks/useCustomSession';
import { useGlobalProfileStore } from '@/store/globalProfileStore';
import { clearBlobUrls } from '@/utils/clearBlobUrls';
import { uploadFile } from '@/lib/firebaseStorage';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const [profile, setProfile] = useState<any>(null);
  const { updateProfilePicture, updateBannerImage } = useGlobalProfileStore();
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    about: '',
    phone: '',
    email: '',
    photoURL: '',
    username: ''
  });
  const [usernameLastChanged, setUsernameLastChanged] = useState<Date | null>(null); // Track when username was last changed

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

  // Fetch profile data when component mounts
  useEffect(() => {
    // Wait for auth to load
    if (status === 'loading') return;
    
    // Redirect if not authenticated
    if (!user?.id) {
      router.push('/auth-login');
      return;
    }
    
    // Fetch profile
    fetchProfile(user.id);
  }, [user?.id, status, router]);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      // Determine which image URL to use with proper priority
      let profileImageUrl = '';
      if (profile.customPhotoURL) {
        profileImageUrl = profile.customPhotoURL;
      } else if (profile.photoURL) {
        profileImageUrl = profile.photoURL;
      } else if (profile.profilePic) {
        profileImageUrl = profile.profilePic;
      } else if (profile.avatar) {
        profileImageUrl = profile.avatar;
      }
      
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        about: profile.about || '',
        phone: profile.phone || '',
        email: profile.email || '',
        photoURL: profileImageUrl,
        username: profile.username || ''
      });
      
      // Set username last changed date if available
      if (profile.usernameLastChanged) {
        setUsernameLastChanged(new Date(profile.usernameLastChanged));
      }
    }
  }, [profile]);

  // Clear any blob URLs from localStorage on component mount
  useEffect(() => {
    clearBlobUrls();
  }, []);

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-black/80 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      console.log('Starting image upload...', { fileName: file.name, fileSize: file.size });
      
      // Upload to AWS S3
      try {
        // Upload to AWS S3 using our AWS implementation
        const result = await uploadFile(file, `profile-images/${user.id}/${file.name}`);
        console.log('Upload completed to S3, download URL obtained:', result.url);

        // Update form data with new image URL
        setFormData(prev => ({
          ...prev,
          photoURL: result.url
        }));

        // Update global profile store
        updateProfilePicture(result.url);

        toast.success('Profile picture updated successfully');
        return; // Success, exit early
      } catch (firebaseError) {
        console.warn('Firebase Storage upload failed, trying fallback:', firebaseError);
        throw firebaseError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Fallback: Use data URL for immediate preview
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataURL = e.target?.result as string;
          console.log('Using data URL fallback:', dataURL.substring(0, 50) + '...');
          setFormData(prev => ({
            ...prev,
            photoURL: dataURL
          }));
          // Update global profile store with data URL (not blob URL)
          updateProfilePicture(dataURL);
          toast.success('Profile picture updated (local preview)');
        };
        reader.readAsDataURL(file);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        // More specific error messages
        if (error instanceof Error) {
          if (error.message.includes('storage/unauthorized')) {
            toast.error('Upload failed: Unauthorized. Please check your permissions.');
          } else if (error.message.includes('storage/quota-exceeded')) {
            toast.error('Upload failed: Storage quota exceeded.');
          } else if (error.message.includes('storage/network-request-failed')) {
            toast.error('Upload failed: Network error. Please check your connection.');
          } else {
            toast.error(`Upload failed: ${error.message}`);
          }
        } else {
          toast.error('Failed to upload image. Please try again.');
        }
      }
    } finally {
      setUploadingImage(false);
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user || !user.id) return;
    
    setLoading(true);
    try {
      await updateProfile(user.id, {
        name: formData.name,
        bio: formData.bio,
        about: formData.about,
        phone: formData.phone,
        photoURL: formData.photoURL,
        customPhotoURL: formData.photoURL, // Save to customPhotoURL as well
        username: formData.username
      });
      
      // Update global profile store with the final saved image
      if (formData.photoURL) {
        updateProfilePicture(formData.photoURL);
      }
      
      // Update localStorage cache so header shows new photo immediately
      const cachedProfile = localStorage.getItem(`profile_${user.id}`);
      if (cachedProfile) {
        try {
          const profileData = JSON.parse(cachedProfile);
          profileData.customPhotoURL = formData.photoURL;
          profileData.photoURL = formData.photoURL;
          localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
        } catch (error) {
          console.warn('Failed to update cached profile:', error);
        }
      }
      
      toast.success('Profile updated successfully');
      router.push(`/profile/${formData.username || user.id}`);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Check if username change is restricted
  const isUsernameChangeRestricted = () => {
    if (!profile?.username || !usernameLastChanged) return false;
    
    // If username hasn't changed, no restriction
    if (formData.username === profile.username) return false;
    
    const now = new Date();
    const daysSinceLastChange = Math.floor((now.getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastChange < 30;
  };

  // Get message about when username can be changed
  const getUsernameChangeMessage = () => {
    if (!usernameLastChanged) return 'Your username must be unique. You can change it once every 30 days.';
    
    const now = new Date();
    const daysSinceLastChange = Math.floor((now.getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastChange >= 30) {
      return 'You can change your username now.';
    } else {
      const daysLeft = 30 - daysSinceLastChange;
      return `You can change your username again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Please Log In</h1>
          <p className="text-black/80 dark:text-gray-400">You need to be logged in to edit your profile.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center text-black dark:text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-black/80 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 text-black dark:text-white">
        <button onClick={handleCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft className="w-6 h-6 text-black dark:text-white" />
        </button>
        <h1 className="text-lg font-semibold text-black dark:text-white">Edit Profile</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 text-black dark:text-white">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {formData.photoURL ? (
                <img 
                  src={formData.photoURL} 
                  alt="Profile" 
                  width="96" 
                  height="96" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer">
              <Camera className="w-4 h-4 text-white" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>
          {uploadingImage && (
            <div className="mt-2 text-sm text-purple-600">Uploading...</div>
          )}
        </div>

        {/* Default Avatar Selection - Removed */}

        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-black/70 dark:text-gray-400">@</span>
            </div>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="block w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="yourusername"
              disabled={isUsernameChangeRestricted()} // Disable if change is restricted
            />
          </div>
          {usernameLastChanged && (
            <p className="mt-1 text-xs text-black/70 dark:text-gray-400">
              {getUsernameChangeMessage()}
            </p>
          )}
          {!usernameLastChanged && (
            <p className="mt-1 text-xs text-black/70 dark:text-gray-400">
              Your username must be unique. You can change it once every 30 days.
            </p>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Your name"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            Bio (Short Description)
          </label>
          <textarea
            id="bio"
            rows={2}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="A short description about yourself"
          />
        </div>

        {/* About */}
        <div className="mb-4">
          <label htmlFor="about" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            About (Detailed Description)
          </label>
          <textarea
            id="about"
            rows={4}
            value={formData.about}
            onChange={(e) => handleInputChange('about', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="A detailed description about yourself"
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Your phone number"
          />
        </div>

        {/* Email - Read only */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            readOnly
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-black/70 dark:text-gray-400"
            placeholder="Your email"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-black dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

    </div>
    </div>
  );
}
