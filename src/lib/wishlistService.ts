// ✅ AWS DYNAMODB - Firestore completely removed
// Wishlist service - AWS stubs

export const addToWishlist = async (userId: string, productId: string) => {
  console.warn('⚠️ addToWishlist: AWS implementation pending');
}

export const removeFromWishlist = async (userId: string, productId: string) => {
  console.warn('⚠️ removeFromWishlist: AWS implementation pending');
}

export const getWishlist = async (userId: string) => {
  console.warn('⚠️ getWishlist: AWS implementation pending');
  return [];
}

// Backwards-compatible aliases and stubs
export const getUserWishlist = getWishlist;

export const subscribeToWishlist = (userId: string, callback: (items: any[]) => void) => {
  // Polling stub: call callback once with empty list and return noop
  setTimeout(() => callback([]), 0);
  return () => {};
}

export const isInWishlist = async (userId: string, productId: string) => {
  console.warn('⚠️ isInWishlist: AWS implementation pending');
  return false;
}
