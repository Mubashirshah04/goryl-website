// ✅ AWS DYNAMODB - Firestore completely removed
// useSave hook .js - AWS stubs (using savedProductsStore)

import { useState, useEffect } from 'react';
import { useSavedProductsStore } from '@/store/savedProductsStore';

export const useSave = (productId, userId) => {
    const { savedProducts, addSavedProduct, removeSavedProduct } = useSavedProductsStore();
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (productId && userId) {
            setIsSaved(savedProducts.some(p => p.id === productId));
        }
    }, [productId, userId, savedProducts]);

    const toggleSave = async () => {
        if (!userId) {
            console.warn('User must be logged in to save products');
            return;
        }

        try {
            if (isSaved) {
                await removeSavedProduct(productId);
            } else {
                await addSavedProduct(productId);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        }
    };

    return { isSaved, toggleSave };
};
