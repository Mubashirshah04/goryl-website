'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Sofa, Lamp, ChefHat, Package, Sparkles, PawPrint, Wrench, Paintbrush, Shield, Wifi, Monitor, Baby, Droplets, Wind, Thermometer, ArrowLeft, Search, Grid3X3, List, Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
const subcategories = [
    { name: 'Furniture', icon: Sofa, count: 1800 },
    { name: 'Kitchen Appliances', icon: ChefHat, count: 1200 },
    { name: 'Lighting & Decor', icon: Lamp, count: 950 },
    { name: 'Bedding & Bath', icon: Home, count: 750 },
    { name: 'Storage & Organization', icon: Package, count: 650 },
    { name: 'Garden & Outdoor', icon: Home, count: 580 },
    { name: 'Cleaning Supplies', icon: Sparkles, count: 420 },
    { name: 'Pet Supplies', icon: PawPrint, count: 380 },
    { name: 'Tools & Hardware', icon: Wrench, count: 320 },
    { name: 'Paint & DIY', icon: Paintbrush, count: 280 },
    { name: 'Home Security', icon: Shield, count: 150 },
    { name: 'Smart Home', icon: Wifi, count: 120 },
    { name: 'Home Office', icon: Monitor, count: 180 },
    { name: 'Baby & Kids Room', icon: Baby, count: 220 },
    { name: 'Laundry & Care', icon: Droplets, count: 160 },
    { name: 'Air Quality', icon: Wind, count: 90 },
    { name: 'Heating & Cooling', icon: Thermometer, count: 110 },
    { name: 'Plumbing', icon: Droplets, count: 85 }
];
export default function HomeGardenCategoryPage() {
    const { user } = useAuthStore();
    const { addToCart } = useCartStore();
    const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Load real products from Firebase
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                // TODO: Replace with actual Firebase product loading
                // const { getProductsByCategory } = await import('@/lib/services/productService');
                // const firebaseProducts = await getProductsByCategory('home-garden');
                // setProducts(firebaseProducts);
                // For now, show empty state
                setProducts([]);
            }
            catch (error) {
                console.error('Failed to load products:', error);
                setProducts([]);
            }
            finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);
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
    const handleToggleWishlist = async (product) => {
        if (!user) {
            toast.error('Please login to add to wishlist');
            return;
        }
        try {
            const isInWishlist = wishlist.some(item => item.id === product.id);
            if (isInWishlist) {
                await removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
            }
            else {
                await addToWishlist(product);
                toast.success('Added to wishlist');
            }
        }
        catch (error) {
            toast.error('Failed to update wishlist');
        }
    };
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubcategory = selectedSubcategory === 'all' || product.subcategory === selectedSubcategory;
        return matchesSearch && matchesSubcategory;
    });
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price_low':
                return a.price - b.price;
            case 'price_high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'popularity':
                return b.reviewCount - a.reviewCount;
            default:
                return 0;
        }
    });
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/categories" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-white"/>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Home className="w-6 h-6 text-white"/>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Home & Garden</h1>
                  <p className="text-purple-200">Everything for your home</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Grid3X3 className="w-5 h-5"/>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <List className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input type="text" placeholder="Search home & garden..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full sm:w-auto px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all">All Subcategories</option>
                {subcategories.map(sub => (<option key={sub.name} value={sub.name.toLowerCase().replace(/\s+/g, '').replace(/[&]/g, '')}>
                    {sub.name}
                  </option>))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subcategories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {subcategories.map((sub, index) => (<motion.button key={sub.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => setSelectedSubcategory(sub.name.toLowerCase().replace(/\s+/g, '').replace(/[&]/g, ''))} className={`p-4 rounded-2xl transition-all duration-300 ${selectedSubcategory === sub.name.toLowerCase().replace(/\s+/g, '').replace(/[&]/g, '')
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10'}`}>
                <sub.icon className="w-8 h-8 mx-auto mb-2"/>
                <p className="text-sm font-medium text-center">{sub.name}</p>
                <p className="text-xs text-center opacity-75">{sub.count}+</p>
              </motion.button>))}
          </div>
        </div>

        {/* Products */}
        {loading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (<div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-600 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-600 rounded"></div>
              </div>))}
          </div>) : sortedProducts.length === 0 ? (<div className="text-center py-16">
            <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
              <Home className="w-24 h-24 text-purple-300"/>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              No products found
            </h2>
            <p className="text-purple-200 text-xl mb-8 leading-relaxed">
              Be the first to add home & garden products to this category
            </p>
            <Link href="/product/upload" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl font-bold text-lg">
              Add Product
            </Link>
          </div>) : (<div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'}`}>
            {sortedProducts.map((product, index) => (<motion.div key={product.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group cursor-pointer">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 h-full transition-all duration-500 group-hover:bg-white/10 group-hover:border-purple-400/30 group-hover:shadow-2xl group-hover:shadow-purple-500/20 group-hover:scale-105">
                  <div className="relative mb-4">
                    <div className="w-full h-48 rounded-2xl overflow-hidden">
                      <img src={product.images[0]} alt={product.title} width={400} height={300} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer"/>
                    </div>
                    {product.isNew && (<span className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        New
                      </span>)}
                    {product.isFeatured && (<span className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Featured
                      </span>)}
                    {product.discount && (<span className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        -{product.discount}%
                      </span>)}
                    <button onClick={() => handleToggleWishlist(product)} className="absolute bottom-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                      <Heart className={`w-5 h-5 ${wishlist.some(item => item.id === product.id) ? 'text-red-500 fill-current' : 'text-white'}`}/>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}/>))}
                      </div>
                      <span className="text-gray-400 text-sm">({product.reviewCount})</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-white">${product.price}</span>
                        {product.originalPrice && (<span className="text-gray-400 line-through ml-2">${product.originalPrice}</span>)}
                      </div>
                      <span className="text-gray-400 text-sm">{product.stock} in stock</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <img src={product.seller.avatar} alt={product.seller.name} width={24} height={24} className="rounded-full" referrerPolicy="no-referrer"/>
                      <span className="text-gray-300 text-sm">{product.seller.name}</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current"/>
                        <span className="text-gray-400 text-xs ml-1">{product.seller.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => handleAddToCart(product)} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2">
                        <ShoppingCart className="w-4 h-4"/>
                        <span>Add to Cart</span>
                      </button>
                      <Link href={`/product/${product.id}`} className="px-4 py-2 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center justify-center">
                        <Eye className="w-4 h-4"/>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>))}
          </div>)}
      </div>
    </div>);
}
