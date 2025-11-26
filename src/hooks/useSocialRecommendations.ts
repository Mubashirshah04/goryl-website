import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { trackUserInteraction, getTrendingProducts, getPersonalizedRecommendations } from '@/lib/algorithm/simpleAlgorithm';
import { Product } from '@/lib/types';

interface UseSocialRecommendationsProps {
  limit?: number;
  enableRealTime?: boolean;
}

interface UseSocialRecommendationsReturn {
  recommendations: Product[];
  trending: Product[];
  loading: boolean;
  error: string | null;
  trackInteraction: (productId: string, type: 'view' | 'like' | 'share' | 'save' | 'purchase' | 'comment') => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}

export const useSocialRecommendations = ({
  limit = 10, // Reduced default limit
  enableRealTime = false // Disabled real-time updates by default
}: UseSocialRecommendationsProps = {}): UseSocialRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuthStore();

  // Load recommendations with optimizations
  const loadRecommendations = useCallback(async () => {
    // Don't load recommendations while authentication is still loading
    if (authLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get trending products with limit
      const trendingProducts = await getTrendingProducts(5); // Reduced to 5 trending products
      setTrending(trendingProducts);

      // Get personalized recommendations with limit
      if (user) {
        const personalizedRecs = await getPersonalizedRecommendations(user.sub, Math.min(limit, 10)); // Cap at 10
        setRecommendations(personalizedRecs);
      } else {
        setRecommendations(trendingProducts.slice(0, Math.min(limit, 5))); // Cap at 5 for non-logged in users
      }

    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
      // Set empty arrays to prevent infinite loading
      setRecommendations([]);
      setTrending([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit, authLoading]);

  // Track user interaction with optimizations
  const trackInteraction = useCallback(async (
    productId: string, 
    type: 'view' | 'like' | 'share' | 'save' | 'purchase' | 'comment'
  ) => {
    if (!user) return;

    try {
      await trackUserInteraction(user.sub, productId, type);

      // Refresh recommendations after interaction only if enabled
      if (enableRealTime) {
        setTimeout(() => {
          loadRecommendations();
        }, 2000); // Increased delay to 2 seconds
      }
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  }, [user, enableRealTime, loadRecommendations]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    await loadRecommendations();
  }, [loadRecommendations]);

  // Load recommendations on mount and user change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRecommendations();
    }, 100); // Small delay to prevent immediate loading

    return () => clearTimeout(timeoutId);
  }, [loadRecommendations]);

  return {
    recommendations,
    trending,
    loading: loading || authLoading,
    error,
    trackInteraction,
    refreshRecommendations
  };
};

