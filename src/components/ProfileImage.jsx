'use client';
import React, { useState, useEffect } from 'react';
export default function ProfileImage({ user, size = 128, className = '' }) {
    const [imgError, setImgError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState('');
    // Profile image priority (AWS DynamoDB):
    // 1. AWS S3 uploaded image (customPhotoURL)
    // 2. AWS S3 photoURL
    // 3. Alternative field names (profilePic, avatar)
    // 4. Default avatar
    useEffect(() => {
        // Reset state when user changes
        setImgError(false);
        setLoading(true);
        
        if (!user) {
            setImageSrc('https://api.dicebear.com/7.x/avataaars/svg?seed=Default');
            setLoading(false);
            return;
        }
        
        // Select the appropriate image URL - prioritize AWS S3 URLs
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
        
        // Filter out blob URLs - only use valid S3 or data URLs
        if (selectedImage.startsWith('blob:')) {
            console.warn('⚠️ Blob URL detected, using default avatar');
            setImageSrc('https://api.dicebear.com/7.x/avataaars/svg?seed=Default');
            setLoading(false);
            return;
        }
        
        // Use the image URL as-is (S3, data URL, or other valid URLs)
        setImageSrc(selectedImage);
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
    const handleImageError = (e) => {
        console.log('Profile image failed to load:', {
            src: e.target.src,
            user: (user === null || user === void 0 ? void 0 : user.name) || 'Unknown user'
        });
        setImgError(true);
        setLoading(false);
    };
    return (<div className="relative" style={{ width: size, height: size }}>
      {/* Using standard img tag with unoptimized approach */}
      <img src={profileImage} alt={(user === null || user === void 0 ? void 0 : user.name) || 'Profile'} width={size} height={size} onLoad={handleImageLoad} onError={handleImageError} referrerPolicy="no-referrer" className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} absolute inset-0 w-full h-full object-cover`}/>
      {loading && (<div className="absolute inset-0 bg-gray-200 rounded-full" style={{ width: size, height: size }}/>)}
    </div>);
}
