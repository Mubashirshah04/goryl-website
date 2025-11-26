import React from "react";

// Browser Performance API
const performance = typeof window !== 'undefined' ? window.performance : null;
const observer = typeof window !== 'undefined' ? new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log(`🔍 Performance Entry: ${entry.name} - ${entry.duration}ms`);
  });
}) : null;

// Cache management with expiration
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Performance service functions
export const initializePerformance = () => {
  try {
    if (observer) {
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'measure'] });
      console.log("🚀 Performance monitoring initialized");
    }
  } catch (error) {
    console.warn("Performance monitoring not available:", error);
  }
};

export const startTrace = (traceName: string) => {
  if (!performance) {
    console.warn("Performance API not available for trace:", traceName);
    return null;
  }

  try {
    performance.mark(`${traceName}_start`);
    console.log(`🚀 Started trace: ${traceName}`);

    return {
      name: traceName,
      startTime: performance.now(),
      stop: () => stopTrace({ name: traceName, startTime: performance.now() })
    };
  } catch (error) {
    console.warn(`Failed to start trace ${traceName}:`, error);
    return null;
  }
};

export const stopTrace = (traceInstance: any) => {
  if (!performance || !traceInstance) {
    console.warn("Performance API not available or invalid trace");
    return;
  }

  try {
    performance.mark(`${traceInstance.name}_end`);
    performance.measure(
      traceInstance.name,
      `${traceInstance.name}_start`,
      `${traceInstance.name}_end`
    );
    
    const duration = performance.now() - traceInstance.startTime;
    console.log(`🛑 Stopped trace ${traceInstance.name}: ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.warn("Failed to stop trace:", error);
  }
};

export const logPerformanceEvent = (eventName: string, parameters?: any) => {
  if (!performance) return;

  try {
    performance.mark(eventName);
    console.log(`📊 Performance event: ${eventName}`, parameters);
  } catch (error) {
    console.warn("Failed to log performance event:", error);
  }
};

export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80,
) => {
  if (!url) return url;

  try {
    const imageUrl = new URL(url);
    const params = new URLSearchParams(imageUrl.search);

    // Add CloudFront image optimization parameters
    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());
    params.append("quality", quality.toString());
    params.append("format", "webp"); // Use WebP when supported

    imageUrl.search = params.toString();
    return imageUrl.toString();
  } catch (error) {
    return url; // Return original URL if parsing fails
  }
};

export const getOptimizedVideoUrl = (
  url: string,
  quality: "low" | "medium" | "high" = "medium",
) => {
  if (!url) return url;

  try {
    const videoUrl = new URL(url);
    const params = new URLSearchParams(videoUrl.search);

    // Add CloudFront video optimization parameters
    switch (quality) {
      case "low":
        params.append("quality", "30");
        break;
      case "medium":
        params.append("quality", "60");
        break;
      case "high":
        params.append("quality", "80");
        break;
    }

    videoUrl.search = params.toString();
    return videoUrl.toString();
  } catch (error) {
    return url; // Return original URL if parsing fails
  }
};

export const optimizeQuery = (query: any, limit: number = 20) => {
  return query.limit(limit);
};

export const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const clearCache = () => {
  cache.clear();
};

export const preloadCriticalResources = async () => {
  if (typeof window === 'undefined') return;

  const criticalImages = ["/placeholder-product.jpg", "/logo.png"];

  criticalImages.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  });
};

export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
) => {
  if (typeof window === 'undefined') return null;
  
  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
  });
};

export const loadComponentLazy = (importFn: () => Promise<any>) => {
  return React.lazy(importFn);
};

export const getPerformanceMetrics = () => {
  if (!performance) return null;

  return {
    navigationTiming: performance.getEntriesByType('navigation')[0],
    resourceTiming: performance.getEntriesByType('resource'),
    paintTiming: performance.getEntriesByType('paint'),
  };
};

// Create and export performanceService object
const performanceService = {
  initializePerformance,
  startTrace,
  stopTrace,
  logPerformanceEvent,
  getOptimizedImageUrl,
  getOptimizedVideoUrl,
  optimizeQuery,
  getCachedData,
  setCachedData,
  clearCache,
  preloadCriticalResources,
  createIntersectionObserver,
  loadComponentLazy,
  getPerformanceMetrics,
};

export default performanceService;
