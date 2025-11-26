'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { Heart, Share2, Bookmark, Star, Filter, Grid, List, Search, ShoppingCart } from 'lucide-react';
import { subscribeToProducts, toggleProductLike } from '@/lib/productService';
export default function ExplorePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const { user, userData } = useAuthStore();
    const { addToCart } = useCartStore();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        // Initialize cart and wishlist if user is logged in
        if (user) {
            useCartStore.getState().initializeCart(user.sub);
            useWishlistStore.getState().initializeWishlist(user.sub);
        }
    }, [user]);
    useEffect(() => {
        // Subscribe to products with filters
        const unsubscribe = subscribeToProducts((firebaseProducts) => {
            console.log('Explore products loaded:', firebaseProducts.length);
            // Ensure products have proper structure
            let filteredProducts = firebaseProducts.map(product => {
                var _a, _b;
                return (Object.assign(Object.assign({}, product), { comments: product.commentsCount || product.comments || 0, sellerRef: product.sellerRef || {
                        id: product.sellerId || '',
                        name: ((_a = product.seller) === null || _a === void 0 ? void 0 : _a.name) || product.sellerName || '',
                        photoURL: ((_b = product.seller) === null || _b === void 0 ? void 0 : _b.avatar) || product.sellerPhoto || ''
                    } }));
            });
            // Filter out demo products first
            filteredProducts = filteredProducts.filter(product => {
                var _a;
                const title = product.title.toLowerCase();
                const seller = ((_a = product.sellerName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                // Demo product titles to exclude
                const demoTitles = ['organic cotton t-shirt', 'premium wireless headphones', 'demo smart watch'];
                const demoSellers = ['ecofashion', 'audiomaster', 'techgear pro'];
                const isDemoTitle = demoTitles.some(demoTitle => title.includes(demoTitle) || demoTitle.includes(title));
                const isDemoSeller = demoSellers.some(demoSeller => seller.includes(demoSeller) || demoSeller.includes(seller));
                return !isDemoTitle && !isDemoSeller;
            });
            console.log('Explore products after filtering:', filteredProducts.length);
            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredProducts = filteredProducts.filter(product => {
                    var _a;
                    return product.title.toLowerCase().includes(query) ||
                        product.description.toLowerCase().includes(query) ||
                        ((_a = product.brand) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query));
                });
            }
            // Apply price filters
            if (filters.minPrice !== undefined) {
                filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice);
            }
            // Apply rating filter
            if (filters.rating !== undefined) {
                filteredProducts = filteredProducts.filter(product => product.rating >= filters.rating);
            }
            // Apply sorting
            if (filters.sortBy) {
                switch (filters.sortBy) {
                    case 'price_low':
                        filteredProducts.sort((a, b) => a.price - b.price);
                        break;
                    case 'price_high':
                        filteredProducts.sort((a, b) => b.price - a.price);
                        break;
                    case 'rating':
                        filteredProducts.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'popularity':
                        // Use likes property instead of likesCount
                        filteredProducts.sort((a, b) => { var _a, _b; return (((_a = b.likes) === null || _a === void 0 ? void 0 : _a.length) || 0) - (((_b = a.likes) === null || _b === void 0 ? void 0 : _b.length) || 0); });
                        break;
                    case 'newest':
                    default:
                        filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        break;
                }
            }
            setProducts(filteredProducts);
            setLoading(false);
        }, { category: filters.category });
        return () => unsubscribe();
    }, [filters, searchQuery]);
    const handleLike = async (product) => {
        if (!user) {
            toast.error('Please login to like products');
            return;
        }
        try {
            await toggleProductLike(product.id, user.sub);
            toast.success('Like updated!');
        }
        catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Failed to update like');
        }
    };
    const handleSave = async (product) => {
        if (!user) {
            toast.error('Please login to save products');
            return;
        }
        const isSaved = isInWishlist(product.id);
        try {
            if (isSaved) {
                await removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
            }
            else {
                await addToWishlist(product);
                toast.success('Added to wishlist!');
            }
        }
        catch (error) {
            toast.error('Failed to update wishlist');
        }
    };
    const handleAddToCart = async (product) => {
        if (!user) {
            toast.error('Please login to add items to cart');
            return;
        }
        try {
            await addToCart(product, 1);
            toast.success('Added to cart!');
        }
        catch (error) {
            toast.error('Failed to add to cart');
        }
    };
    const handleShare = async (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: product.description,
                    url: url
                });
            }
            catch (error) {
                // User cancelled sharing
            }
        }
        else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400"/>);
        }
        if (hasHalfStar) {
            stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400"/>);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300"/>);
        }
        return stars;
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (<div key={i} className="bg-white rounded-lg p-4 space-y-3">
                  <div className="h-48 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>))}
            </div>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Products</h1>
          <p className="text-gray-600 dark:text-gray-300">Discover amazing products from our community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            </div>

            {/* Filter Button */}
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5"/>
              <span>Filters</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}>
                <Grid className="w-5 h-5"/>
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}>
                <List className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={filters.category || ''} onChange={(e) => setFilters(Object.assign(Object.assign({}, filters), { category: e.target.value || undefined }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Sports">Sports</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                    <input type="number" placeholder="0" value={filters.minPrice || ''} onChange={(e) => setFilters(Object.assign(Object.assign({}, filters), { minPrice: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                    <input type="number" placeholder="1000" value={filters.maxPrice || ''} onChange={(e) => setFilters(Object.assign(Object.assign({}, filters), { maxPrice: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select value={filters.sortBy || 'newest'} onChange={(e) => setFilters(Object.assign(Object.assign({}, filters), { sortBy: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="newest">Newest</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="popularity">Most Popular</option>
                    </select>
                  </div>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>

        {/* Products Grid/List */}
        {products.length === 0 ? (<div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto"/>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filters</p>
          </div>) : (<div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"}>
            {products.map((product) => {
                var _a, _b, _c, _d, _e;
                return (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
                {/* Product Image */}
                <div className={viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'}>
                  <Link href={`/product/${product.id}`}>
                    <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} width={viewMode === 'list' ? '192' : '400'} height={viewMode === 'list' ? '192' : '400'} className="w-full h-full object-cover hover:scale-105 transition-transform"/>
                  </Link>
                </div>

                {/* Product Info */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-purple-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center">
                      {renderStars(product.rating)}
                      <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <img src={((_a = product.seller) === null || _a === void 0 ? void 0 : _a.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(((_b = product.seller) === null || _b === void 0 ? void 0 : _b.name) || 'seller')}`} alt={((_c = product.seller) === null || _c === void 0 ? void 0 : _c.name) || 'Seller'} width="20" height="20" className="rounded-full"/>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{(_d = product.seller) === null || _d === void 0 ? void 0 : _d.name}</span>
                    {((_e = product.seller) === null || _e === void 0 ? void 0 : _e.isVerified) && (<span className="text-blue-500 text-xs">✓</span>)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => handleAddToCart(product)} className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                      <ShoppingCart className="w-4 h-4"/>
                      <span>Add to Cart</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleLike(product)} className={`p-2 rounded-full transition-colors ${Array.isArray(product.likes) && product.likes.includes((user === null || user === void 0 ? void 0 : user.sub) || '')
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                        <Heart className={`w-4 h-4 ${Array.isArray(product.likes) && product.likes.includes((user === null || user === void 0 ? void 0 : user.sub) || '') ? 'fill-current' : ''}`}/>
                      </button>
                      
                      <button onClick={() => handleSave(product)} className={`p-2 rounded-full transition-colors ${isInWishlist(product.id)
                        ? 'text-purple-500 bg-purple-50'
                        : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}>
                        <Bookmark className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`}/>
                      </button>
                      
                      <button onClick={() => handleShare(product)} className="p-2 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                        <Share2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>{Array.isArray(product.likes) ? product.likes.length : 0} likes</span>
                    <span>{product.comments || 0} comments</span>
                    <span>{product.views || 0} views</span>
                  </div>
                </div>
              </motion.div>);
            })}
          </div>)}

        {/* Load More Button */}
        {products.length > 0 && (<div className="text-center mt-8">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Load More Products
            </button>
          </div>)}
      </div>
    </div>);
}

