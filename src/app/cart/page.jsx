'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
export default function CartPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const { user } = useAuthStore();
    const { cart, loading: cartLoading, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCartStore();
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    // Initialize cart if user is logged in
    useEffect(() => {
        if (user && !cart) {
            useCartStore.getState().initializeCart(user.sub);
        }
    }, [user, cart]);
    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
        }
        else {
            await updateQuantity(productId, newQuantity);
        }
    };
    const handleRemoveItem = async (productId) => {
        await removeFromCart(productId);
    };
    const handleClearCart = async () => {
        const confirmed = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Clear Cart</h3>
                    <p class="text-gray-600 mb-6">Are you sure you want to clear your cart?</p>
                    <div class="flex space-x-3">
                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Clear</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            modal.querySelector('#confirm')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
        });
        
        if (confirmed) {
            await clearCart();
        }
    };
    const handleCheckout = () => {
        if (!user) {
            toast.error('Please login to checkout');
            router.push('/login');
            return;
        }
        if (!cart || cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        router.push('/checkout');
    };
    const calculateSubtotal = () => {
        if (!cart)
            return 0;
        return cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };
    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    };
    const calculateTax = () => {
        const subtotal = calculateSubtotal();
        return subtotal * 0.1; // 10% tax
    };
    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping() + calculateTax();
    };
    if (!user) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login to view your cart</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to access your shopping cart.</p>
          <Link href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Login
          </Link>
        </div>
      </div>);
    }
    if (cartLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>);
    }
    if (!cart || cart.items.length === 0) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-white">
              <ArrowLeft className="w-6 h-6"/>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">({cart.items.length} items)</span>
          </div>
          <button onClick={handleClearCart} className="text-red-600 hover:text-red-700 font-medium">
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cart Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {cart.items.map((item, index) => (<motion.div key={item.id} initial={isHydrated ? { opacity: 0, x: -20 } : undefined} animate={isHydrated ? { opacity: 1, x: 0 } : undefined} exit={{ opacity: 0, x: 20 }} transition={isHydrated ? { delay: index * 0.1 } : undefined} className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={item.product.image || '/placeholder-product.jpg'} alt={item.product.title} className="object-cover w-full h-full"/>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.productId}`} className="hover:opacity-80">
                            <h3 className="font-semibold text-gray-900 truncate">{item.product.title}</h3>
                          </Link>
                          <p className="text-gray-600 text-sm">Rs {item.product.price}</p>
                          <p className="text-gray-500 text-sm">
                            {item.product.stock > 0 ? `${item.product.stock} in stock` : 'Out of stock'}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} disabled={loading} className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50">
                            <Minus className="w-4 h-4"/>
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} disabled={loading || item.quantity >= item.product.stock} className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50">
                            <Plus className="w-4 h-4"/>
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">Rs {(item.product.price * item.quantity).toFixed(2)}</p>
                          <p className="text-gray-500 text-sm">Rs {item.product.price} each</p>
                        </div>

                        {/* Remove Button */}
                        <button onClick={() => handleRemoveItem(item.productId)} disabled={loading} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full disabled:opacity-50">
                          <Trash2 className="w-5 h-5"/>
                        </button>
                      </div>
                    </motion.div>))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{calculateShipping() === 0 ? 'Free' : `Rs ${calculateShipping().toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>Rs {calculateTax().toFixed(2)}</span>
                  </div>
                  
                  {calculateShipping() === 0 && (<div className="flex items-center space-x-2 text-green-600 text-sm">
                      <Truck className="w-4 h-4"/>
                      <span>Free shipping on orders over Rs 50</span>
                    </div>)}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>Rs {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCheckout} disabled={loading || cart.items.length === 0} className="w-full bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  <CreditCard className="w-5 h-5"/>
                  <span>Proceed to Checkout</span>
                </motion.button>

                {/* Continue Shopping */}
                <Link href="/" className="block w-full text-center text-gray-600 hover:text-gray-900 font-medium py-3">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}

