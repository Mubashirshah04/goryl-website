// ✅ AWS DYNAMODB - Firestore completely removed
// Category service .ts - using awsCategoryService

export const getCategories = async () => {
  try {
    const { getCategories: getAWSCategories } = await import('./awsCategoryService');
    return await getAWSCategories();
  } catch (error) {
    return [];
  }
}

export const getCategoryById = async (categoryId: string) => {
  try {
    const { getCategoryById: getAWSCategory } = await import('./awsCategoryService');
    return await getAWSCategory(categoryId);
  } catch (error) {
    return null;
  }
}

export const createCategory = async (categoryData: any) => {
  console.warn('⚠️ createCategory: AWS implementation pending');
  return `cat_${Date.now()}`;
}
