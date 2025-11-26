import { create } from 'zustand';
// ✅ AWS DYNAMODB - Firestore completely removed
// Saved products stored in user profile in DynamoDB

interface SavedProduct {
  id: string;
  productId: string;
  userId: string;
  savedAt: Date;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    sellerName: string;
    sellerId: string;
  };
}

interface SavedProductsStore {
  savedProducts: SavedProduct[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSavedProducts: (userId: string) => Promise<void>;
  saveProduct: (userId: string, productId: string) => Promise<void>;
  unsaveProduct: (userId: string, productId: string) => Promise<void>;
  isProductSaved: (productId: string) => boolean;
  subscribeToSavedProducts: (userId: string) => () => void;
}

export const useSavedProductsStore = create<SavedProductsStore>((set, get) => ({
  savedProducts: [],
  loading: false,
  error: null,

  fetchSavedProducts: async (userId: string) => {
    console.log('🔄 fetchSavedProducts called for userId:', userId);
    set({ loading: true, error: null });
    try {
      // ✅ AWS DynamoDB - Get saved products from user profile
      console.log('🔍 Fetching saved products from AWS DynamoDB');

      const { getUserProfile } = await import('@/lib/awsUserService');
      const userProfile = await getUserProfile(userId);

      if (userProfile && userProfile.savedProducts) {
        const savedProducts = userProfile.savedProducts.map((item: any) => ({
          ...item,
          savedAt: item.savedAt ? new Date(item.savedAt) : new Date()
        }));

        console.log('💾 Loaded saved products from AWS:', savedProducts.length);
        set({ savedProducts, loading: false });
      } else {
        console.log('💾 No saved products found');
        set({ savedProducts: [], loading: false });
      }
    } catch (error) {
      console.error('❌ Error fetching saved products from AWS:', error);
      set({ error: 'Failed to fetch saved products', loading: false });
    }
  },

  saveProduct: async (userId: string, productId: string) => {
    try {
      console.log('➕ Saving product to AWS DynamoDB');

      // ✅ AWS DynamoDB - Add to user profile's savedProducts array
      const { updateUserProfile } = await import('@/lib/awsUserService');
      const { getUserProfile } = await import('@/lib/awsUserService');

      const userProfile = await getUserProfile(userId);
      const currentSaved = userProfile?.savedProducts || [];

      // Check if already saved
      if (currentSaved.some((item: any) => item.productId === productId)) {
        console.log('ℹ️ Product already saved');
        return;
      }

      const newSaved = [
        ...currentSaved,
        {
          productId,
          savedAt: new Date().toISOString()
        }
      ];

      await updateUserProfile(userId, { savedProducts: newSaved });

      // Update local state
      await get().fetchSavedProducts(userId);
      console.log('✅ Product saved successfully');
    } catch (error) {
      console.error('❌ Error saving product to AWS:', error);
      throw error;
    }
  },

  unsaveProduct: async (userId: string, productId: string) => {
    try {
      console.log('➖ Unsaving product from AWS DynamoDB');

      // ✅ AWS DynamoDB - Remove from user profile's savedProducts array
      const { updateUserProfile } = await import('@/lib/awsUserService');
      const { getUserProfile } = await import('@/lib/awsUserService');

      const userProfile = await getUserProfile(userId);
      const currentSaved = userProfile?.savedProducts || [];

      const newSaved = currentSaved.filter((item: any) => item.productId !== productId);

      await updateUserProfile(userId, { savedProducts: newSaved });

      // Update local state
      await get().fetchSavedProducts(userId);
      console.log('✅ Product unsaved successfully');
    } catch (error) {
      console.error('❌ Error unsaving product from AWS:', error);
      throw error;
    }
  },

  isProductSaved: (productId: string) => {
    const { savedProducts } = get();
    return savedProducts.some(item => item.productId === productId);
  },

  subscribeToSavedProducts: (userId: string) => {
    // ✅ AWS DynamoDB doesn't support realtime listeners
    // Using polling approach instead
    console.log('🔄 Setting up polling for saved products (AWS DynamoDB)');

    // Initial fetch
    get().fetchSavedProducts(userId);

    // Poll every 20 seconds for updates
    const intervalId = setInterval(() => {
      get().fetchSavedProducts(userId);
    }, 20000);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log('🛑 Stopped polling for saved products');
    };
  }
}));
