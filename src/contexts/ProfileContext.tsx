'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProfileContextType {
  profilePicture: string | null;
  bannerImage: string | null;
  updateProfilePicture: (imageUrl: string) => void;
  updateBannerImage: (imageUrl: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    // Return default values if not within ProfileProvider
    return {
      profilePicture: null,
      bannerImage: null,
      updateProfilePicture: () => {},
      updateBannerImage: () => {}
    };
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const updateProfilePicture = (imageUrl: string) => {
    setProfilePicture(imageUrl);
    // Store in localStorage for persistence (only on client side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('profilePicture', imageUrl);
    }
  };

  const updateBannerImage = (imageUrl: string) => {
    setBannerImage(imageUrl);
    // Store in localStorage for persistence (only on client side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('bannerImage', imageUrl);
    }
  };

  // Load from localStorage on mount (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfilePicture = localStorage.getItem('profilePicture');
      const savedBannerImage = localStorage.getItem('bannerImage');
      
      if (savedProfilePicture) {
        setProfilePicture(savedProfilePicture);
      }
      if (savedBannerImage) {
        setBannerImage(savedBannerImage);
      }
    }
  }, []);

  return (
    <ProfileContext.Provider value={{
      profilePicture,
      bannerImage,
      updateProfilePicture,
      updateBannerImage
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
