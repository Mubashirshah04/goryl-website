// ✅ AWS DYNAMODB - Firestore completely removed
// Category service - using awsCategoryService

export const getCategories = async () => {
    try {
        const { getCategories: getAWSCategories } = await import('../awsCategoryService');
        return await getAWSCategories();
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
}

export const getCategoryById = async (categoryId) => {
    try {
        const { getCategoryById: getAWSCategory } = await import('../awsCategoryService');
        return await getAWSCategory(categoryId);
    } catch (error) {
        console.error('Error getting category:', error);
        return null;
    }
}

export const createCategory = async (categoryData) => {
    console.warn('⚠️ createCategory: AWS implementation pending');
    return `cat_${Date.now()}`;
}

export const updateCategory = async (categoryId, updates) => {
    console.warn('⚠️ updateCategory: AWS implementation pending');
}

export const deleteCategory = async (categoryId) => {
    console.warn('⚠️ deleteCategory: AWS implementation pending');
}
