'use client';
import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
export function RelatedProducts({ products, currentProductId }) {
    // Filter out the current product and limit to 4 related products
    const relatedProducts = products
        .filter(product => product.id !== currentProductId)
        .slice(0, 4);
    if (relatedProducts.length === 0) {
        return null;
    }
    return (<div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <Link href={`/product/${product.id}`}>
              <div className="relative aspect-square">
                <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} className="object-cover w-full h-full"/>
              </div>
            </Link>
            
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.brandColor }}/>
                <span className="text-sm font-medium text-gray-600">
                  {product.brand}
                </span>
              </div>
              
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
              </Link>
              
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {product.tagline}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${product.price}
                </span>
                
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Heart size={16}/>
                    <span className="text-sm">{product.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16}/>
                    <span className="text-sm">{product.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>))}
      </div>
    </div>);
}
