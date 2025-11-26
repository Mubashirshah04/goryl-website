import { create } from 'zustand';
import { WishlistItem } from '@/lib/types';
import { 
  getUserWishlist, 
  subscribeToWishlist, 
  addToWishlist as addToWishlistService,
  removeFromWishlist as removeFromWishlistService,
  isInWishlist as isInWishlistService
} from '@/lib/wishlistService';
import { useAuthStore } from '@/store/authStoreCognito';

interface WishlistStore {
  wishlist: WishlistItem[];
  loading: boolean;
  error: string | null;
  setWishlist: (wishlist: WishlistItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeWishlist: (userId: string) => Promise<void>;
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

// Global tracker to prevent infinite loops
const wishlistFetchTracker = new Set<string>();

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlist: [],
  loading: false,
  error: null,
  
  setWishlist: (wishlist) => set({ wishlist }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  initializeWishlist: async (userId: string) => {
    // Validate userId
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }
    
    // CRITICAL: Prevent infinite loops - check if already initialized
    if (wishlistFetchTracker.has(userId)) {
      return;
    }
    
    // Mark as initialized
    wishlistFetchTracker.add(userId);
    console.log('Initializing wishlist for:', userId);
    
    set({ loading: true, error: null });
    
    try {
      // Get initial wishlist data
      const wishlist = await getUserWishlist(userId);
      set({ wishlist, loading: false });
      console.log('Wishlist initialized successfully for:', userId);
      
      // Subscribe to wishlist changes
      const unsubscribe = subscribeToWishlist(userId, (updatedWishlist) => {
        set({ wishlist: updatedWishlist });
      });
      
      // Store unsubscribe function for cleanup
      (window as any).wishlistUnsubscribe = unsubscribe;
      
    } catch (error: any) {
      console.error('Error initializing wishlist:', error);
      // Remove from tracker on error to allow retry
      wishlistFetchTracker.delete(userId);
      
      // Check if it's a permission error
      if (error?.code === 'permission-denied' || (error?.message && error.message.includes('Permission denied'))) {
        set({ 
          error: 'Permission denied. Please make sure you are logged in.', 
          loading: false,
          wishlist: [] // Reset wishlist on permission error
        });
      } else {
        set({ 
          error: error.message || 'Failed to load wishlist', 
          loading: false 
        });
      }
    }
  },
  
  addToWishlist: async (product: any) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      return;
    }
    
    if (!user.sub) {
      set({ error: 'User ID not available' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      await addToWishlistService(user.sub, product);
      set({ loading: false, error: null });
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      // Check if it's a permission error
      if (error?.code === 'permission-denied' || (error?.message && error.message.includes('Permission denied'))) {
        set({ 
          error: 'Permission denied. Please make sure you are logged in.', 
          loading: false 
        });
      } else {
        set({ 
          error: error.message || 'Failed to add item to wishlist', 
          loading: false 
        });
      }
    }
  },
  
  removeFromWishlist: async (productId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'Please login to remove items from wishlist' });
      return;
    }
    
    if (!user.sub) {
      set({ error: 'User ID not available' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      await removeFromWishlistService(user.sub, productId);
      set({ loading: false, error: null });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      // Check if it's a permission error
      if (error?.code === 'permission-denied' || (error?.message && error.message.includes('Permission denied'))) {
        set({ 
          error: 'Permission denied. Please make sure you are logged in.', 
          loading: false 
        });
      } else {
        set({ 
          error: error.message || 'Failed to remove item from wishlist', 
          loading: false 
        });
      }
    }
  },
  
  isInWishlist: (productId: string) => {
    const { wishlist } = get();
    return wishlist.some(item => item.productId === productId);
  },
  
  getWishlistCount: () => {
    const { wishlist } = get();
    return wishlist.length;
  },
}));

// Cleanup function for wishlist subscription
export const cleanupWishlistSubscription = () => {
  if ((window as any).wishlistUnsubscribe) {
    (window as any).wishlistUnsubscribe();
    (window as any).wishlistUnsubscribe = null;
  }
};
