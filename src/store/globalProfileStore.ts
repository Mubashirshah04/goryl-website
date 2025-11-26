'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalProfileState {
  profilePicture: string | null;
  bannerImage: string | null;
  updateProfilePicture: (imageUrl: string) => void;
  updateBannerImage: (imageUrl: string) => void;
  clearProfile: () => void;
  compressImage: (file: File, maxSizeKB?: number) => Promise<string>;
}

export const useGlobalProfileStore = create<GlobalProfileState>()(
  persist(
    (set) => ({
      profilePicture: null,
      bannerImage: null,
      updateProfilePicture: (imageUrl: string) => {
        // Only accept data URLs (base64) or valid HTTP/HTTPS URLs
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
          set({ profilePicture: imageUrl });
          // Only store in localStorage if it's not a large base64 image
          if (typeof window !== 'undefined') {
            try {
              // Check if it's a base64 image and if it's too large (>100KB)
              if (imageUrl.startsWith('data:') && imageUrl.length > 100000) {
                console.log('Image too large for localStorage, storing in memory only');
                // Don't store large base64 images in localStorage
              } else {
                localStorage.setItem('globalProfilePicture', imageUrl);
              }
            } catch (error) {
              console.warn('Failed to store in localStorage:', error);
              // Continue without localStorage if quota exceeded
            }
          }
        } else {
          console.warn('Invalid image URL format:', imageUrl);
        }
      },
      updateBannerImage: (imageUrl: string) => {
        // Only accept data URLs (base64) or valid HTTP/HTTPS URLs
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
          set({ bannerImage: imageUrl });
          // Only store in localStorage if it's not a large base64 image
          if (typeof window !== 'undefined') {
            try {
              // Check if it's a base64 image and if it's too large (>100KB)
              if (imageUrl.startsWith('data:') && imageUrl.length > 100000) {
                console.log('Banner image too large for localStorage, storing in memory only');
                // Don't store large base64 images in localStorage
              } else {
                localStorage.setItem('globalBannerImage', imageUrl);
              }
            } catch (error) {
              console.warn('Failed to store banner in localStorage:', error);
              // Continue without localStorage if quota exceeded
            }
          }
        } else {
          console.warn('Invalid image URL format:', imageUrl);
        }
      },
      clearProfile: () => {
        set({ profilePicture: null, bannerImage: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('globalProfilePicture');
          localStorage.removeItem('globalBannerImage');
        }
      },
      compressImage: async (file: File, maxSizeKB: number = 100): Promise<string> => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Calculate new dimensions to fit within maxSizeKB
            let { width, height } = img;
            const maxSizeBytes = maxSizeKB * 1024;
            
            // Start with a reasonable quality and reduce if needed
            let quality = 0.8;
            let dataURL = '';
            
            do {
              // Set canvas size
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress
              ctx?.drawImage(img, 0, 0, width, height);
              dataURL = canvas.toDataURL('image/jpeg', quality);
              
              // If still too large, reduce quality or size
              if (dataURL.length > maxSizeBytes) {
                if (quality > 0.1) {
                  quality -= 0.1;
                } else {
                  width *= 0.8;
                  height *= 0.8;
                  quality = 0.8;
                }
              }
            } while (dataURL.length > maxSizeBytes && quality > 0.05);
            
            resolve(dataURL);
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      },
    }),
    {
      name: 'global-profile-storage',
      partialize: (state) => {
        // Only persist small images or HTTP URLs, not large base64 data
        const shouldPersistProfile = state.profilePicture && 
          (!state.profilePicture.startsWith('data:') || state.profilePicture.length <= 100000);
        const shouldPersistBanner = state.bannerImage && 
          (!state.bannerImage.startsWith('data:') || state.bannerImage.length <= 100000);
        
        return {
          profilePicture: shouldPersistProfile ? state.profilePicture : null,
          bannerImage: shouldPersistBanner ? state.bannerImage : null,
        };
      },
    }
  )
);
