import { create } from 'zustand';
import { Cart, CartItem } from '@/lib/types';
import { 
  getUserCart, 
  subscribeToCart, 
  addToCart as addToCartService,
  removeFromCart as removeFromCartService,
  updateCartItemQuantity as updateCartItemQuantityService,
  clearCart as clearCartService
} from '@/lib/cartService';
import { useAuthStore } from '@/store/authStoreCognito';

interface CartStore {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  setCart: (cart: Cart | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeCart: (userId: string) => Promise<void>;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  loading: false,
  error: null,
  
  setCart: (cart) => set({ cart }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  initializeCart: async (userId: string) => {
    const { cart } = get();
    
    // Don't reinitialize if cart already exists
    if (cart) {
      console.log('Cart already initialized, skipping...');
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      // Set empty cart immediately for instant UI
      set({ 
        cart: { 
          id: `temp-${userId}`, 
          userId, 
          items: [], 
          itemCount: 0, 
          subtotal: 0, 
          updatedAt: new Date() 
        }, 
        loading: false 
      });
      
      // Get real cart data in background
      const realCart = await getUserCart(userId);
      if (realCart) {
        set({ cart: realCart });
      }
      
      // Subscribe to cart changes
      const unsubscribe = subscribeToCart(userId, (updatedCart) => {
        set({ cart: updatedCart });
      });
      
      // Store unsubscribe function for cleanup
      (window as any).cartUnsubscribe = unsubscribe;
      
    } catch (error) {
      console.error('Error initializing cart:', error);
      set({ 
        error: 'Failed to load cart', 
        loading: false 
      });
    }
  },
  
  addToCart: async (product: any, quantity: number = 1) => {
    const { user } = useAuthStore.getState();
    console.log('Cart store - addToCart called:', { product, quantity, user: !!user });
    
    if (!user) {
      console.log('Cart store - No user found');
      set({ error: 'Please login to add items to cart' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      console.log('Cart store - Calling addToCartService with:', { userId: user.sub, product, quantity });
      await addToCartService(user.sub, product, quantity);
      console.log('Cart store - Successfully added to cart');
      set({ loading: false });
    } catch (error) {
      console.error('Cart store - Error adding to cart:', error);
      set({ 
        error: 'Failed to add item to cart', 
        loading: false 
      });
    }
  },
  
  removeFromCart: async (productId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'Please login to remove items from cart' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      await removeFromCartService(user.sub, productId);
      set({ loading: false });
    } catch (error) {
      console.error('Error removing from cart:', error);
      set({ 
        error: 'Failed to remove item from cart', 
        loading: false 
      });
    }
  },
  
  updateQuantity: async (productId: string, quantity: number) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'Please login to update cart' });
      return;
    }
    
    if (quantity <= 0) {
      await get().removeFromCart(productId);
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      await updateCartItemQuantityService(user.sub, productId, quantity);
      set({ loading: false });
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      set({ 
        error: 'Failed to update quantity', 
        loading: false 
      });
    }
  },
  
  clearCart: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'Please login to clear cart' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      await clearCartService(user.sub);
      set({ loading: false });
    } catch (error) {
      console.error('Error clearing cart:', error);
      set({ 
        error: 'Failed to clear cart', 
        loading: false 
      });
    }
  },
  
  getCartItemCount: () => {
    const { cart } = get();
    return cart?.items?.length || 0;
  },
  
  getCartTotal: () => {
    const { cart } = get();
    return cart?.subtotal || 0;
  },
}));

// Cleanup function for cart subscription
export const cleanupCartSubscription = () => {
  if ((window as any).cartUnsubscribe) {
    (window as any).cartUnsubscribe();
    (window as any).cartUnsubscribe = null;
  }
};
