'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts } from '@/lib/firestore';
import { getProducts } from '@/lib/productService';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Star, Heart, ShoppingCart, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerName: string;
  likes: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  createdAt?: any;
}

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  inStock: boolean;
}

const categories = [
  'All Categories',
  'Fashion & Clothing',
  'Electronics',
  'Home & Garden',
  'Beauty & Health',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Food & Beverages'
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: 'All Categories',
    minPrice: 0,
    maxPrice: 1000,
    rating: 0,
    inStock: false
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest'>('relevance');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    
    setLoading(true);
    try {
      // Try Firebase search first
      let searchResults: Product[] = [];
      try {
        searchResults = await searchProducts(term, filters);
      } catch (error) {
        console.log('Firebase search failed, using fallback:', error);
        // Fallback to demo data
        const allProducts = await getProducts();
        searchResults = allProducts.filter(product => 
          product.title.toLowerCase().includes(term.toLowerCase()) ||
          product.description.toLowerCase().includes(term.toLowerCase()) ||
          product.category.toLowerCase().includes(term.toLowerCase()) ||
          product.sellerName.toLowerCase().includes(term.toLowerCase())
        ).map(product => ({
          ...product,
          id: product.id || '',
          likes: product.likes || [],
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          stock: product.stock || 0
        }));
      }

      // Apply additional filters
      let filteredResults = searchResults;

      if (filters.category !== 'All Categories') {
        filteredResults = filteredResults.filter(product => 
          product.category === filters.category
        );
      }

      if (filters.minPrice > 0) {
        filteredResults = filteredResults.filter(product => 
          product.price >= filters.minPrice
        );
      }

      if (filters.maxPrice < 1000) {
        filteredResults = filteredResults.filter(product => 
          product.price <= filters.maxPrice
        );
      }

      if (filters.rating > 0) {
        filteredResults = filteredResults.filter(product => 
          product.rating >= filters.rating
        );
      }

      if (filters.inStock) {
        filteredResults = filteredResults.filter(product => 
          product.stock > 0
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          filteredResults.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredResults.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredResults.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filteredResults.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          break;
        default:
          // Relevance - keep original order
          break;
      }

      setProducts(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  const handleSortChange = (value: typeof sortBy) => {
    setSortBy(value);
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '/placeholder-product.jpg',
      quantity: 1
    });
    toast.success('Added to cart!');
  };

  const clearFilters = () => {
    setFilters({
      category: 'All Categories',
      minPrice: 0,
      maxPrice: 1000,
      rating: 0,
      inStock: false
    });
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, sellers, categories..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-md hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Results Summary */}
          {!loading && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-300">
                {products.length} {products.length === 1 ? 'result' : 'results'} for "{searchTerm}"
              </p>
              
              <div className="flex items-center space-x-4">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-lg shadow-sm p-6 mb-6 lg:mb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                    <select
                      value={filters.rating}
                      onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={4}>4+ Stars</option>
                      <option value={3}>3+ Stars</option>
                      <option value={2}>2+ Stars</option>
                    </select>
                  </div>

                  {/* Stock Filter */}
                  <div className="mb-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-900 dark:text-white">In Stock Only</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={isHydrated ? { opacity: 0, y: 20 } : undefined}
                      animate={isHydrated ? { opacity: 1, y: 0 } : undefined}
                      transition={isHydrated ? { delay: index * 0.1 } : undefined}
                      whileHover={isHydrated ? { scale: 1.02 } : undefined}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Product Image */}
                      <Link href={`/product/${product.id}`}>
                        <div className="relative aspect-square">
                          <img
                            src={product.images[0] || '/placeholder-product.jpg'}
                            alt={product.title}
                            className="object-cover cursor-pointer w-full h-full"
                          />
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="p-4">
                        {/* Seller Info */}
                        <div className="flex items-center mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{product.sellerName}</span>
                        </div>

                        {/* Product Title and Price */}
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-purple-600 transition-colors cursor-pointer mb-2">
                            {product.title}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">Rs {product.price}</p>
                          {product.stock > 0 ? (
                            <span className="text-green-600 text-sm">In Stock</span>
                          ) : (
                            <span className="text-red-600 text-sm">Out of Stock</span>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {product.rating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </button>
                          
                          <button className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                          
                          <button className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>}>
      <SearchPageContent />
    </Suspense>
  );
}
