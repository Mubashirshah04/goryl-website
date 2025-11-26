// YouTube-Level Performance Hook - Complete optimization
import { useState, useEffect, useCallback, useMemo } from 'react';
import youtubeLevelPerformanceService from '@/lib/youtubeLevelPerformanceService';
import realtimeDataService, { RealtimeStats, ProductRealtimeData } from '@/lib/realtimeDataService';
import algorithmOptimizationService, { ProductRecommendation } from '@/lib/algorithmOptimizationService';

interface PerformanceData {
  metrics: {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  realtime: RealtimeStats;
  recommendations: ProductRecommendation[];
  isOptimized: boolean;
}

export function useYouTubeLevelPerformance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    metrics: {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    },
    realtime: {
      onlineUsers: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      liveStreams: 0,
      timestamp: Date.now()
    },
    recommendations: [],
    isOptimized: false
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize performance monitoring
  useEffect(() => {
    const initializePerformance = async () => {
      try {
        setIsLoading(true);

        // Get initial metrics
        const metrics = youtubeLevelPerformanceService.getMetrics();
        
        // Get realtime data
        const realtime = realtimeDataService.getStats();
        
        // Get recommendations
        const recommendations = algorithmOptimizationService.getRecommendations('current-user', 10);

        setPerformanceData({
          metrics,
          realtime,
          recommendations,
          isOptimized: true
        });

        console.log('🚀 YouTube-level performance initialized');
      } catch (error) {
        console.error('Failed to initialize performance:', error);
      } finally {
        setIsLoading(false);
        setPerformanceData(prev => ({ ...prev, isOptimized: true }));
      }
    };

    initializePerformance();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribeStats = realtimeDataService.subscribe('stats', (stats: RealtimeStats) => {
      setPerformanceData(prev => ({
        ...prev,
        realtime: stats
      }));
    });

    const unsubscribeProducts = realtimeDataService.subscribe('product', (products: ProductRealtimeData[]) => {
      // Update recommendations when product data changes
      const recommendations = algorithmOptimizationService.getRecommendations('current-user', 10);
      setPerformanceData(prev => ({
        ...prev,
        recommendations
      }));
    });

    return () => {
      unsubscribeStats();
      unsubscribeProducts();
    };
  }, []);

  // Optimize performance
  const optimizePerformance = useCallback(() => {
    console.log('🔧 Optimizing performance...');
    
    // Clear cache
    youtubeLevelPerformanceService.clearCache();
    
    // Prefetch critical resources
    youtubeLevelPerformanceService.preloadCriticalResources();
    
    // Update metrics
    const metrics = youtubeLevelPerformanceService.getMetrics();
    setPerformanceData(prev => ({
      ...prev,
      metrics
    }));
    
    console.log('✅ Performance optimized');
  }, []);

  // Track user interaction
  const trackInteraction = useCallback((productId: string, interaction: 'view' | 'like' | 'share' | 'purchase') => {
    // Track in algorithm service
    algorithmOptimizationService.trackInteraction('current-user', productId, interaction);
    
    // Track in realtime service
    realtimeDataService.trackProductInteraction(productId, interaction);
    
    // Update recommendations
    const recommendations = algorithmOptimizationService.getRecommendations('current-user', 10);
    setPerformanceData(prev => ({
      ...prev,
      recommendations
    }));
  }, []);

  // Prefetch route
  const prefetchRoute = useCallback((path: string) => {
    youtubeLevelPerformanceService.prefetchRoute(path);
  }, []);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    return youtubeLevelPerformanceService.getMetrics();
  }, []);

  // Get realtime data
  const getRealtimeData = useCallback((type: string) => {
    return realtimeDataService.getRealtimeData(type);
  }, []);

  // Get recommendations
  const getRecommendations = useCallback((limit: number = 10) => {
    return algorithmOptimizationService.getRecommendations('current-user', limit);
  }, []);

  // Check if optimized
  const isOptimized = useMemo(() => {
    return performanceData.isOptimized && 
           performanceData.metrics.cacheHitRate > 0.8 &&
           performanceData.metrics.loadTime < 1000;
  }, [performanceData]);

  // Performance score (0-100)
  const performanceScore = useMemo(() => {
    const metrics = performanceData.metrics;
    let score = 0;
    
    // Load time score (40 points)
    if (metrics.loadTime < 500) score += 40;
    else if (metrics.loadTime < 1000) score += 30;
    else if (metrics.loadTime < 2000) score += 20;
    else score += 10;
    
    // Cache hit rate score (30 points)
    score += metrics.cacheHitRate * 30;
    
    // Memory usage score (20 points)
    if (metrics.memoryUsage < 0.5) score += 20;
    else if (metrics.memoryUsage < 0.7) score += 15;
    else if (metrics.memoryUsage < 0.9) score += 10;
    else score += 5;
    
    // Interaction time score (10 points)
    if (metrics.interactionTime < 100) score += 10;
    else if (metrics.interactionTime < 200) score += 8;
    else if (metrics.interactionTime < 500) score += 5;
    else score += 2;
    
    return Math.min(Math.round(score), 100);
  }, [performanceData.metrics]);

  return {
    performanceData,
    isLoading,
    isOptimized,
    performanceScore,
    optimizePerformance,
    trackInteraction,
    prefetchRoute,
    getMetrics,
    getRealtimeData,
    getRecommendations
  };
}

// Hook for realtime data only
export function useRealtimeData() {
  const [realtimeData, setRealtimeData] = useState<RealtimeStats>({
    onlineUsers: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    liveStreams: 0,
    timestamp: Date.now()
  });

  useEffect(() => {
    const unsubscribe = realtimeDataService.subscribe('stats', (stats: RealtimeStats) => {
      setRealtimeData(stats);
    });

    return unsubscribe;
  }, []);

  return realtimeData;
}

// Hook for recommendations only
export function useRecommendations(limit: number = 10) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);

  useEffect(() => {
    const recs = algorithmOptimizationService.getRecommendations('current-user', limit);
    setRecommendations(recs);
  }, [limit]);

  const refreshRecommendations = useCallback(() => {
    const recs = algorithmOptimizationService.getRecommendations('current-user', limit);
    setRecommendations(recs);
  }, [limit]);

  return {
    recommendations,
    refreshRecommendations
  };
}

// Hook for performance metrics only
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = youtubeLevelPerformanceService.getMetrics();
      setMetrics(newMetrics);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
