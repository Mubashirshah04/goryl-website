/**
 * Wishlist Service - Uses AWS DynamoDB
 * NO FIREBASE - Pure AWS
 */


// AWS DynamoDB imports - Use static import to avoid webpack issues
import * as awsWishlistServiceModule from './awsWishlistService';

let wishlistServiceCache = null;

async function getWishlistService() {
  // Return cached service if available
  if (wishlistServiceCache) {
    return wishlistServiceCache;
  }

  try {
    // Use static import instead of dynamic to avoid webpack issues
    const serviceModule = awsWishlistServiceModule;
    
    // Handle both default export and named exports
    let service = null;
    
    if (serviceModule && serviceModule.default) {
      service = serviceModule.default;
    } else if (serviceModule && typeof serviceModule === 'object') {
      // Check if it has the required functions directly
      if (serviceModule.addToWishlist || serviceModule.getUserWishlist) {
        service = serviceModule;
      }
    }
    
    if (service && typeof service === 'object') {
      // Validate service has required methods
      const requiredMethods = ['addToWishlist', 'removeFromWishlist', 'getUserWishlist', 'isInWishlist', 'getWishlistCount'];
      const hasMethods = requiredMethods.some(method => typeof service[method] === 'function');
      
      if (hasMethods) {
        wishlistServiceCache = service;
    return service;
      }
    }
    
    // If we get here, the module structure is unexpected
    console.warn('⚠️ awsWishlistService module structure unexpected');
    throw new Error('Unexpected module structure');
  } catch (error) {
    console.error('❌ Error loading awsWishlistService:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack?.substring(0, 200), // Limit stack trace
      name: error?.name
    });
    
    // Return a mock service that gracefully handles errors
    const fallbackService = {
      addToWishlist: async () => { 
        console.warn('⚠️ Wishlist service not available - addToWishlist failed');
        throw new Error('Wishlist service not available. Please check AWS credentials.'); 
      },
      removeFromWishlist: async () => { 
        console.warn('⚠️ Wishlist service not available - removeFromWishlist failed');
        throw new Error('Wishlist service not available. Please check AWS credentials.'); 
      },
      getUserWishlist: async () => { 
        console.warn('⚠️ Wishlist service not available - returning empty wishlist');
        return []; 
      },
      isInWishlist: async () => { 
        return false; 
      },
      getWishlistCount: async () => { 
        return 0; 
      },
    };
    
    // Cache fallback to avoid repeated errors
    wishlistServiceCache = fallbackService;
    return fallbackService;
  }
}

// Helper function to get a function from service (handles both default and named exports)
function getServiceFunction(service, functionName) {
  return service[functionName] || (service.default && service.default[functionName]);
}
// Add product to wishlist - Uses AWS DynamoDB
export const addToWishlist = async (userId, product) => {
    try {
        // Validate userId
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('Adding product to wishlist for user:', userId);
        
        // Use AWS DynamoDB wishlist service
        const service = await getWishlistService();
        const addFunc = getServiceFunction(service, 'addToWishlist');
        if (!addFunc) {
          throw new Error('addToWishlist function not available');
        }
        await addFunc(userId, product.id, product);
        
        console.log('Successfully added product to wishlist for user:', userId);
    }
    catch (error) {
        console.error('Error adding to wishlist:', error);
        throw new Error(error.message || 'Failed to add item to wishlist');
    }
};
// Remove product from wishlist - Uses AWS DynamoDB
export const removeFromWishlist = async (userId, productId) => {
    try {
        // Validate userId
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('Removing product from wishlist for user:', userId, 'product:', productId);
        
        // Use AWS DynamoDB wishlist service
        const service = await getWishlistService();
        const removeFunc = getServiceFunction(service, 'removeFromWishlist');
        if (!removeFunc) {
          throw new Error('removeFromWishlist function not available');
        }
        await removeFunc(userId, productId);
        
        console.log('Successfully removed product from wishlist for user:', userId);
    }
    catch (error) {
        console.error('Error removing from wishlist:', error);
        throw new Error(error.message || 'Failed to remove item from wishlist');
    }
};
// Get user's wishlist - Uses AWS DynamoDB
export const getUserWishlist = async (userId) => {
    try {
        // Validate userId
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('Attempting to fetch wishlist for user:', userId);
        
        // Use AWS DynamoDB wishlist service
        const service = await getWishlistService();
        const getUserWishlistFunc = getServiceFunction(service, 'getUserWishlist');
        if (!getUserWishlistFunc) {
          console.error('getUserWishlist function not found in wishlist service');
          return [];
        }
        const wishlist = await getUserWishlistFunc(userId);
        
        console.log('Successfully fetched wishlist for user:', userId);
        return wishlist || [];
    }
    catch (error) {
        console.error('Error getting user wishlist:', error);
        throw new Error(error.message || 'Failed to load wishlist');
    }
};
// Check if product is in wishlist - Uses AWS DynamoDB
export const isInWishlist = async (userId, productId) => {
    try {
        // Validate userId
        if (!userId) {
            return false;
        }
        
        // Use AWS DynamoDB wishlist service
        const service = await getWishlistService();
        const isInFunc = getServiceFunction(service, 'isInWishlist');
        if (!isInFunc) {
          return false;
        }
        return await isInFunc(userId, productId);
    }
    catch (error) {
        console.error('Error checking wishlist status:', error);
        return false;
    }
};
// Subscribe to wishlist changes - Uses AWS DynamoDB polling
export const subscribeToWishlist = (userId, callback) => {
    // Validate userId
    if (!userId) {
        console.error('User ID is required for wishlist subscription');
        callback([]);
        return () => { };
    }
    console.log('Subscribing to wishlist for user:', userId);
    
    // Poll for changes (DynamoDB doesn't have real-time listeners like Firestore)
    const fetchWishlist = async () => {
        try {
            const service = await getWishlistService();
            const getUserWishlistFunc = getServiceFunction(service, 'getUserWishlist');
            if (!getUserWishlistFunc) {
              callback([]);
              return;
            }
            const wishlist = await getUserWishlistFunc(userId);
            callback(wishlist || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            callback([]);
        }
    };
    
    // Fetch immediately
    fetchWishlist();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchWishlist, 5000);
    
    // Return cleanup function
    return () => {
        clearInterval(interval);
    };
};
// Get wishlist count - Uses AWS DynamoDB
export const getWishlistCount = async (userId) => {
    try {
        // Validate userId
        if (!userId) {
            return 0;
        }
        
        // Use AWS DynamoDB wishlist service
        const service = await getWishlistService();
        const countFunc = getServiceFunction(service, 'getWishlistCount');
        if (!countFunc) {
          return 0;
        }
        return await countFunc(userId);
    }
    catch (error) {
        console.error('Error getting wishlist count:', error);
        return 0;
    }
};


