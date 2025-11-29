'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Eye, Heart, ShoppingCart, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!productId) {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch product analytics from API
        const response = await fetch(`/api/products/${productId}/analytics`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Fallback: show placeholder analytics
          setAnalytics({
            productId,
            views: 0,
            likes: 0,
            purchases: 0,
            revenue: 0,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics({
          productId,
          views: 0,
          likes: 0,
          purchases: 0,
          revenue: 0,
          lastUpdated: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [productId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Product Analytics</h1>
              <p className="text-sm text-muted-foreground">Product ID: {productId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analytics ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Views Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Views</h3>
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.views || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Total product views</p>
            </div>

            {/* Likes Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Likes</h3>
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.likes || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Total likes</p>
            </div>

            {/* Purchases Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Purchases</h3>
                <ShoppingCart className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.purchases || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Total purchases</p>
            </div>

            {/* Revenue Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">${(analytics.revenue || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Total revenue</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
