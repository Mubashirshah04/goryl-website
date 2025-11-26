'use client';

import React from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';

interface ProductGridProps {
  category?: string;
  limit?: number;
}

export function ProductGrid({ category, limit = 20 }: ProductGridProps) {
  const { data, loading, error } = useProducts(category, limit);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading products: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 dark:text-gray-300">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {data.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            type: 'spring',
            stiffness: 100 
          }}
          whileHover={{ scale: 1.03 }}
        >
          <ProductCard 
            product={{
              id: product.id,
              title: product.title,
              price: product.price,
              images: product.images,
              brand: 'Brand', // You can fetch this from sellerRef
              brandColor: 'bg-purple-600',
              tagline: product.description.slice(0, 50) + '...',
              likes: 0 // This would come from aggregated data
            }} 
          />
        </motion.div>
      ))}
    </div>
  );
}
