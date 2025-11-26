import { create } from 'zustand';
// ✅ AWS DYNAMODB - Firestore completely removed
// Reviews will be stored in DynamoDB, accessed via API routes

export const useUserReviewsStore = create((set, get) => ({
    reviews: [],
    loading: false,
    error: null,

    fetchUserReviews: async (userId) => {
        set({ loading: true, error: null });

        try {
            // ✅ AWS DynamoDB via API route (to be created)
            console.log('🔍 Fetching reviews from AWS DynamoDB for user:', userId);

            // For now, return empty array until API route is created
            console.warn('⚠️ Reviews API not yet implemented, returning empty array');
            set({ reviews: [], loading: false });
        } catch (error) {
            console.error('❌ Error fetching user reviews from AWS:', error);
            set({ loading: false, error: 'Failed to load reviews' });
        }
    },

    fetchUserReviewsRealtime: (userId) => {
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

    addReview: async (reviewData) => {
        try {
            console.log('➕ Adding review to AWS DynamoDB');
            console.warn('⚠️ Add review API not yet implemented');
        } catch (error) {
            console.error('❌ Error adding review to AWS:', error);
            set({ error: 'Failed to add review' });
        }
    },

    updateReview: async (reviewId, updates) => {
        try {
            console.log('📝 Updating review in AWS DynamoDB:', reviewId);
            console.warn('⚠️ Update review API not yet implemented');
        } catch (error) {
            console.error('❌ Error updating review in AWS:', error);
            set({ error: 'Failed to update review' });
        }
    },

    deleteReview: async (reviewId) => {
        try {
            console.log('🗑️ Deleting review from AWS DynamoDB:', reviewId);
            console.warn('⚠️ Delete review API not yet implemented');
        } catch (error) {
            console.error('❌ Error deleting review from AWS:', error);
            set({ error: 'Failed to delete review' });
        }
    },

    markHelpful: async (reviewId) => {
        try {
            console.log('👍 Marking review helpful in AWS DynamoDB:', reviewId);
            console.warn('⚠️ Mark helpful API not yet implemented');
        } catch (error) {
            console.error('❌ Error marking review helpful in AWS:', error);
            set({ error: 'Failed to mark review helpful' });
        }
    },

    clearReviews: () => {
        set({ reviews: [], loading: false, error: null });
    },
}));
