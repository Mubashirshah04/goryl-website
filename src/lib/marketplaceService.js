// ✅ AWS DYNAMODB - Firestore completely removed
// Marketplace service .js - AWS stubs

export const getMarketplaceProducts = async () => {
    try {
        const { getProducts } = await import('./hybridProductService');
        return await getProducts({ status: 'active' }, 'createdAt', 'desc', 50);
    } catch (error) {
        return [];
    }
}

export const searchMarketplace = async (searchTerm) => {
    console.warn('⚠️ searchMarketplace: AWS implementation pending');
    return [];
}

export const getMarketplaceCategories = async () => {
    try {
        const { getCategories } = await import('./awsCategoryService');
        return await getCategories();
    } catch (error) {
        return [];
    }
}
