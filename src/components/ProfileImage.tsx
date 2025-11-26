'use client';

import React, { useState, useEffect } from 'react';

interface ProfileImageProps {
  user: {
    customPhotoURL?: string;  // Firebase storage URL
    photoURL?: string;        // Google Auth photoURL
    profilePic?: string;      // Alternative field name
    avatar?: string;          // Another alternative field name
    name?: string;
  };
  size?: number;
  className?: string;
}

export default function ProfileImage({ 
  user, 
  size = 128, 
  className = '' 
}: ProfileImageProps) {
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');

  // Profile image priority:
  // 1. Firebase storage uploaded image (customPhotoURL)
  // 2. Google Auth photoURL
  // 3. Alternative field names (profilePic, avatar)
  // 4. Default avatar
  useEffect(() => {
    // Reset state when user changes
    setImgError(false);
    setLoading(true);
    
    // Select the appropriate image URL - use user's own profile picture
    let selectedImage = user?.customPhotoURL || 
      user?.photoURL || 
      user?.profilePic || 
      user?.avatar || 
      '';

    // If no image URL is provided, use the default avatar
    if (!selectedImage) {
      setImageSrc('https://api.dicebear.com/7.x/avataaars/svg?seed=Default');
      setLoading(false);
      return;
    }

    // Handle different types of image URLs
    if (selectedImage.includes('firebasestorage.googleapis.com') || selectedImage.includes('firebasestorage.app')) {
      // For Firebase Storage URLs, ensure proper format
      setImageSrc(selectedImage);
    } 
    // For Google Auth photos, we might need to handle CORS issues
    else if (selectedImage.includes('googleusercontent.com')) {
      setImageSrc(selectedImage);
    } 
    // For other images, including default avatars, use as is
    else {
      setImageSrc(selectedImage);
    }
    setLoading(false);
  }, [user]);

  const profileImage = imgError 
    ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default' 
    : imageSrc || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default';

  // Handle image load and error events
  const handleImageLoad = () => {
    console.log('Profile image loaded successfully:', profileImage);
    setLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Profile image failed to load:', {
      src: (e.target as HTMLImageElement).src,
      user: user?.name || 'Unknown user'
    });
    setImgError(true);
    setLoading(false);
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Using standard img tag with unoptimized approach */}
      <img
        src={profileImage}
        alt={user?.name || 'Profile'}
        width={size}
        height={size}
        onLoad={handleImageLoad}
        onError={handleImageError}
        referrerPolicy="no-referrer"
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} absolute inset-0 w-full h-full object-cover`}
      />
      {loading && (
        <div 
          className="absolute inset-0 bg-gray-200 rounded-full"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}