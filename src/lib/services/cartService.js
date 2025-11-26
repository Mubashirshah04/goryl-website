// ✅ AWS DYNAMODB - Firestore completely removed
// Cart service .js - LocalStorage

const CART_STORAGE_KEY = 'goryl_cart_';

export const getUserCart = async (userId) => {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY + userId);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        return null;
    }
}

export const addToCart = async (userId, product, quantity = 1) => {
    const cart = await getUserCart(userId) || {
        id: userId,
        userId,
        items: [],
        itemCount: 0,
        subtotal: 0
    };

    const existingIndex = cart.items.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
    } else {
        cart.items.push({
            id: `${Date.now()}`,
            productId: product.id,
            product: {
                id: product.id,
                title: product.title,
                image: product.images?.[0] || '',
                price: product.price
            },
            quantity
        });
    }

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const removeFromCart = async (userId, productId) => {
    const cart = await getUserCart(userId);
    if (!cart) return;

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify(cart));
}

export const clearCart = async (userId) => {
    localStorage.setItem(CART_STORAGE_KEY + userId, JSON.stringify({
        id: userId,
        userId,
        items: [],
        itemCount: 0,
        subtotal: 0
    }));
}
