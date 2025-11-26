'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Share2, Eye, Gamepad2 } from 'lucide-react';
import ultraFastLoader, { ContentType, LoadPriority } from '@/lib/ultraFastLoader';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
import { GamePromptModal } from '@/components/modals/GamePromptModal';
import { useRouter } from 'next/navigation';

// Product interface
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  rating?: number;
  likes?: string[];
  views?: number;
  comments?: number;
  status?: 'active' | 'inactive' | 'draft';
  discount?: number;
  verified?: boolean;
  [key: string]: any;
}

interface UltraFastProductCardProps {
  productId: string;
  initialData?: Partial<Product>;
  priority?: LoadPriority;
  prefetchRelated?: boolean;
  onProductLoaded?: (product: Product) => void;
  className?: string;
}

/**
 * UltraFastProductCard - A component that loads product data quickly with minimal caching
 *
 * Features:
 * - Detects when product enters viewport and loads at appropriate priority
 * - Skeleton loading state while data is loading
 * - Optimized image loading
 * - Minimal caching for instant interactions
 * - Similar to YouTube/TikTok card loading
 */
export default function UltraFastProductCard({
  productId,
  initialData,
  priority = LoadPriority.HIGH,
  prefetchRelated = true,
  onProductLoaded,
  className = '',
}: UltraFastProductCardProps) {
  // State
  const [product, setProduct] = useState<Product | null>(initialData as Product || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [gamePromptOpen, setGamePromptOpen] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Hooks
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  // Setup intersection observer to detect when product enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update viewport status
        setIsInViewport(entry.isIntersecting);

        // Mark item in viewport for the loader's priority system
        ultraFastLoader.markInViewport(productId, entry.isIntersecting);

        // If entering viewport and we don't have data yet, bump priority
        if (entry.isIntersecting && (!product || loading)) {
          loadProductData(LoadPriority.CRITICAL);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px', // Load before fully in viewport
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    // Cleanup
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [productId, product, loading]);

  // Load product data with appropriate priority
  const loadProductData = (loadPriority: LoadPriority = priority) => {
    // Already loading or have data? Skip unless forcing critical priority
    if ((loading || product) && loadPriority !== LoadPriority.CRITICAL) return;

    setLoading(true);
    setError(null);

    ultraFastLoader.loadProduct(
      productId,
      (data) => {
        setProduct(data);
        setLoading(false);

        // Call the callback if provided
        if (onProductLoaded) {
          onProductLoaded(data);
        }

        // Prefetch related products if enabled
        if (prefetchRelated && data.category) {
          ultraFastLoader.loadProductsList(
            { category: data.category, status: 'active' },
            'views',
            'desc',
            5,
            () => { }, // No callback needed for prefetch
            LoadPriority.LOW
          );
        }
      },
      loadPriority
    );
  };

  // Initial load
  useEffect(() => {
    loadProductData();
  }, [productId]);

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (product) {
      try {
        await addToCart(product, 1);
        toast.success('Added to cart!');
      } catch (error) {
        toast.error('Failed to add to cart');
      }
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    if (product) {
      try {
        if (isInWishlist(product.id)) {
          await removeFromWishlist(product.id);
          toast.success('Removed from wishlist');
        } else {
          await addToWishlist(product);
          toast.success('Added to wishlist!');
        }
      } catch (error) {
        toast.error('Failed to update wishlist');
      }
    }
  };

  // Handle share
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product) {
      const url = `${window.location.origin}/product/${product.id}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: product.title,
            url: url
          });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        }
      } catch (error) {
        // User probably cancelled sharing
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGamePromptOpen(true);
  };

  const handlePlay = () => {
    setGamePromptOpen(false);
    router.push('/game');
  };

  const handleSkip = () => {
    setGamePromptOpen(false);
    if (product) {
      router.push(`/product/${product.id}`);
    }
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-md overflow-hidden ${className} animate-pulse`}
      >
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mt-2"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-md overflow-hidden ${className} border border-red-200`}
      >
        <div className="aspect-square bg-gray-100 flex items-center justify-center text-red-500">
          <span>Failed to load product</span>
        </div>
      </div>
    );
  }

  // Render product card
  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className}`}
      >
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square relative overflow-hidden bg-gray-50">
            {product.images && product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            )}

            {/* Overlay for wishlist, share */}
            <div className="absolute top-2 right-2 flex flex-col space-y-2">
              <button
                onClick={handleWishlistToggle}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                />
              </button>

              <button
                onClick={handleShare}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Badge for discounts, new items, etc */}
            {product.discount && product.discount > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discount}% OFF
              </div>
            )}

            {/* Stats row */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>{product.views || 0}</span>
                </div>

                <div className="flex items-center bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Heart className="w-3 h-3 mr-1" />
                  <span>{product.likes?.length || 0}</span>
                </div>
              </div>

              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                ⭐ {(product.rating || 0).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Product title */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.title}</h3>

            {/* Seller info */}
            <div className="text-xs text-gray-500 mb-2 flex items-center">
              <span className="line-clamp-1">{product.sellerName}</span>
              {product.verified && (
                <svg className="w-3 h-3 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Price & Add to cart */}
            <div className="flex items-center justify-between mt-3">
              <div className="font-bold text-gray-900 text-lg">
                ${product.price?.toFixed(2)}
              </div>

              <div className="flex items-center gap-2">
                {/* Game Trigger Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGamePromptOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                  title="Play to Win Discount"
                >
                  <Gamepad2 className="w-3 h-3" />
                  <span>Win %</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      <GamePromptModal
        isOpen={gamePromptOpen}
        onClose={() => setGamePromptOpen(false)}
        onPlay={handlePlay}
        onSkip={handleSkip}
        productImage={product.images?.[0]}
      />
    </>
  );
}
