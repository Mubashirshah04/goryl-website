// ✅ AWS DYNAMODB - Firestore completely removed
// useUserBrands hook .js - AWS stubs

import { useState, useEffect } from 'react';

export const useUserBrands = (userId) => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchBrands = async () => {
            try {
                console.warn('⚠️ useUserBrands (.js): AWS implementation pending');
                setBrands([]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching brands:', error);
                setLoading(false);
            }
        };

        fetchBrands();
    }, [userId]);

    return { brands, loading };
};
