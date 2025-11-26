"use client";

import { useEffect, useState } from "react";
import performanceService from "@/lib/performanceService";
import cloudflareService from "@/lib/cloudflareService";
import optimizedProductService from "@/lib/optimizedProductService";
import { bootstrapApplication } from "@/lib/appBootstrap";
import cachingService, { CacheRegion } from "@/lib/cachingService";
import safePerformance from "@/lib/safePerformance";

export default function PerformanceInitializer() {
  const [cacheCleared, setCacheCleared] = useState(false);

  // First effect to clear cache on startup
  useEffect(() => {
    const clearCacheOnStartup = async () => {
      try {
        // Clear all profile cache to prevent stale data issues
        await cachingService.clearRegion(CacheRegion.PROFILES);
        console.log("🧹 Cleared profile cache on startup");
        setCacheCleared(true);
      } catch (error) {
        console.error("Failed to clear cache:", error);
        setCacheCleared(true); // Continue anyway
      }
    };

    clearCacheOnStartup();
  }, []);

  // Second effect for performance initialization (runs after cache clearing)
  useEffect(() => {
    if (!cacheCleared) return; // Wait for cache to be cleared

    const initializePerformance = async () => {
      try {
        console.time("app-initialization");
        // Initialize advanced caching system first
        await cachingService.initialize();

        // Initialize performance monitoring with safer implementation
        safePerformance.initialize();

        // Bootstrap application with reduced caching
        // This runs many operations in parallel and continues in the background
        bootstrapApplication({
          preloadProducts: true,
          preloadCategories: true,
          preloadSettings: true,
          warmupConnections: true,
          preloadAssets: true,
          reducedCaching: true, // New option to reduce caching
        });

        // Add Cloudflare resource hints
        cloudflareService.addResourceHints();

        // Service Worker disabled - causing network errors
        // Unregister any existing service workers
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
              registration.unregister();
              console.log("🗑️ Service Worker unregistered");
            });
          });
        }

        // Preload ONLY essential data - avoid excessive caching
        cachingService.preload([
          {
            region: CacheRegion.SETTINGS,
            key: "app-config",
            fetcher: () =>
              fetch("/api/config")
                .then((r) => r.json())
                .catch(() => ({})),
            options: {
              priority: "high",
              ttl: 30 * 1000, // 30 seconds only
            },
          },
          // Only preload a few featured products with short TTL
          {
            region: CacheRegion.PRODUCTS,
            key: "featured-products",
            fetcher: () =>
              optimizedProductService.getOptimizedProducts(
                { status: "active" },
                "views",
                "desc",
                5, // Reduced from 10
              ),
            options: {
              priority: "high",
              ttl: 20 * 1000, // 20 seconds only
            },
          },
        ]);

        // Log performance metrics with safer implementation
        safePerformance.logEvent("app_initialized", {
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          connection: (navigator as any).connection?.effectiveType || "unknown",
          cache_status: await cachingService.getCacheStatus(),
        });

        console.timeEnd("app-initialization");
        console.log("🚀 Ultra-fast loading optimizations initialized");
      } catch (error) {
        console.error("Failed to initialize performance optimizations:", error);
      }
    };

    // Initialize immediately
    initializePerformance();

    // Return cleanup function
    return () => {
      // Clean up any ongoing preloads or cache operations
      console.log("🧹 Cleaning up performance initializer");
    };
  }, [cacheCleared]); // Only run after cache is cleared

  // Add an interval to periodically clear profile cache
  useEffect(() => {
    // Clear profile cache every 5 minutes to prevent stale data
    const intervalId = setInterval(
      async () => {
        try {
          await cachingService.clearRegion(CacheRegion.PROFILES);
          console.log("🧹 Cleared profile cache on interval");
        } catch (error) {
          console.error("Failed to clear cache on interval:", error);
        }
      },
      5 * 60 * 1000,
    );

    return () => {
      clearInterval(intervalId);

      // Clean up any active traces when component unmounts
      safePerformance.clearAllTraces();
    };
  }, []);

  return null; // This component doesn't render anything
}
