// ✅ AWS DYNAMODB - Firestore completely removed
// Cart service .js version - LocalStorage + AWS stubs

const CART_STORAGE_KEY = 'goryl_cart_';

export const getUserCart = async (userId) => {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY + userId);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Error getting cart:', error);
        return null;
    }
}

export const getOrCreateCart = async (userId) => {
    const existing = await getUserCart(userId);
    if (existing) return existing;

    const newCart = {
        id: userId,
        userId,
        items: [],
        itemCount: 0,
        subtotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(newCart));
    return newCart;
}

export const addToCart = async (userId, product, quantity = 1) => {
    const cart = await getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
    } else {
        cart.items.push({
            id: `${Date.now()}-${Math.random()}`,
            userId,
            productId: product.id,
            sellerId: product.sellerId || '',
            sellerName: product.sellerName || 'Unknown',
            product: {
                id: product.id,
                title: product.title,
                image: product.images?.[0] || '/placeholder.jpg',
                price: product.price,
                stock: product.stock || 0,
                sellerId: product.sellerId || '',
                sellerName: product.sellerName || 'Unknown'
            },
            quantity,
            addedAt: new Date()
        });
    }

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const updateCartItemQuantity = async (userId, productId, quantity) => {
    const cart = await getUserCart(userId);
    if (!cart) return;

    cart.items = cart.items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
    );

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const removeFromCart = async (userId, productId) => {
    const cart = await getUserCart(userId);
    if (!cart) return;

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    cart.updatedAt = new Date();

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const clearCart = async (userId) => {
    const cart = {
        id: userId,
        userId,
        items: [],
        itemCount: 0,
        subtotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const subscribeToCart = (userId, callback) => {
    const intervalId = setInterval(async () => {
        const cart = await getUserCart(userId);
        callback(cart);
    }, 2000);

    getUserCart(userId).then(callback);

    return () => clearInterval(intervalId);
}

export const getCartItemCount = async (userId) => {
    const cart = await getUserCart(userId);
    return cart?.itemCount || 0;
}
