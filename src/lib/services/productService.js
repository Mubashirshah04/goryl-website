// ✅ AWS DYNAMODB - Firestore completely removed
// Product service - using hybridProductService

export const getProducts = async (filters, orderByField, orderDirection, limit) => {
    try {
        const { getProducts: getAWSProducts } = await import('../hybridProductService');
        return await getAWSProducts(filters, orderByField, orderDirection, limit);
    } catch (error) {
        console.error('Error getting products:', error);
        return [];
    }
}

export const getProductById = async (productId) => {
    try {
        const { getProductById: getAWSProduct } = await import('../hybridProductService');
        return await getAWSProduct(productId);
    } catch (error) {
        console.error('Error getting product:', error);
        return null;
    }
}

export const createProduct = async (productData) => {
    try {
        const { createProduct: createAWSProduct } = await import('../hybridProductService');
        return await createAWSProduct(productData);
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

export const updateProduct = async (productId, updates) => {
    try {
        const { updateProduct: updateAWSProduct } = await import('../hybridProductService');
        return await updateAWSProduct(productId, updates);
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export const deleteProduct = async (productId) => {
    try {
        const { deleteProduct: deleteAWSProduct } = await import('../hybridProductService');
        return await deleteAWSProduct(productId);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}
