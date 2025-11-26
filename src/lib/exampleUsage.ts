// Example usage of the marketplace services in React components

import { useEffect, useState } from 'react';
import { 
  marketplaceService,
  getCurrentUser,
  isSeller
} from './index';
import { Product, Reel, Cart, Order } from './types';
import { Story } from './storiesService';

// Example: User applying for seller account
export const useSellerApplication = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToMyApplications(setApplications);
    setLoading(false);
    return unsubscribe;
  }, []);

  const submitApplication = async (applicationData: any) => {
    try {
      const applicationId = await marketplaceService.submitSellerApplication(applicationData);
      console.log('Application submitted with ID:', applicationId);
      return applicationId;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  };

  return { applications, loading, submitApplication };
};

// Example: Admin managing applications
export const useAdminApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToPendingApplications(setApplications);
    setLoading(false);
    return unsubscribe;
  }, []);

  const approveApplication = async (applicationId: string, adminNotes?: string) => {
    try {
      await marketplaceService.approveApplication(applicationId, adminNotes);
      console.log('Application approved');
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  };

  const rejectApplication = async (applicationId: string, rejectionReason: string, adminNotes?: string) => {
    try {
      await marketplaceService.rejectApplication(applicationId, rejectionReason, adminNotes);
      console.log('Application rejected');
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  };

  return { applications, loading, approveApplication, rejectApplication };
};

// Example: Seller creating a product
export const useProductCreation = () => {
  const createProduct = async (productData: Omit<Product, 'id' | 'sellerId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const productId = await marketplaceService.createProduct(productData);
      console.log('Product created with ID:', productId);
      return productId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const uploadProductImage = async (file: File, productId: string) => {
    try {
      const imageUrl = await marketplaceService.uploadProductImage(file, productId);
      console.log('Product image uploaded:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  };

  return { createProduct, uploadProductImage };
};

// Example: User managing cart
export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToCart(setCart);
    setLoading(false);
    return unsubscribe;
  }, []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      await marketplaceService.addToCart(productId, quantity);
      console.log('Product added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await marketplaceService.removeFromCart(productId);
      console.log('Product removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await marketplaceService.clearCart();
      console.log('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  return { cart, loading, addToCart, removeFromCart, clearCart };
};

// Example: User creating orders
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToUserOrders(setOrders);
    setLoading(false);
    return unsubscribe;
  }, []);

  const createOrder = async (shippingAddress: any, paymentMethod: 'cod' | 'online' | 'bank_transfer' = 'cod') => {
    try {
      const orderId = await marketplaceService.createOrder(shippingAddress, paymentMethod);
      console.log('Order created with ID:', orderId);
      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  return { orders, loading, createOrder };
};

// Example: User interacting with reels
export const useReels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToReels(setReels);
    setLoading(false);
    return unsubscribe;
  }, []);

  const createReel = async (reelData: Omit<Reel, 'id' | 'userId' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'viewsCount' | 'likedBy' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const reelId = await marketplaceService.createReel(reelData);
      console.log('Reel created with ID:', reelId);
      return reelId;
    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  };

  const likeReel = async (reelId: string) => {
    try {
      await marketplaceService.likeReel(reelId);
      console.log('Reel liked');
    } catch (error) {
      console.error('Error liking reel:', error);
      throw error;
    }
  };

  const unlikeReel = async (reelId: string) => {
    try {
      await marketplaceService.unlikeReel(reelId);
      console.log('Reel unliked');
    } catch (error) {
      console.error('Error unliking reel:', error);
      throw error;
    }
  };

  const addReelComment = async (reelId: string, content: string) => {
    try {
      const commentId = await marketplaceService.addReelComment(reelId, content);
      console.log('Comment added with ID:', commentId);
      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  return { reels, loading, createReel, likeReel, unlikeReel, addReelComment };
};

// Example: User interacting with stories
export const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToStories(setStories);
    setLoading(false);
    return unsubscribe;
  }, []);

  const createStory = async (storyData: any) => {
    try {
      const storyId = await marketplaceService.createStory(storyData);
      console.log('Story created with ID:', storyId);
      return storyId;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  };

  return { stories, loading, createStory };
};

// Example: Real-time product feed
export const useProductFeed = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = marketplaceService.subscribeToProducts(setProducts);
    setLoading(false);
    return unsubscribe;
  }, []);

  return { products, loading };
};