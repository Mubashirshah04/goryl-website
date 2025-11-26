// ✅ AWS DYNAMODB - Firestore completely removed
// Product service .ts - using hybridProductService

export type Product = import('./types').Product;

export const getProducts = async (filters: any, orderByField?: string, orderDirection?: 'asc' | 'desc' | string | undefined, limit?: number) => {
  try {
    const { getProducts: getAWSProducts } = await import('./hybridProductService');
    // Ensure orderDirection matches the narrower union expected by some implementations
    const od: 'asc' | 'desc' | undefined = orderDirection === 'asc' || orderDirection === 'desc' ? orderDirection : undefined;
    return await getAWSProducts(filters, orderByField, od, limit);
  } catch (error) {
    return [];
  }
}

// Subscribe wrapper: if the hybrid service exposes a realtime listener, use it.
// Otherwise provide a safe no-op unsubscribe function.
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  let unsub: (() => void) | undefined
  import('./hybridProductService')
    .then((mod) => {
      const m: any = mod;
      if (typeof m.subscribeToProducts === 'function') {
        unsub = m.subscribeToProducts(callback);
      }
    })
    .catch(() => {
      // ignore - provide a noop
    })

  return () => {
    try {
      if (typeof unsub === 'function') unsub()
    } catch (e) {}
  }
}

export const getProductById = async (productId: string) => {
  try {
    const { getProductById: getAWSProduct } = await import('./hybridProductService');
    return await getAWSProduct(productId);
  } catch (error) {
    return null;
  }
}

export const createProduct = async (productData: any) => {
  try {
    const { createProduct: createAWSProduct } = await import('./hybridProductService');
    return await createAWSProduct(productData);
  } catch (error) {
    throw error;
  }
}

export const updateProduct = async (productId: string, updates: any) => {
  try {
    const { updateProduct: updateAWSProduct } = await import('./hybridProductService');
    return await updateAWSProduct(productId, updates);
  } catch (error) {
    throw error;
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    const { deleteProduct: deleteAWSProduct } = await import('./hybridProductService');
    return await deleteAWSProduct(productId);
  } catch (error) {
    throw error;
  }
}
