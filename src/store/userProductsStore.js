import { create } from 'zustand';
// ✅ AWS DYNAMODB - Firestore completely removed
// Using AWS API routes for all product operations

export const useUserProductsStore = create((set, get) => ({
    products: [],
    loading: false,
    error: null,

    fetchUserProducts: async (userId) => {
        if (!userId) {
            console.error('❌ No userId provided to fetchUserProducts');
            return;
        }

        set({ loading: true, error: null });

        try {
            // ✅ AWS DynamoDB via API route
            console.log('🔍 Fetching products from AWS DynamoDB for user:', userId);
            const response = await fetch(`/api/products?sellerId=${userId}&orderByField=createdAt&orderDirection=desc`);

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }

            const data = await response.json();
            const products = data.success ? (data.data || []) : [];

            // Convert date strings to Date objects
            const formattedProducts = products.map((p) => ({
                ...p,
                createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            }));

            console.log(`✅ Loaded ${formattedProducts.length} products from AWS`);
            set({ products: formattedProducts, loading: false });
        } catch (error) {
            console.error('❌ Error fetching user products from AWS:', error);
            set({ loading: false, error: 'Failed to load products' });
        }
    },

    fetchUserProductsRealtime: (userId) => {
        if (!userId) {
            console.error('❌ No userId provided to fetchUserProductsRealtime');
            return () => { };
        }

        // ✅ AWS DynamoDB doesn't support realtime listeners
        // Using polling approach instead
        console.log('🔄 Setting up polling for products (AWS DynamoDB)');

        // Initial fetch
        get().fetchUserProducts(userId);

        // Poll every 10 seconds for updates
        const intervalId = setInterval(() => {
            get().fetchUserProducts(userId);
        }, 10000);

        // Return cleanup function
        return () => {
            clearInterval(intervalId);
            console.log('🛑 Stopped polling for products');
        };
    },

    addProduct: async (productData) => {
        try {
            console.log('➕ Adding product to AWS DynamoDB');

            // ✅ AWS DynamoDB via API route
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productData,
                    likes: 0,
                    views: 0,
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to add product: ${response.statusText}`);
            }

            const data = await response.json();
            const newProduct = data.success ? data.data : null;

            if (newProduct) {
                const formattedProduct = {
                    ...newProduct,
                    createdAt: newProduct.createdAt ? new Date(newProduct.createdAt) : new Date(),
                    updatedAt: newProduct.updatedAt ? new Date(newProduct.updatedAt) : new Date(),
                };

                const currentProducts = get().products;
                set({ products: [formattedProduct, ...currentProducts] });
                console.log('✅ Product added successfully');
            }
        } catch (error) {
            console.error('❌ Error adding product to AWS:', error);
            set({ error: 'Failed to add product' });
            throw error;
        }
    },

    updateProduct: async (productId, updates) => {
        try {
            console.log('📝 Updating product in AWS DynamoDB:', productId);

            // ✅ AWS DynamoDB via API route
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`Failed to update product: ${response.statusText}`);
            }

            // Update local state optimistically
            const currentProducts = get().products;
            const updatedProducts = currentProducts.map(product =>
                product.id === productId ? { ...product, ...updates, updatedAt: new Date() } : product
            );
            set({ products: updatedProducts });
            console.log('✅ Product updated successfully');
        } catch (error) {
            console.error('❌ Error updating product in AWS:', error);
            set({ error: 'Failed to update product' });
            throw error;
        }
    },

    deleteProduct: async (productId) => {
        try {
            console.log('🗑️ Deleting product from AWS DynamoDB:', productId);

            // ✅ AWS DynamoDB via API route
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete product: ${response.statusText}`);
            }

            // Update local state
            const currentProducts = get().products;
            const filteredProducts = currentProducts.filter(product => product.id !== productId);
            set({ products: filteredProducts });
            console.log('✅ Product deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting product from AWS:', error);
            set({ error: 'Failed to delete product' });
            throw error;
        }
    },

    clearProducts: () => {
        set({ products: [], loading: false, error: null });
    },
}));
