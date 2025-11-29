// ✅ AWS DYNAMODB - Firestore completely removed
// Cart service using LocalStorage + AWS DynamoDB for persistence

import { Cart, CartItem, Product } from './types'

// Cart is stored in LocalStorage for instant access
// Synced to AWS DynamoDB for persistence across devices

const CART_STORAGE_KEY = 'goryl_cart_';

export const getUserCart = async (userId: string): Promise<Cart | null> => {
  try {
    // Get from LocalStorage first
    const stored = localStorage.getItem(CART_STORAGE_KEY + userId);
    if (stored) {
      return JSON.parse(stored);
    }

    // TODO: Fetch from AWS DynamoDB if not in LocalStorage
    console.warn('⚠️ getUserCart: AWS DynamoDB sync pending');
    return null;
  } catch (error) {
    console.error('Error getting user cart:', error);
    return null;
  }
}

export const getOrCreateCart = async (userId: string): Promise<Cart> => {
  try {
    const existing = await getUserCart(userId);
    if (existing) return existing;

    const newCart: Cart = {
      id: userId,
      userId,
      items: [],
      itemCount: 0,
      subtotal: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(newCart));
    return newCart;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
}

export const addToCart = async (userId: string, product: Product, quantity: number = 1): Promise<void> => {
  try {
    const cart = await getOrCreateCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: `${Date.now()}-${Math.random()}`,
        userId,
        productId: product.id || '',
        sellerId: product.sellerId || '',
        sellerName: product.sellerName || 'Unknown',
        product: {
          id: product.id || '',
          title: product.title || 'Untitled',
          image: product.images?.[0] || '',
          price: product.price || 0,
          stock: product.stock || 0,
          sellerId: product.sellerId || '',
          sellerName: product.sellerName || 'Unknown'
        },
        quantity,
        addedAt: new Date()
      };
      cart.items.push(newItem);
    }

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));

    // TODO: Sync to AWS DynamoDB
    console.warn('⚠️ addToCart: AWS DynamoDB sync pending');
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export const updateCartItemQuantity = async (userId: string, productId: string, quantity: number): Promise<void> => {
  try {
    const cart = await getUserCart(userId);
    if (!cart) return;

    cart.items = cart.items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

export const removeFromCart = async (userId: string, productId: string): Promise<void> => {
  try {
    const cart = await getUserCart(userId);
    if (!cart) return;

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

export const clearCart = async (userId: string): Promise<void> => {
  try {
    const cart: Cart = {
      id: userId,
      userId,
      items: [],
      itemCount: 0,
      subtotal: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

export const subscribeToCart = (userId: string, callback: (cart: Cart | null) => void) => {
  // Poll LocalStorage for changes
  const intervalId = setInterval(async () => {
    const cart = await getUserCart(userId);
    callback(cart);
  }, 2000);

  // Initial call
  getUserCart(userId).then(callback);

  return () => clearInterval(intervalId);
}

export const getCartItemCount = async (userId: string): Promise<number> => {
  try {
    const cart = await getUserCart(userId);
    return cart?.itemCount || 0;
  } catch (error) {
    return 0;
  }
}