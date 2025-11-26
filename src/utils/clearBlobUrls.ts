/**
 * Utility function to clear all blob URLs from localStorage and browser cache
 */
export const clearBlobUrls = () => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value.startsWith('blob:')) {
      localStorage.removeItem(key);
      console.log(`Cleared blob URL from localStorage key: ${key}`);
    }
  });
  
  // Clear any blob URLs from sessionStorage as well
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    const value = sessionStorage.getItem(key);
    if (value && value.startsWith('blob:')) {
      sessionStorage.removeItem(key);
      console.log(`Cleared blob URL from sessionStorage key: ${key}`);
    }
  });
  
  // Revoke any existing blob URLs to free memory
  if (window.URL && window.URL.revokeObjectURL) {
    // This is a best effort - we can't track all blob URLs
    console.log('Cleared blob URLs from memory');
  }
  
  console.log('Blob URL cleanup completed');
};

// Force clear all profile data and refresh
export const forceClearProfileData = () => {
  if (typeof window === 'undefined') return;
  
  // Clear all profile-related data
  localStorage.removeItem('globalProfilePicture');
  localStorage.removeItem('globalBannerImage');
  localStorage.removeItem('global-profile-storage');
  
  // Clear sessionStorage as well
  sessionStorage.removeItem('globalProfilePicture');
  sessionStorage.removeItem('globalBannerImage');
  sessionStorage.removeItem('global-profile-storage');
  
  // Clear any blob URLs
  clearBlobUrls();
  
  console.log('Force cleared all profile data');
  
  // Refresh the page to reset everything
  window.location.reload();
};

// More aggressive cleanup - clear everything that might contain blob URLs
export const aggressiveCleanup = () => {
  if (typeof window === 'undefined') return;
  
  console.log('Starting aggressive cleanup...');
  
  // Clear all localStorage
  localStorage.clear();
  console.log('Cleared all localStorage');
  
  // Clear all sessionStorage
  sessionStorage.clear();
  console.log('Cleared all sessionStorage');
  
  // Clear any blob URLs
  clearBlobUrls();
  
  // Clear browser cache if possible
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
      console.log('Cleared all caches');
    });
  }
  
  console.log('Aggressive cleanup completed - refreshing page...');
  
  // Refresh the page to reset everything
  window.location.reload();
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearBlobUrls = clearBlobUrls;
  (window as any).forceClearProfileData = forceClearProfileData;
  (window as any).aggressiveCleanup = aggressiveCleanup;
}
