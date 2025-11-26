// ✅ AWS DYNAMODB - Firestore completely removed
// Product service .ts - using hybridProductService

export const getProducts = async (filters: any, orderByField?: string, orderDirection?: string, limit?: number) => {
  try {
    const { getProducts: getAWSProducts } = await import('../hybridProductService');
    const od: 'asc' | 'desc' | undefined = orderDirection === 'asc' || orderDirection === 'desc' ? orderDirection : undefined;
    return await getAWSProducts(filters, orderByField, od, limit);
  } catch (error) {
    return [];
  }
}

export const getProductById = async (productId: string) => {
  try {
    const { getProductById: getAWSProduct } = await import('../hybridProductService');
    return await getAWSProduct(productId);
  } catch (error) {
    return null;
  }
}

export const createProduct = async (productData: any) => {
  try {
    const { createProduct: createAWSProduct } = await import('../hybridProductService');
    return await createAWSProduct(productData);
  } catch (error) {
    throw error;
  }
}

export const updateProduct = async (productId: string, updates: any) => {
  try {
    const { updateProduct: updateAWSProduct } = await import('../hybridProductService');
    return await updateAWSProduct(productId, updates);
  } catch (error) {
    throw error;
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    const { deleteProduct: deleteAWSProduct } = await import('../hybridProductService');
    return await deleteAWSProduct(productId);
  } catch (error) {
    throw error;
  }
}
