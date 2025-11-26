'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStoreCognito';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export default function CartDropdown() {
    var _a, _b, _c;
    const [isOpen, setIsOpen] = useState(false);
    const { cart, getCartItemCount, getCartTotal, updateQuantity, removeFromCart, loading, initializeCart } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const dropdownRef = useRef(null);
    // Initialize cart when component mounts and user is available
    useEffect(() => {
        if ((user === null || user === void 0 ? void 0 : user.sub) && !cart) {
            initializeCart(user.sub);
        }
    }, [user === null || user === void 0 ? void 0 : user.sub, cart, initializeCart]);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleCheckout = () => {
        setIsOpen(false);
        router.push('/cart');
    };
    const formatPrice = (price) => {
        return `$${price.toFixed(2)}`;
    };
    return (<div className="relative" ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6"/>
        {(((_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0 && (<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {((_b = cart === null || cart === void 0 ? void 0 : cart.items) === null || _b === void 0 ? void 0 : _b.length) || 0}
          </motion.span>)}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Shopping Cart ({((_c = cart === null || cart === void 0 ? void 0 : cart.items) === null || _c === void 0 ? void 0 : _c.length) || 0})
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Cart Items */}
            <div className="max-h-64 overflow-y-auto">
              {loading && !cart ? (<div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading cart...</p>
                </div>) : !user ? (<div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Please login to view cart</p>
                  <button onClick={() => {
                    setIsOpen(false);
                    router.push('/login');
                }} className="text-purple-600 hover:text-purple-700 font-medium">
                    Login
                  </button>
                </div>) : !cart || cart.items.length === 0 ? (<div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty</p>
                  <button onClick={() => {
                    setIsOpen(false);
                    router.push('/explore');
                }} className="text-purple-600 hover:text-purple-700 font-medium">
                    Start Shopping
                  </button>
                </div>) : (<div className="p-2">
                  {cart.items.map((item) => {
                    var _a, _b, _c;
                    return (<motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Product Image */}
                      {((_a = item.product) === null || _a === void 0 ? void 0 : _a.image) && (<img src={item.product.image} alt={item.product.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0"/>)}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {((_b = item.product) === null || _b === void 0 ? void 0 : _b.title) || 'Product'}
                        </h4>
                        <p className="text-purple-600 font-semibold text-sm">
                          {formatPrice(((_c = item.product) === null || _c === void 0 ? void 0 : _c.price) || 0)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                          <Minus className="w-3 h-3"/>
                        </button>
                        
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                          <Plus className="w-3 h-3"/>
                        </button>

                        <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-2">
                          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400"/>
                        </button>
                      </div>
                    </motion.div>);
                })}
                </div>)}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (<div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link href="/cart" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center">
                    View Cart
                  </Link>
                  
                  <button onClick={handleCheckout} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2">
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>)}
          </motion.div>)}
      </AnimatePresence>
    </div>);
}

