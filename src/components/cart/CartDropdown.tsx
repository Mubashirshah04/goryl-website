'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useSession } from '@/hooks/useCustomSession';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { cart, getCartItemCount, getCartTotal, updateQuantity, removeFromCart, loading, initializeCart } = useCartStore();
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check mobile on mount and resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Initialize cart when component mounts and user is available
  useEffect(() => {
    if (user?.id) {
      // Clean up old cart data with placeholder images
      const storageKey = `goryl_cart_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const cartData = JSON.parse(stored);
          // Remove items with placeholder images
          if (cartData.items && Array.isArray(cartData.items)) {
            cartData.items = cartData.items.filter((item: any) => 
              item.product?.image && !item.product.image.includes('placeholder')
            );
            cartData.itemCount = cartData.items.length;
            cartData.subtotal = cartData.items.reduce((sum: number, item: any) => 
              sum + (item.quantity * item.product.price), 0
            );
            localStorage.setItem(storageKey, JSON.stringify(cartData));
          }
        } catch (e) {
          console.error('Error cleaning cart data:', e);
        }
      }
      
      if (!cart) {
        initializeCart(user.id);
      }
    }
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click is on the cart button itself
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/cart');
  };

  const formatPrice = (price: number) => {
    return `Rs ${price.toFixed(2)}`;
  };

  // Get button position for desktop dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Both mobile and desktop: Position directly below the cart icon button
      // On mobile, shift more to the right
      const rightOffset = isMobile ? 32 : 0;
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right - rightOffset,
        left: rect.left
      });
    }
  }, [isOpen, isMobile]);

  const dropdownContent = isOpen ? (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed w-56 sm:w-64 md:w-80 lg:w-96 bg-white dark:bg-gray-800 rounded-2xl border shadow-2xl border-gray-200 dark:border-gray-700 z-[100] max-h-96 overflow-hidden text-black dark:text-white"
      style={{
        top: `${buttonPosition.top}px`,
        right: `${buttonPosition.right}px`,
        left: 'auto'
      }}
      >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-base md:text-lg font-semibold text-black dark:text-white">
                Cart ({cart?.items?.length || 0})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="max-h-[calc(85vh-200px)] md:max-h-64 overflow-y-auto">
              {loading && !cart ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-black/70 dark:text-gray-400 mt-2">Loading cart...</p>
                </div>
              ) : !user ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-black/70 dark:text-gray-400 mb-4">Please login to view cart</p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/login');
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Login
                  </button>
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-black/70 dark:text-gray-400 mb-4">Your cart is empty</p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/explore');
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="p-2 md:p-2">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-14 h-14 md:w-12 md:h-12 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-black dark:text-white text-sm md:text-sm truncate">
                          {item.product?.title || 'Product'}
                        </h4>
                        <p className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                          {formatPrice(item.product?.price || 0)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.productId, Math.max(0, item.quantity - 1));
                          }}
                          className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors touch-manipulation"
                        >
                          <Minus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                        </button>
                        
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const maxStock = item.product?.stock || 0;
                            if (item.quantity < maxStock) {
                              updateQuantity(item.productId, item.quantity + 1);
                            } else {
                              toast.error(`Only ${maxStock} in stock`);
                            }
                          }}
                          disabled={item.quantity >= (item.product?.stock || 0)}
                          className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.productId);
                          }}
                          className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-1 md:ml-2 touch-manipulation"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-3 md:h-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 space-y-3 bg-white dark:bg-gray-800 sticky bottom-0">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-base md:text-lg font-semibold text-black dark:text-white">
                    Total:
                  </span>
                  <span className="text-base md:text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-2 md:space-x-2 md:gap-0">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 md:py-2 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center text-sm md:text-base"
                  >
                    View Cart
                  </Link>
                  
                  <button
                    onClick={handleCheckout}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 md:py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
  ) : null;

  return (
    <div className="relative">
      {/* Cart Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
        {(cart?.items?.length || 0) > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {cart?.items?.length || 0}
          </motion.span>
        )}
      </button>

      {/* Dropdown - Always use portal to render above header */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && dropdownContent}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

