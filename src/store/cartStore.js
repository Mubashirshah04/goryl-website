import { create } from 'zustand';
import { getUserCart, subscribeToCart, addToCart as addToCartService, removeFromCart as removeFromCartService, updateCartItemQuantity as updateCartItemQuantityService, clearCart as clearCartService } from '@/lib/cartService';
// import { useAuthStore } from '@/store/authStoreCognito'; // DISABLED - Using localStorage session

// Helper to get user from localStorage session
const getUserFromSession = () => {
    if (typeof window === 'undefined') return null;
    try {
        const session = localStorage.getItem('session');
        if (session) {
            const parsed = JSON.parse(session);
            return parsed.user;
        }
    } catch (error) {
        console.error('Error reading session:', error);
    }
    return null;
};
export const useCartStore = create((set, get) => ({
    cart: null,
    loading: false,
    error: null,
    setCart: (cart) => set({ cart }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    initializeCart: async (userId) => {
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
            window.cartUnsubscribe = unsubscribe;
        }
        catch (error) {
            console.error('Error initializing cart:', error);
            set({
                error: 'Failed to load cart',
                loading: false
            });
        }
    },
    addToCart: async (product, quantity = 1) => {
        const user = getUserFromSession();
        console.log('Cart store - addToCart called:', { product, quantity, user: !!user });
        if (!user) {
            console.log('Cart store - No user found');
            set({ error: 'Please login to add items to cart' });
            return;
        }
        set({ loading: true, error: null });
        try {
            console.log('Cart store - Calling addToCartService with:', { userId: user.id, product, quantity });
            await addToCartService(user.id, product, quantity);
            console.log('Cart store - Successfully added to cart');
            set({ loading: false });
        }
        catch (error) {
            console.error('Cart store - Error adding to cart:', error);
            set({
                error: 'Failed to add item to cart',
                loading: false
            });
        }
    },
    removeFromCart: async (productId) => {
        const user = getUserFromSession();
        if (!user) {
            set({ error: 'Please login to remove items from cart' });
            return;
        }
        set({ loading: true, error: null });
        try {
            await removeFromCartService(user.id, productId);
            set({ loading: false });
        }
        catch (error) {
            console.error('Error removing from cart:', error);
            set({
                error: 'Failed to remove item from cart',
                loading: false
            });
        }
    },
    updateQuantity: async (productId, quantity) => {
        const user = getUserFromSession();
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
            await updateCartItemQuantityService(user.id, productId, quantity);
            set({ loading: false });
        }
        catch (error) {
            console.error('Error updating cart quantity:', error);
            set({
                error: 'Failed to update quantity',
                loading: false
            });
        }
    },
    clearCart: async () => {
        const user = getUserFromSession();
        if (!user) {
            set({ error: 'Please login to clear cart' });
            return;
        }
        set({ loading: true, error: null });
        try {
            await clearCartService(user.id);
            set({ loading: false });
        }
        catch (error) {
            console.error('Error clearing cart:', error);
            set({
                error: 'Failed to clear cart',
                loading: false
            });
        }
    },
    getCartItemCount: () => {
        var _a;
        const { cart } = get();
        return ((_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length) || 0;
    },
    getCartTotal: () => {
        const { cart } = get();
        return (cart === null || cart === void 0 ? void 0 : cart.subtotal) || 0;
    },
}));
// Cleanup function for cart subscription
export const cleanupCartSubscription = () => {
    if (window.cartUnsubscribe) {
        window.cartUnsubscribe();
        window.cartUnsubscribe = null;
    }
};

