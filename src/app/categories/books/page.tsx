'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Filter, 
  Search, 
  Star, 
  Heart, 
  Eye,
  Grid3X3,
  List,
  X
} from 'lucide-react';

// Demo products removed - will load from Firebase
const booksProducts: any[] = [];

const filters = {
  brands: ['TechBooks', 'LifeBooks', 'CulinaryPress', 'FictionWorld', 'BusinessBooks', 'KidsRead', 'ArtHistory', 'MarketingPro'],
  categories: ['Technology', 'Self-Help', 'Cooking', 'Fiction', 'Business', 'Children', 'Art', 'Marketing', 'Science', 'Biography'],
  priceRanges: ['Under $10', '$10 - $20', '$20 - $30', '$30 - $50', 'Over $50'],
  ratings: ['4+ Stars', '4.5+ Stars', '4.8+ Stars']
};

export default function BooksPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    brands: [] as string[],
    categories: [] as string[],
    priceRange: '' as string,
    rating: '' as string
  });

  const toggleFilter = (filterType: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      if (filterType === 'priceRange' || filterType === 'rating') {
        return { ...prev, [filterType]: prev[filterType] === value ? '' : value };
      }
      
      const currentFilters = prev[filterType] as string[];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(item => item !== value)
        : [...currentFilters, value];
      
      return { ...prev, [filterType]: newFilters };
    });
  };

  const filteredProducts = booksProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedFilters.brands.length === 0 || 
                        selectedFilters.brands.includes(product.brand);
    
    const matchesCategory = selectedFilters.categories.length === 0 || 
                           selectedFilters.categories.includes(product.category);
    
    const matchesPrice = !selectedFilters.priceRange || 
                        (selectedFilters.priceRange === 'Under $10' && product.price < 10) ||
                        (selectedFilters.priceRange === '$10 - $20' && product.price >= 10 && product.price <= 20) ||
                        (selectedFilters.priceRange === '$20 - $30' && product.price >= 20 && product.price <= 30) ||
                        (selectedFilters.priceRange === '$30 - $50' && product.price >= 30 && product.price <= 50) ||
                        (selectedFilters.priceRange === 'Over $50' && product.price > 50);
    
    const matchesRating = !selectedFilters.rating || 
                         (selectedFilters.rating === '4+ Stars' && product.rating >= 4) ||
                         (selectedFilters.rating === '4.5+ Stars' && product.rating >= 4.5) ||
                         (selectedFilters.rating === '4.8+ Stars' && product.rating >= 4.8);
    
    return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesRating;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <BookOpen className="w-16 h-16 mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Books & Media
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
                Discover knowledge, stories, and inspiration through books and digital content
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books & media..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={() => {
                  console.log('Filter button clicked, current showFilters:', showFilters);
                  setShowFilters(!showFilters);
                }}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-black text-white hover:bg-gray-800"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Mobile Overlay */}
          {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] lg:hidden" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              <div className="fixed right-0 top-0 h-full w-80 bg-black shadow-lg overflow-y-auto" style={{ zIndex: 1000000, position: 'fixed', top: 0, right: 0, height: '100vh', width: '320px' }}>
                {/* Debug indicator */}
                <div className="absolute top-0 left-0 bg-red-500 text-white p-2 text-xs">FILTERS OPEN</div>
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Filters</h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedFilters({
                            brands: [],
                            priceRange: '',
                            categories: [],
                            rating: ''
                          });
                        }}
                        className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
                      >
                        Clear All
                      </button>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-4">Publishers</h3>
                    <div className="space-y-2">
                      {filters.brands.map(brand => (
                        <label key={brand} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFilters.brands.includes(brand)}
                            onChange={() => toggleFilter('brands', brand)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-200">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-4">Categories</h3>
                    <div className="space-y-2">
                      {filters.categories.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFilters.categories.includes(category)}
                            onChange={() => toggleFilter('categories', category)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-200">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-4">Price Range</h3>
                    <div className="space-y-2">
                      {filters.priceRanges.map(range => (
                        <label key={range} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFilters.priceRange === range}
                            onChange={() => toggleFilter('priceRange', range)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-200">{range}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-4">Rating</h3>
                    <div className="space-y-2">
                      {filters.ratings.map(rating => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFilters.rating === rating}
                            onChange={() => toggleFilter('rating', rating)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-200">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Publishers</h3>
              <div className="space-y-2">
                {filters.brands.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.brands.includes(brand)}
                      onChange={() => toggleFilter('brands', brand)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {filters.categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.categories.includes(category)}
                      onChange={() => toggleFilter('categories', category)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-2">
                {filters.priceRanges.map(range => (
                  <label key={range} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.priceRange === range}
                      onChange={() => toggleFilter('priceRange', range)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Rating</h3>
              <div className="space-y-2">
                {filters.ratings.map(rating => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.rating === rating}
                      onChange={() => toggleFilter('rating', rating)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{rating}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <button 
                onClick={() => {
                  setSelectedFilters({
                    brands: [],
                    priceRange: '',
                    categories: [],
                    rating: ''
                  });
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Showing {filteredProducts.length} of {booksProducts.length} products
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        width="400"
                        height="400"
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {product.isNew && (
                        <span className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 text-xs rounded">
                          NEW
                        </span>
                      )}
                      {product.discount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                          -{product.discount}%
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                          <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-50">
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                          <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-50">
                            <Heart className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{product.brand}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                          <span className="text-sm text-gray-400 ml-1">({product.reviews})</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">${product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover rounded w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                      {product.isNew && (
                        <span className="absolute -top-1 -left-1 bg-purple-600 text-white px-1 py-0.5 text-xs rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{product.brand}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                          <span className="text-sm text-gray-400 ml-1">({product.reviews})</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">${product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
