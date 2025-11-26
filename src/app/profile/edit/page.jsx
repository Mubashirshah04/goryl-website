'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed unused Image import
import { ArrowLeft, Camera, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { uploadFile } from '@/lib/firebaseStorage';
import { toast } from 'sonner';
export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { profile, fetchProfile, updateProfile } = useUserProfileStore();
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
    const [usernameLastChanged, setUsernameLastChanged] = useState(null); // Track when username was last changed
    // Fetch profile data when component mounts
    useEffect(() => {
        if (user === null || user === void 0 ? void 0 : user.sub) {
            fetchProfile(user.sub);
        }
    }, [user === null || user === void 0 ? void 0 : user.sub]); // FIXED: removed fetchProfile from deps to prevent infinite loop
    // Update form data when profile is loaded
    useEffect(() => {
        if (profile) {
            // Determine which image URL to use with proper priority
            let profileImageUrl = '';
            if (profile.customPhotoURL) {
                profileImageUrl = profile.customPhotoURL;
            }
            else if (profile.photoURL) {
                profileImageUrl = profile.photoURL;
            }
            else if (profile.profilePic) {
                profileImageUrl = profile.profilePic;
            }
            else if (profile.avatar) {
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
    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);
    const handleInputChange = (field, value) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    const handleImageUpload = async (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file || !(user === null || user === void 0 ? void 0 : user.sub))
            return;
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
            // Try Firebase Storage first
            try {
                // Upload to Firebase Storage using our new implementation
                const result = await uploadFile(file, `profile-images/${user.sub}/${file.name}`);
                console.log('Upload completed, download URL obtained:', result.url);
                // Update form data with new image URL
                setFormData(prev => (Object.assign(Object.assign({}, prev), { photoURL: result.url })));
                toast.success('Profile picture updated successfully');
                return; // Success, exit early
            }
            catch (firebaseError) {
                console.warn('Firebase Storage upload failed, trying fallback:', firebaseError);
                throw firebaseError; // Re-throw to be caught by outer catch
            }
        }
        catch (error) {
            console.error('Error uploading image:', error);
            // Fallback: Use data URL for immediate preview
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    var _a;
                    const dataURL = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                    setFormData(prev => (Object.assign(Object.assign({}, prev), { photoURL: dataURL })));
                    toast.success('Profile picture updated (local preview)');
                };
                reader.readAsDataURL(file);
            }
            catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                // More specific error messages
                if (error instanceof Error) {
                    if (error.message.includes('storage/unauthorized')) {
                        toast.error('Upload failed: Unauthorized. Please check your permissions.');
                    }
                    else if (error.message.includes('storage/quota-exceeded')) {
                        toast.error('Upload failed: Storage quota exceeded.');
                    }
                    else if (error.message.includes('storage/network-request-failed')) {
                        toast.error('Upload failed: Network error. Please check your connection.');
                    }
                    else {
                        toast.error(`Upload failed: ${error.message}`);
                    }
                }
                else {
                    toast.error('Failed to upload image. Please try again.');
                }
            }
        }
        finally {
            setUploadingImage(false);
            // Reset the input value so the same file can be selected again
            event.target.value = '';
        }
    };
    const handleSave = async () => {
        if (!user)
            return;
        setLoading(true);
        try {
            await updateProfile(user.sub, {
                name: formData.name,
                bio: formData.bio,
                about: formData.about,
                phone: formData.phone,
                photoURL: formData.photoURL,
                customPhotoURL: formData.photoURL, // Save to customPhotoURL as well
                username: formData.username
            });
            toast.success('Profile updated successfully');
            router.push(`/profile/${user.sub}`);
        }
        catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCancel = () => {
        router.back();
    };
    // Check if username change is restricted
    const isUsernameChangeRestricted = () => {
        if (!(profile === null || profile === void 0 ? void 0 : profile.username) || !usernameLastChanged)
            return false;
        // If username hasn't changed, no restriction
        if (formData.username === profile.username)
            return false;
        const now = new Date();
        const daysSinceLastChange = Math.floor((now.getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLastChange < 30;
    };
    // Get message about when username can be changed
    const getUsernameChangeMessage = () => {
        if (!usernameLastChanged)
            return 'Your username must be unique. You can change it once every 30 days.';
        const now = new Date();
        const daysSinceLastChange = Math.floor((now.getTime() - usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastChange >= 30) {
            return 'You can change your username now.';
        }
        else {
            const daysLeft = 30 - daysSinceLastChange;
            return `You can change your username again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
        }
    };
    if (!user) {
        return (<div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Log In</h1>
          <p className="text-gray-600 dark:text-gray-300">You need to be logged in to edit your profile.</p>
        </div>
      </div>);
    }
    if (!profile) {
        return (<div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>);
    }
    // Default avatar options with more variety
    const defaultAvatars = [
        { id: 'avatar1', name: 'Avatar 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar1&backgroundColor=ffdfbf&eyebrow=raisedExcitedNatural,upMale2,frownMale2' },
        { id: 'avatar2', name: 'Avatar 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar2&backgroundColor=d1d4f9&eyebrow=raisedExcited,frownFemale2,upFemale2' },
        { id: 'avatar3', name: 'Avatar 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar3&backgroundColor=c0aede&eyebrow=raisedExcitedNatural,upMale2,frownMale2&eyes=squint,surprised,wink' },
        { id: 'avatar4', name: 'Avatar 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar4&backgroundColor=ffd5dc&eyebrow=raisedExcited,frownFemale2,upFemale2&eyes=eyeRoll,surprised,wink' },
        { id: 'avatar5', name: 'Avatar 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar5&backgroundColor=a0d2eb&eyebrow=raisedExcitedNatural,upMale2,frownMale2&eyes=default,squint,surprised' },
        { id: 'avatar6', name: 'Avatar 6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar6&backgroundColor=ffb6c1&eyebrow=raisedExcited,frownFemale2,upFemale2&eyes=eyeRoll,default,wink' },
    ];
    const handleDefaultAvatarSelect = (avatarUrl) => {
        console.log('Selecting default avatar:', avatarUrl);
        setFormData(prev => (Object.assign(Object.assign({}, prev), { photoURL: avatarUrl })));
        toast.success('Default avatar selected');
    };
    // Test if default avatars are loading
    useEffect(() => {
        console.log('Default avatars available:', defaultAvatars.length);
        // Test loading each avatar
        defaultAvatars.forEach((avatar, index) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Avatar ${index + 1} loaded successfully:`, avatar.name);
            };
            img.onerror = () => {
                console.error(`Failed to load avatar ${index + 1}:`, avatar.name, avatar.url);
            };
            img.src = avatar.url;
        });
    }, []);
    return (<div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={handleCancel} className="p-2">
          <ArrowLeft className="w-6 h-6"/>
        </button>
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
        }} className="p-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {formData.photoURL ? (<img src={formData.photoURL} alt="Profile" width="96" height="96" className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400 dark:text-gray-500"/>
                </div>)}
            </div>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer">
              <Camera className="w-4 h-4 text-white"/>
            </label>
            <input id="photo-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage}/>
          </div>
          {uploadingImage && (<div className="mt-2 text-sm text-purple-600">Uploading...</div>)}
        </div>

        {/* Default Avatar Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Or choose a default avatar:</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {defaultAvatars.map((avatar) => (<button key={avatar.id} type="button" onClick={() => handleDefaultAvatarSelect(avatar.url)} className={`rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 ${formData.photoURL === avatar.url
                ? 'border-purple-500 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-300'}`} title={avatar.name}>
                <img src={avatar.url} alt={avatar.name} className="w-full h-20 object-cover" onError={(e) => {
                console.error('Failed to load avatar:', avatar.url);
                // Set a fallback image
                e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default';
            }} onLoad={() => {
                console.log('Avatar loaded successfully:', avatar.name, avatar.url);
            }}/>
              </button>))}
          </div>
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            Selected avatar: {formData.photoURL || 'None'}
          </div>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">@</span>
            </div>
            <input type="text" id="username" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="yourusername" disabled={isUsernameChangeRestricted()} // Disable if change is restricted
    />
          </div>
          {usernameLastChanged && (<p className="mt-1 text-xs text-gray-500">
              {getUsernameChangeMessage()}
            </p>)}
          {!usernameLastChanged && (<p className="mt-1 text-xs text-gray-500">
              Your username must be unique. You can change it once every 30 days.
            </p>)}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input type="text" id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Your name"/>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio (Short Description)
          </label>
          <textarea id="bio" rows={2} value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="A short description about yourself"/>
        </div>

        {/* About */}
        <div className="mb-4">
          <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
            About (Detailed Description)
          </label>
          <textarea id="about" rows={4} value={formData.about} onChange={(e) => handleInputChange('about', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="A detailed description about yourself"/>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input type="tel" id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Your phone number"/>
        </div>

        {/* Email - Read only */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input type="email" id="email" value={formData.email} readOnly className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" placeholder="Your email"/>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>);
}

