'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, Search, Filter, Download, Plus, Eye, CheckCircle, XCircle,
  Clock, AlertTriangle, Star, DollarSign, MapPin, Calendar, User,
  ChevronDown, ChevronUp, Edit, Trash2, ExternalLink, Image as ImageIcon,
  Video, FileText, MoreVertical, TrendingUp, TrendingDown, Eye as ViewsIcon
} from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/layout/AdminLayout'
import { ThemeProvider, useTheme } from 'next-themes'
// import { subscribeToProducts } from '@/lib/productService' // Migrated to AWS
import { Product } from '@/lib/types'

// Fixed syntax error in ProductManagementPage component
export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sellerTypeFilter, setSellerTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'draft' | 'pending'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newProduct, setNewProduct] = useState<{
    title: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    images: string[];
    tags: string[];
    sellerId: string;
    sellerName: string;
  }>({
    title: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    images: [],
    tags: [],
    sellerId: '',
    sellerName: '',
  });

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Fetch products from AWS API
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?status=all');
        const data = await response.json();
        
        const productsArray = data.data || data.products || [];
        console.log('🔄 Admin products loaded from AWS:', productsArray.length, 'products');
        
        setProducts(productsArray);
        setFilteredProducts(productsArray);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    
    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    let result = [...products]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.seller?.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter)
    }
    
    // Apply status filter
    if (activeTab !== 'all') {
      result = result.filter(product => product.status === activeTab)
    }
    
    setFilteredProducts(result)
  }, [products, searchQuery, categoryFilter, activeTab])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleProductAction = async (productId: string, action: 'activate' | 'deactivate' | 'draft' | 'delete' | 'approve' | 'decline') => {
    setLoading(true)
    try {
      const { updateProduct, deleteProduct } = await import('@/lib/productService')
      if (action === 'delete') {
        await deleteProduct(productId)
        setProducts(prev => prev.filter(product => product.id !== productId))
        toast.success('Product deleted successfully')
      } else {
        let newStatus: 'active' | 'inactive' | 'draft' | 'pending' = 'active';
        if (action === 'deactivate') newStatus = 'inactive';
        if (action === 'draft') newStatus = 'draft';
        if (action === 'activate') newStatus = 'active';
        if (action === 'approve') newStatus = 'active';
        if (action === 'decline') newStatus = 'inactive';
        await updateProduct(productId, { status: newStatus })
        setProducts(prev => prev.map(product => {
          if (product.id === productId) {
            return { ...product, status: newStatus }
          }
          return product
        }))
        const actionMessages: { [key: string]: string } = {
          'approve': 'Product approved',
          'decline': 'Product declined',
          'activate': 'Product activated',
          'deactivate': 'Product deactivated',
          'draft': 'Product moved to draft'
        };
        toast.success(actionMessages[action] || `Product status updated to ${newStatus}`)
      }
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error(`Failed to ${action} product`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    setLoading(true)
    try {
      const { createProduct } = await import('@/lib/productService')
      // Ensure we're sending the correct data structure
      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
        images: newProduct.images,
        category: newProduct.category,
        tags: newProduct.tags,
        sellerId: newProduct.sellerId,
        seller: {
          id: newProduct.sellerId,
          name: newProduct.sellerName,
          isVerified: false,
          rating: 0
        },
        sellerName: newProduct.sellerName,
        currency: 'USD',
        isActive: true,
        isFeatured: false,
        isTrending: false,
        isOnSale: false,
        rating: 0,
        likes: [],
        views: 0,
        reviewCount: 0,
        status: 'active' as const
      }
      
      const productId = await createProduct(productData)
      toast.success('Product created successfully')
      setShowCreateModal(false)
      setNewProduct({ title: '', category: '', price: 0, stock: 0, description: '', images: [], tags: [], sellerId: '', sellerName: '' })
      // The real-time listener will automatically update the products list
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const exportProducts = () => {
    // Example: Export filteredProducts to CSV
    const csv = filteredProducts.map(product => (
      [product.title, product.category, product.price, product.stock, product.seller?.name ?? ''].join(',')
    )).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  const getSellerTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'brand': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'company': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  // Get unique seller types for filtering (use 'personal' as default since seller.type doesn't exist)
  const sellerTypes = ['personal', 'brand', 'company']

  return (
    <ThemeProvider attribute="class">
      <AdminLayout 
        title="Product Management" 
        subtitle="Manage product listings and approvals"
        searchPlaceholder="Search products by name, seller, or category..."
        onSearch={handleSearch}
        actions={
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportProducts}
              className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </motion.button>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-white/10 text-white px-3 py-2 rounded-xl font-bold border border-white/20 ml-2"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-200">Total Products</p>
                  <p className="text-3xl font-bold text-white">{products.length}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-200">Pending Review</p>
                  <p className="text-3xl font-bold text-white">{products.filter(p => p.status === 'inactive').length}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-200">Total Sales</p>
                  <p className="text-3xl font-bold text-white">{products.length}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-200">Total Views</p>
                  <p className="text-3xl font-bold text-white">{products.reduce((sum, p) => sum + (Number((p as any).views) || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                  <ViewsIcon className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters and Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl"
          >
            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
                    {(['all', 'active', 'inactive', 'draft', 'pending'] as const).map((tab) => (
                      <motion.button
                        key={tab}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          activeTab === tab
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'text-purple-200 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          {tab === 'all' ? products.length : products.filter(p => p.status === tab).length}
                        </span>
                      </motion.button>
                    ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category, idx) => (
                      <option key={category + '-' + idx} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none" />
                </div>

                {/* Seller Type Filter */}
                <div className="relative">
                  <select
                    value={sellerTypeFilter}
                    onChange={(e) => setSellerTypeFilter(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10"
                  >
                    <option value="all">All Sellers</option>
                    {sellerTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-6 text-purple-200 font-semibold">Product</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Seller</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Category</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Price</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Status</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Performance</th>
                    <th className="text-left p-6 text-purple-200 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{product.title}</p>
                            <p className="text-purple-200 text-sm">{product.stock} in stock</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div>
                          {(() => {
                            const seller = product.seller ?? { name: 'Unknown', type: 'personal' };
                            return (
                              <>
                                <p className="text-white font-medium">{seller.name}</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30`}>
                                  Personal
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-purple-200">{product.category}</span>
                      </td>
                      <td className="p-6">
                        <div>
                          <p className="text-white font-semibold">{formatCurrency(product.price)}</p>
                          {/* Remove originalPrice check since it doesn't exist in Product type */}
                          {false && (
                            <p className="text-purple-200 text-sm line-through">N/A</p>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status ?? 'inactive')}`}>
                          {product.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {product.status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
                          {product.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                          {product.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          <span className="capitalize">{product.status === 'pending' ? 'Under Review' : product.status}</span>
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <ViewsIcon className="w-4 h-4 text-purple-300" />
                            <span className="text-white text-sm">{(typeof (product as any).views === 'number' ? (product as any).views : 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-300" />
                            <span className="text-white text-sm">0 sales</span>
                          </div>
                          {product.rating > 0 && (
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-300" />
                              <span className="text-white text-sm">{product.rating} ({product.reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedProduct(product)
                              setShowPreviewModal(true)
                            }}
                            className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                            title="Preview Product"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </motion.button>
                          {product.status === 'pending' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleProductAction(product.id ?? '', 'approve')}
                                disabled={loading}
                                className="p-2 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30"
                                title="Approve Product"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleProductAction(product.id ?? '', 'decline')}
                                disabled={loading}
                                className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                                title="Decline Product"
                              >
                                <XCircle className="w-4 h-4 text-red-400" />
                              </motion.button>
                            </>
                          )}
                          {product.status === 'inactive' && product.status !== 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleProductAction(product.id ?? '', 'activate')}
                              disabled={loading}
                              className="p-2 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30"
                              title="Activate Product"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </motion.button>
                          )}
                          {product.status === 'active' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleProductAction(product.id ?? '', 'deactivate')}
                              disabled={loading}
                              className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                              title="Deactivate Product"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </motion.button>
                          )}
                          {product.status === 'draft' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleProductAction(product.id ?? '', 'activate')}
                              disabled={loading}
                              className="p-2 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30"
                              title="Publish Product"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleProductAction(product.id ?? '', 'delete')}
                            disabled={loading}
                            className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Product Preview Modal */}
          <AnimatePresence>
            {showPreviewModal && selectedProduct && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowPreviewModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Product Preview</h2>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPreviewModal(false)}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        <XCircle className="w-6 h-6 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Product Images */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-4">Product Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedProduct?.images?.map((image: string, index: number) => (
                          <div key={index} className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center border border-white/20">
                            <ImageIcon className="w-8 h-8 text-purple-300" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Product Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-purple-200 text-sm">Name</p>
                            <p className="text-white font-semibold">{selectedProduct?.title ?? ''}</p>
                          </div>
                          <div>
                            <p className="text-purple-200 text-sm">Category</p>
                            <p className="text-white">{selectedProduct?.category ?? ''}</p>
                          </div>
                          <div>
                            <p className="text-purple-200 text-sm">Price</p>
                            <p className="text-white font-semibold">{selectedProduct?.price !== undefined ? formatCurrency(selectedProduct.price) : ''}</p>
                          </div>
                          <div>
                            <p className="text-purple-200 text-sm">Stock</p>
                            <p className="text-white">{selectedProduct?.stock ?? ''} units</p>
                          </div>
                          <div>
                            <p className="text-purple-200 text-sm">Tags</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedProduct?.tags?.map((tag: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200">Views</span>
                            <span className="text-white font-semibold">{(selectedProduct as any)?.views !== undefined ? (selectedProduct as any).views.toLocaleString() : ''}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200">Sales</span>
                            <span className="text-white font-semibold">N/A</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200">Rating</span>
                            <span className="text-white font-semibold">{selectedProduct?.rating && selectedProduct.rating > 0 ? `${selectedProduct.rating}/5 (${selectedProduct.reviewCount} reviews)` : 'No reviews'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200">Created</span>
                            <span className="text-white">{selectedProduct?.createdAt ? formatDate(selectedProduct.createdAt) : ''}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200">Updated</span>
                            <span className="text-white">{selectedProduct?.updatedAt ? formatDate(selectedProduct.updatedAt) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                      <p className="text-purple-200 leading-relaxed">{selectedProduct?.description ?? ''}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Create Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-white/20 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Add Product</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <XCircle className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                  <form className="p-6 space-y-4" onSubmit={e => { e.preventDefault(); handleCreateProduct(); }}>
                    <input type="text" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Product Name" value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} required />
                    <input type="text" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} required />
                    <input type="number" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))} required />
                    <input type="number" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: Number(e.target.value) }))} required />
                    <textarea className="w-full p-2 rounded bg-white/10 text-white" placeholder="Description" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} required />
                    {/* Image Upload */}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full p-2 rounded bg-white/10 text-white"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        // Simple local preview, replace with upload logic for Firebase Storage
                        const urls = await Promise.all(files.map(async (file) => {
                          return URL.createObjectURL(file);
                        }));
                        setNewProduct(p => ({ ...p, images: urls }));
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                    {newProduct.images && newProduct.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={`Product ${idx}`} className="w-16 h-16 object-cover rounded" />
                    ))}
                    </div>
                    <input type="text" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Seller ID" value={newProduct.sellerId} onChange={e => setNewProduct(p => ({ ...p, sellerId: e.target.value }))} required />
                    <input type="text" className="w-full p-2 rounded bg-white/10 text-white" placeholder="Seller Name" value={newProduct.sellerName} onChange={e => setNewProduct(p => ({ ...p, sellerName: e.target.value }))} required />
                    <button type="submit" className="w-full py-2 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition">{loading ? 'Creating...' : 'Create Product'}</button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AdminLayout>
    </ThemeProvider>
  )
}