import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { getPersonalizedRecommendations, getNewUserRecommendations, getCategoryRecommendations, getSimilarProducts, trackUserBehavior } from '@/lib/recommendationService';
export function useRecommendations(options = {}) {
    const { user } = useAuthStore();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { category, limit = 20, excludeViewed = true } = options;
    useEffect(() => {
        loadRecommendations();
    }, [user, category, limit]);
    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            let products = [];
            if (category) {
                // Get category-specific recommendations
                products = await getCategoryRecommendations(category, user === null || user === void 0 ? void 0 : user.sub, limit);
            }
            else if (user) {
                // Get personalized recommendations for logged-in user
                products = await getPersonalizedRecommendations(user.sub, limit);
            }
            else {
                // Get new user recommendations for anonymous users
                products = await getNewUserRecommendations(limit);
            }
            setRecommendations(products);
        }
        catch (err) {
            console.error('Error loading recommendations:', err);
            setError('Failed to load recommendations');
        }
        finally {
            setLoading(false);
        }
    };
    const trackProductView = async (product) => {
        if (user) {
            await trackUserBehavior(user.sub, product.id, 'view', product);
        }
    };
    const trackProductLike = async (product) => {
        if (user) {
            await trackUserBehavior(user.sub, product.id, 'like', product);
        }
    };
    const trackProductSave = async (product) => {
        if (user) {
            await trackUserBehavior(user.sub, product.id, 'save', product);
        }
    };
    const trackProductShare = async (product) => {
        if (user) {
            await trackUserBehavior(user.sub, product.id, 'share', product);
        }
    };
    const trackProductPurchase = async (product) => {
        if (user) {
            await trackUserBehavior(user.sub, product.id, 'purchase', product);
        }
    };
    const refreshRecommendations = () => {
        loadRecommendations();
    };
    return {
        recommendations,
        loading,
        error,
        trackProductView,
        trackProductLike,
        trackProductSave,
        trackProductShare,
        trackProductPurchase,
        refreshRecommendations
    };
}
// Hook for similar products
export function useSimilarProducts(productId, limit = 10) {
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadSimilarProducts();
    }, [productId, limit]);
    const loadSimilarProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const products = await getSimilarProducts(productId, limit);
            setSimilarProducts(products);
        }
        catch (err) {
            console.error('Error loading similar products:', err);
            setError('Failed to load similar products');
        }
        finally {
            setLoading(false);
        }
    };
    return {
        similarProducts,
        loading,
        error,
        refreshSimilarProducts: loadSimilarProducts
    };
}
// Hook for category recommendations
export function useCategoryRecommendations(category, limit = 20) {
    const { user } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadCategoryProducts();
    }, [category, limit, user]);
    const loadCategoryProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const categoryProducts = await getCategoryRecommendations(category, user === null || user === void 0 ? void 0 : user.sub, limit);
            setProducts(categoryProducts);
        }
        catch (err) {
            console.error('Error loading category products:', err);
            setError('Failed to load category products');
        }
        finally {
            setLoading(false);
        }
    };
    return {
        products,
        loading,
        error,
        refreshCategoryProducts: loadCategoryProducts
    };
}

