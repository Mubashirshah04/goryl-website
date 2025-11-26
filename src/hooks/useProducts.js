// ✅ AWS DYNAMODB - Firestore completely removed
// useProducts hook .js - AWS stubs (using hybridProductService)

import { useState, useEffect } from 'react';

export const useProducts = (filters = {}, orderByField = 'createdAt', orderDirection = 'desc', limitCount = 20) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const { getProducts } = await import('@/lib/hybridProductService');
                const data = await getProducts(filters, orderByField, orderDirection, limitCount);
                setProducts(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to fetch products');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [JSON.stringify(filters), orderByField, orderDirection, limitCount]);

    return { products, loading, error };
};
