import { create } from 'zustand';
// ✅ AWS DYNAMODB - Firestore completely removed
// Reviews will be stored in DynamoDB, accessed via API routes

export interface UserReview {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified?: boolean;
  productId?: string;
  sellerId?: string;
}

interface UserReviewsStore {
  reviews: UserReview[];
  loading: boolean;
  error: string | null;
  fetchUserReviews: (userId: string) => Promise<void>;
  fetchUserReviewsRealtime: (userId: string) => () => void;
  addReview: (reviewData: Omit<UserReview, 'id' | 'createdAt' | 'helpful'>) => Promise<void>;
  updateReview: (reviewId: string, updates: Partial<UserReview>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  markHelpful: (reviewId: string) => Promise<void>;
  clearReviews: () => void;
}

export const useUserReviewsStore = create<UserReviewsStore>((set, get) => ({
  reviews: [],
  loading: false,
  error: null,

  fetchUserReviews: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      // ✅ AWS DynamoDB via API route (to be created)
      console.log('🔍 Fetching reviews from AWS DynamoDB for user:', userId);

      // For now, return empty array until API route is created
      // TODO: Create /api/reviews?sellerId=${userId} endpoint
      console.warn('⚠️ Reviews API not yet implemented, returning empty array');
      set({ reviews: [], loading: false });

      /* When API is ready:
      const response = await fetch(`/api/reviews?sellerId=${userId}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      const reviews = data.success ? data.data : [];
      set({ reviews, loading: false });
      */
    } catch (error) {
      console.error('❌ Error fetching user reviews from AWS:', error);
      set({ loading: false, error: 'Failed to load reviews' });
    }
  },

  fetchUserReviewsRealtime: (userId: string) => {
    // ✅ AWS DynamoDB doesn't support realtime listeners
    // Using polling approach instead
    console.log('🔄 Setting up polling for reviews (AWS DynamoDB)');

    // Initial fetch
    get().fetchUserReviews(userId);

    // Poll every 15 seconds for updates
    const intervalId = setInterval(() => {
      get().fetchUserReviews(userId);
    }, 15000);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log('🛑 Stopped polling for reviews');
    };
  },

  addReview: async (reviewData: Omit<UserReview, 'id' | 'createdAt' | 'helpful'>) => {
    try {
      console.log('➕ Adding review to AWS DynamoDB');

      // TODO: Create /api/reviews POST endpoint
      console.warn('⚠️ Add review API not yet implemented');

      /* When API is ready:
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewData, helpful: 0 })
      });
      if (!response.ok) throw new Error('Failed to add review');
      const data = await response.json();
      const newReview = data.success ? data.data : null;
      if (newReview) {
        const currentReviews = get().reviews;
        set({ reviews: [newReview, ...currentReviews] });
      }
      */
    } catch (error) {
      console.error('❌ Error adding review to AWS:', error);
      set({ error: 'Failed to add review' });
    }
  },

  updateReview: async (reviewId: string, updates: Partial<UserReview>) => {
    try {
      console.log('📝 Updating review in AWS DynamoDB:', reviewId);

      // TODO: Create /api/reviews/[id] PATCH endpoint
      console.warn('⚠️ Update review API not yet implemented');

      /* When API is ready:
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update review');
      const currentReviews = get().reviews;
      const updatedReviews = currentReviews.map(review =>
        review.id === reviewId ? { ...review, ...updates } : review
      );
      set({ reviews: updatedReviews });
      */
    } catch (error) {
      console.error('❌ Error updating review in AWS:', error);
      set({ error: 'Failed to update review' });
    }
  },

  deleteReview: async (reviewId: string) => {
    try {
      console.log('🗑️ Deleting review from AWS DynamoDB:', reviewId);

      // TODO: Create /api/reviews/[id] DELETE endpoint
      console.warn('⚠️ Delete review API not yet implemented');

      /* When API is ready:
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete review');
      const currentReviews = get().reviews;
      const filteredReviews = currentReviews.filter(review => review.id !== reviewId);
      set({ reviews: filteredReviews });
      */
    } catch (error) {
      console.error('❌ Error deleting review from AWS:', error);
      set({ error: 'Failed to delete review' });
    }
  },

  markHelpful: async (reviewId: string) => {
    try {
      console.log('👍 Marking review helpful in AWS DynamoDB:', reviewId);

      // TODO: Create /api/reviews/[id]/helpful POST endpoint
      console.warn('⚠️ Mark helpful API not yet implemented');

      /* When API is ready:
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark review helpful');
      const currentReviews = get().reviews;
      const updatedReviews = currentReviews.map(review =>
        review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review
      );
      set({ reviews: updatedReviews });
      */
    } catch (error) {
      console.error('❌ Error marking review helpful in AWS:', error);
      set({ error: 'Failed to mark review helpful' });
    }
  },

  clearReviews: () => {
    set({ reviews: [], loading: false, error: null });
  },
}));
