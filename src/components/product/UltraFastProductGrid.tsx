'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ultraFastLoader, { ContentType, LoadPriority } from '@/lib/ultraFastLoader';
import UltraFastProductCard from './UltraFastProductCard';

// Types
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
  [key: string]: any;
}

interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  status?: 'active' | 'inactive' | 'draft';
  search?: string;
}

interface UltraFastProductGridProps {
  filters?: ProductFilter;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  initialLimit?: number;
  incrementalLoadCount?: number;
  gridClassName?: string;
  cardClassName?: string;
  columns?: number;
  gap?: number;
  showLoadMore?: boolean;
  enableInfiniteScroll?: boolean;
  onProductsLoaded?: (products: Product[]) => void;
  onProductClick?: (product: Product) => void;
  emptyStateMessage?: string;
}

/**
 * UltraFastProductGrid - A YouTube/TikTok-style ultra fast product grid
 *
 * Features:
 * - Instant initial display with progressive loading
 * - Virtualization for large lists
 * - Infinite scroll with intelligent prefetching
 * - Minimal caching for fresh data
 */
export default function UltraFastProductGrid({
  filters = {},
  orderByField = 'createdAt',
  orderDirection = 'desc',
  initialLimit = 20,
  incrementalLoadCount = 10,
  gridClassName = '',
  cardClassName = '',
  columns = 3,
  gap = 4,
  showLoadMore = true,
  enableInfiniteScroll = true,
  onProductsLoaded,
  onProductClick,
  emptyStateMessage = 'No products found',
}: UltraFastProductGridProps) {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedProductIds, setLoadedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleProducts, setVisibleProducts] = useState<number>(initialLimit);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const lastProductRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef<string | null>(null);

  // Load products
  const loadProducts = useCallback((limit = initialLimit, isLoadingMore = false) => {
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);

    // Cancel any previous request
    if (requestIdRef.current) {
      ultraFastLoader.cancelRequest(requestIdRef.current);
    }

    const requestId = ultraFastLoader.loadProductsList(
      filters,
      orderByField,
      orderDirection,
      limit,
      (newProducts) => {
        if (!isLoadingMore) {
          setProducts(newProducts);
        } else {
          // Filter out products we already have
          const existingIds = new Set(products.map(p => p.id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
          setProducts(prev => [...prev, ...uniqueNewProducts]);
        }

        // Update loaded product IDs
        setLoadedProductIds(new Set(newProducts.map(p => p.id)));

        // Determine if we have more products
        setHasMore(newProducts.length >= limit);

        // Reset loading states
        setLoading(false);
        setLoadingMore(false);

        // Call callback if provided
        if (onProductsLoaded) {
          onProductsLoaded(newProducts);
        }
      },
      isLoadingMore ? LoadPriority.MEDIUM : LoadPriority.HIGH
    );

    requestIdRef.current = requestId;
  }, [filters, orderByField, orderDirection, initialLimit, products, onProductsLoaded]);

  // Initial load
  useEffect(() => {
    loadProducts();

    // Clean up on unmount
    return () => {
      if (requestIdRef.current) {
        ultraFastLoader.cancelRequest(requestIdRef.current);
      }
    };
  }, [filters, orderByField, orderDirection]);

  // Infinite scroll setup
  useEffect(() => {
    if (!enableInfiniteScroll || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (lastProductRef.current) {
      observer.observe(lastProductRef.current);
    }

    return () => {
      if (lastProductRef.current) {
        observer.unobserve(lastProductRef.current);
      }
    };
  }, [hasMore, loading, loadingMore, enableInfiniteScroll, products.length]);

  // Load more products
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    const newLimit = products.length + incrementalLoadCount;
    setVisibleProducts(newLimit);
    loadProducts(newLimit, true);
  };

  // Handle product loaded callback
  const handleProductLoaded = (product: Product) => {
    // Add to loaded products set for tracking
    setLoadedProductIds(prev => new Set(prev.add(product.id)));
  };

  // Generate grid style
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${gap * 0.25}rem`,
  };

  // Render loading skeleton
  if (loading && products.length === 0) {
    return (
      <div className={gridClassName} style={gridStyle}>
        {Array.from({ length: initialLimit }).map((_, i) => (
          <div key={`skeleton-${i}`} className={`animate-pulse bg-gray-200 rounded-lg ${cardClassName}`}>
            <div className="aspect-square bg-gray-300"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg text-red-500">
        <div className="text-center">
          <p className="text-lg font-semibold">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={() => loadProducts()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (products.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-lg text-gray-500 font-medium">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div>
      <div ref={gridRef} className={gridClassName} style={gridStyle}>
        {products.map((product, index) => (
          <div
            key={product.id}
            ref={index === products.length - 1 ? lastProductRef : null}
          >
            <UltraFastProductCard
              productId={product.id}
              initialData={product}
              priority={index < 10 ? LoadPriority.HIGH : LoadPriority.MEDIUM}
              prefetchRelated={index < 5} // Only prefetch related for first few products
              onProductLoaded={handleProductLoaded}
              className={cardClassName}
            />
          </div>
        ))}

        {/* Loading placeholders for infinite scroll */}
        {loadingMore && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`loading-more-${i}`} className={`animate-pulse bg-gray-100 rounded-lg ${cardClassName}`}>
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more button */}
      {showLoadMore && hasMore && !enableInfiniteScroll && (
        <div className="mt-8 flex justify-center">
          <motion.button
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            onClick={loadMore}
            disabled={loadingMore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </motion.button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {enableInfiniteScroll && hasMore && loadingMore && (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-500">Loading more...</span>
        </div>
      )}
    </div>
  );
}
