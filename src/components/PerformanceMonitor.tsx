'use client';

import { useEffect, useState } from 'react';
import { performanceService } from '@/lib/performanceService';
import { cloudflareService } from '@/lib/cloudflareService';
import { optimizedProductService } from '@/lib/optimizedProductService';

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  imageOptimizations: number;
  networkRequests: number;
  memoryUsage: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const cacheStats = cloudflareService.getCacheStats();
      const productCacheStats = optimizedProductService.getCacheStats();
      
      const newMetrics: PerformanceMetrics = {
        loadTime: perfData ? perfData.loadEventEnd - perfData.loadEventStart : 0,
        cacheHitRate: cacheStats.size > 0 ? (cacheStats.size / (cacheStats.size + 10)) * 100 : 0,
        imageOptimizations: productCacheStats.size,
        networkRequests: performance.getEntriesByType('resource').length,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      };
      
      setMetrics(newMetrics);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  if (!metrics || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Metrics"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={metrics.loadTime < 1000 ? 'text-green-600' : 'text-red-600'}>
            {metrics.loadTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className={metrics.cacheHitRate > 70 ? 'text-green-600' : 'text-yellow-600'}>
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Images Cached:</span>
          <span className="text-blue-600">{metrics.imageOptimizations}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Network Requests:</span>
          <span className="text-purple-600">{metrics.networkRequests}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className="text-orange-600">
            {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={() => {
            cloudflareService.clearCache();
            optimizedProductService.clearCache();
            window.location.reload();
          }}
          className="w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
        >
          Clear Cache & Reload
        </button>
      </div>
    </div>
  );
}
