'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Star, Download, RefreshCw, Activity, Smartphone, Monitor, Tablet, MapPin, Award } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
export default function AnalyticsPage() {
    const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
    const [loading, setLoading] = useState(false);
    const refreshData = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Analytics data refreshed');
        }, 1000);
    };
    const exportAnalytics = () => {
        toast.success('Exporting analytics data...');
    };
    return (<AdminLayout title="Analytics" subtitle="Advanced analytics and insights" actions={<div className="flex items-center space-x-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refreshData} disabled={loading} className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
            <span>Refresh</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportAnalytics} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg flex items-center space-x-2">
            <Download className="w-4 h-4"/>
            <span>Export</span>
          </motion.button>
        </div>}>
      <div className="space-y-6">
        {/* Timeframe Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((timeframe) => (<button key={timeframe} onClick={() => setSelectedTimeframe(timeframe)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedTimeframe === timeframe
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}>
                  {timeframe}
                </button>))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Revenue</p>
                <p className="text-3xl font-bold text-white">$124,567</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1"/>
                  <span className="text-green-400 text-sm">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <DollarSign className="w-8 h-8 text-green-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Active Users</p>
                <p className="text-3xl font-bold text-white">2,847</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1"/>
                  <span className="text-green-400 text-sm">+8.3%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Orders</p>
                <p className="text-3xl font-bold text-white">1,234</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1"/>
                  <span className="text-green-400 text-sm">+15.2%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <ShoppingCart className="w-8 h-8 text-purple-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Avg Rating</p>
                <p className="text-3xl font-bold text-white">4.8</p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-400 mr-1"/>
                  <span className="text-yellow-400 text-sm">+0.2</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <Star className="w-8 h-8 text-yellow-400"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Sales Trend</h3>
              <div className="flex items-center space-x-2 text-purple-200">
                <Activity className="w-5 h-5"/>
                <span className="text-sm">Live</span>
              </div>
            </div>
            <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20">
                  <BarChart3 className="w-10 h-10 text-purple-300"/>
                </div>
                <p className="text-purple-200 text-lg">Chart will be implemented with Chart.js or Recharts</p>
                <p className="text-sm text-purple-300 mt-2">Real-time sales data visualization</p>
              </div>
            </div>
          </motion.div>

          {/* User Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">User Activity</h3>
              <div className="flex items-center space-x-2 text-purple-200">
                <Users className="w-5 h-5"/>
                <span className="text-sm">Daily</span>
              </div>
            </div>
            <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20">
                  <TrendingUp className="w-10 h-10 text-blue-300"/>
                </div>
                <p className="text-purple-200 text-lg">Chart will be implemented with Chart.js or Recharts</p>
                <p className="text-sm text-purple-300 mt-2">Daily user activity trends</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Categories & Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Top Categories</h3>
            <div className="space-y-4">
              {[
            { name: 'Electronics', sales: 456, growth: '+12%' },
            { name: 'Fashion', sales: 389, growth: '+8%' },
            { name: 'Home & Garden', sales: 234, growth: '+15%' },
            { name: 'Sports', sales: 198, growth: '+5%' },
            { name: 'Books', sales: 156, growth: '+3%' }
        ].map((category, index) => (<div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{category.name}</p>
                      <p className="text-purple-200 text-sm">{category.sales} sales</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-sm font-medium">{category.growth}</span>
                </div>))}
            </div>
          </motion.div>

          {/* Top Sellers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Top Sellers</h3>
            <div className="space-y-4">
              {[
            { name: 'TechGear Pro', sales: 234, rating: 4.9 },
            { name: 'Fashion Forward', sales: 198, rating: 4.8 },
            { name: 'Home Essentials', sales: 156, rating: 4.7 },
            { name: 'Sports Elite', sales: 134, rating: 4.6 },
            { name: 'Book Haven', sales: 98, rating: 4.5 }
        ].map((seller, index) => (<div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-white"/>
                    </div>
                    <div>
                      <p className="text-white font-medium">{seller.name}</p>
                      <div className="flex items-center space-x-2">
                        <Star className="w-3 h-3 text-yellow-400"/>
                        <span className="text-purple-200 text-sm">{seller.rating}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-white font-semibold">{seller.sales} sales</span>
                </div>))}
            </div>
          </motion.div>
        </div>

        {/* Device & Location Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Analytics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Device Usage</h3>
            <div className="space-y-4">
              {[
            { device: 'Mobile', percentage: 65, icon: Smartphone, color: 'from-blue-500 to-cyan-500' },
            { device: 'Desktop', percentage: 28, icon: Monitor, color: 'from-green-500 to-emerald-500' },
            { device: 'Tablet', percentage: 7, icon: Tablet, color: 'from-purple-500 to-fuchsia-500' }
        ].map((item, index) => (<div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center`}>
                      <item.icon className="w-5 h-5 text-white"/>
                    </div>
                    <span className="text-white font-medium">{item.device}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-white/20 rounded-full h-2">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-white font-semibold">{item.percentage}%</span>
                  </div>
                </div>))}
            </div>
          </motion.div>

          {/* Location Analytics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Top Locations</h3>
            <div className="space-y-4">
              {[
            { location: 'United States', users: 1247, growth: '+15%' },
            { location: 'United Kingdom', users: 892, growth: '+12%' },
            { location: 'Canada', users: 567, growth: '+8%' },
            { location: 'Australia', users: 445, growth: '+10%' },
            { location: 'Germany', users: 334, growth: '+6%' }
        ].map((item, index) => (<div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white"/>
                    </div>
                    <span className="text-white font-medium">{item.location}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{item.users.toLocaleString()}</p>
                    <p className="text-green-400 text-sm">{item.growth}</p>
                  </div>
                </div>))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>);
}
