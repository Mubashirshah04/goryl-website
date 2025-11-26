'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Apple, Scissors, Stethoscope, Home, Truck, GraduationCap, Shield, Shirt, Sparkles, Heart, BookOpen, ArrowLeft, Search, Grid3X3, List, Star, Heart as HeartIcon, ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
const subcategories = [
    { name: 'Dog Supplies', icon: PawPrint, count: 450 },
    { name: 'Cat Supplies', icon: PawPrint, count: 320 },
    { name: 'Fish & Aquarium', icon: PawPrint, count: 280 },
    { name: 'Bird Supplies', icon: PawPrint, count: 220 },
    { name: 'Small Animal Supplies', icon: PawPrint, count: 180 },
    { name: 'Reptile Supplies', icon: PawPrint, count: 150 },
    { name: 'Pet Food & Treats', icon: Apple, count: 95 },
    { name: 'Pet Toys', icon: PawPrint, count: 120 },
    { name: 'Pet Grooming', icon: Scissors, count: 160 },
    { name: 'Pet Health & Medicine', icon: Stethoscope, count: 130 },
    { name: 'Pet Beds & Furniture', icon: Home, count: 75 },
    { name: 'Pet Carriers & Travel', icon: Truck, count: 90 },
    { name: 'Pet Training', icon: GraduationCap, count: 65 },
    { name: 'Pet Safety', icon: Shield, count: 140 },
    { name: 'Pet Clothing & Accessories', icon: Shirt, count: 80 },
    { name: 'Pet Cleaning Supplies', icon: Sparkles, count: 110 },
    { name: 'Pet Memorial & Urns', icon: Heart, count: 85 },
    { name: 'Pet Books & Media', icon: BookOpen, count: 70 }
];
export default function PetSuppliesCategoryPage() {
    const { user } = useAuthStore();
    const { addToCart } = useCartStore();
    const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Mock products data
    const mockProducts = [
        {
            id: '1',
            title: 'Premium Dog Food',
            description: 'High-quality dog food with natural ingredients',
            price: 49,
            originalPrice: 69,
            images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500'],
            rating: 4.8,
            reviewCount: 1250,
            seller: {
                name: 'Pet Food Pro',
                rating: 4.9,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pet'
            },
            isNew: true,
            isFeatured: true,
            discount: 29,
            stock: 45,
            category: 'pet-supplies',
            subcategory: 'pet-food-treats'
        },
        {
            id: '2',
            title: 'Cat Scratching Post',
            description: 'Multi-level cat scratching post with toys',
            price: 89,
            originalPrice: 119,
            images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500'],
            rating: 4.9,
            reviewCount: 890,
            seller: {
                name: 'Cat Central',
                rating: 4.8,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat'
            },
            isNew: true,
            isFeatured: true,
            discount: 25,
            stock: 25,
            category: 'pet-supplies',
            subcategory: 'cat-supplies'
        },
        {
            id: '3',
            title: 'Dog Training Kit',
            description: 'Complete dog training kit with treats and clicker',
            price: 39,
            originalPrice: 49,
            images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500'],
            rating: 4.7,
            reviewCount: 2100,
            seller: {
                name: 'Training Masters',
                rating: 4.9,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=training'
            },
            isNew: false,
            isFeatured: true,
            discount: 20,
            stock: 32,
            category: 'pet-supplies',
            subcategory: 'pet-training'
        },
        {
            id: '4',
            title: 'Aquarium Starter Kit',
            description: 'Complete 20-gallon aquarium starter kit',
            price: 199,
            originalPrice: 249,
            images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500'],
            rating: 4.8,
            reviewCount: 3200,
            seller: {
                name: 'Aqua World',
                rating: 4.7,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aquarium'
            },
            isNew: false,
            isFeatured: false,
            discount: 20,
            stock: 78,
            category: 'pet-supplies',
            subcategory: 'fish-aquarium'
        },
        {
            id: '5',
            title: 'Pet Grooming Kit',
            description: 'Professional pet grooming kit with brushes and tools',
            price: 59,
            originalPrice: 79,
            images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500'],
            rating: 4.6,
            reviewCount: 1560,
            seller: {
                name: 'Grooming Pro',
                rating: 4.8,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grooming'
            },
            isNew: true,
            isFeatured: true,
            discount: 25,
            stock: 120,
            category: 'pet-supplies',
            subcategory: 'pet-grooming'
        },
        {
            id: '6',
            title: 'Pet Carrier Bag',
            description: 'Premium pet carrier bag for travel',
            price: 79,
            originalPrice: 99,
            images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500'],
            rating: 4.9,
            reviewCount: 890,
            seller: {
                name: 'Travel Pets',
                rating: 4.9,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'
            },
            isNew: false,
            isFeatured: true,
            discount: 20,
            stock: 65,
            category: 'pet-supplies',
            subcategory: 'pet-carriers-travel'
        }
    ];
    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setProducts(mockProducts);
            setLoading(false);
        }, 1000);
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
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <PawPrint className="w-6 h-6 text-white"/>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Pet Supplies</h1>
                  <p className="text-purple-200">Everything for your pets</p>
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
              <input type="text" placeholder="Search pet supplies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
            </div>
            <div className="flex items-center space-x-4">
              <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all">All Subcategories</option>
                {subcategories.map(sub => (<option key={sub.name} value={sub.name.toLowerCase().replace(/\s+/g, '').replace(/[&]/g, '')}>
                    {sub.name}
                  </option>))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
        {loading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (<div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-600 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-600 rounded"></div>
              </div>))}
          </div>) : (<div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
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
                      <HeartIcon className={`w-5 h-5 ${wishlist.some(item => item.id === product.id) ? 'text-red-500 fill-current' : 'text-white'}`}/>
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

        {!loading && sortedProducts.length === 0 && (<div className="text-center py-16">
            <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
              <PawPrint className="w-24 h-24 text-purple-300"/>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              No products found
            </h2>
            <p className="text-purple-200 text-xl mb-8 leading-relaxed">
              Try adjusting your search or filter criteria
            </p>
            <button onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory('all');
            }} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl font-bold text-lg">
              Clear Filters
            </button>
          </div>)}
      </div>
    </div>);
}
