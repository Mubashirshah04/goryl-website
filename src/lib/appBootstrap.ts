/**
 * Application Bootstrap
 *
 * This module provides application bootstrapping with a focus on
 * instant loading like YouTube/Facebook:
 *
 * 1. Preloading critical resources before they're needed
 * 2. Optimistic rendering with placeholders
 * 3. Parallel data loading
 * 4. Priority-based resource loading
 * 5. Background data prefetching
 *
 * @module appBootstrap
 */

import { CacheRegion } from "./cachingService";
import cachingService from "./cachingService";
import {
  preloadCriticalProducts,
  getOptimizedProducts,
} from "./optimizedProductService";
// ✅ AWS DYNAMODB - Firestore completely removed
// Using AWS services for all data fetching

let bootstrapStarted = false;
let bootstrapCompleted = false;
const startTime = Date.now();

export interface BootstrapOptions {
  /**
   * Whether to preload user data
   */
  preloadUser?: boolean;

  /**
   * Whether to preload popular products
   */
  preloadProducts?: boolean;

  /**
   * Whether to preload popular categories
   */
  preloadCategories?: boolean;

  /**
   * Whether to preload core app settings
   */
  preloadSettings?: boolean;

  /**
   * Whether to warm up API connections
   */
  warmupConnections?: boolean;

  /**
   * Whether to preload media assets like common images
   */
  preloadAssets?: boolean;

  /**
   * Whether to use reduced caching (helps with cache issues)
   */
  reducedCaching?: boolean;
}

/**
 * Bootstrap the application for instant loading
 *
 * Call this as early as possible, ideally in _app.tsx
 */
export async function bootstrapApplication(options: BootstrapOptions = {}) {
  const defaultOptions: BootstrapOptions = {
    preloadUser: true,
    preloadProducts: true,
    preloadCategories: true,
    preloadSettings: true,
    warmupConnections: true,
    preloadAssets: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (bootstrapStarted) {
    console.log("🚀 Bootstrap already started");
    return;
  }

  bootstrapStarted = true;
  console.log("🚀 Starting application bootstrap...");

  // Initialize caching service first
  await cachingService.initialize();

  // Run non-blocking tasks in parallel
  const tasks: Promise<void>[] = [];

  // Preload popular products
  if (mergedOptions.preloadProducts) {
    tasks.push(preloadPopularProducts(mergedOptions.reducedCaching));
  }

  // Preload categories
  if (mergedOptions.preloadCategories) {
    tasks.push(preloadCategories());
  }

  // Preload app settings
  if (mergedOptions.preloadSettings) {
    tasks.push(preloadAppSettings());
  }

  // Preload media assets
  if (mergedOptions.preloadAssets) {
    tasks.push(preloadMediaAssets());
  }

  // Warm up connections
  if (mergedOptions.warmupConnections) {
    tasks.push(warmupConnections());
  }

  // Wait for all tasks to complete in the background
  Promise.all(tasks)
    .then(() => {
      bootstrapCompleted = true;
      const elapsed = Date.now() - startTime;
      console.log(`✅ Bootstrap completed in ${elapsed}ms`);
    })
    .catch((error) => {
      console.error("❌ Bootstrap error:", error);
    });

  // Return immediately - bootstrap continues in the background
  return;
}

/**
 * Check if bootstrap has completed
 */
export function isBootstrapComplete(): boolean {
  return bootstrapCompleted;
}

/**
 * Preload popular products
 */
async function preloadPopularProducts(reducedCaching = false): Promise<void> {
  try {
    console.log("🔄 Preloading popular products...");

    // First preload the most popular products - reduced count if reducedCaching is enabled
    const popularProducts = await getOptimizedProducts(
      { status: "active" }, // Only active products
      "views", // Order by views
      "desc", // Most viewed first
      reducedCaching ? 5 : 10, // Load fewer products when reducing cache
    );

    console.log(`✅ Preloaded ${popularProducts.length} popular products`);

    // If reducing caching, only preload top categories
    const categories = reducedCaching
      ? ["electronics", "fashion"] // Reduced categories
      : ["electronics", "fashion", "home", "beauty"];

    // Preload fewer products for each category
    for (const category of categories) {
      getOptimizedProducts(
        { category, status: "active" },
        "createdAt",
        "desc",
        reducedCaching ? 3 : 10, // Reduced count with reduced caching
      )
        .then((products) => {
          console.log(
            `✅ Preloaded ${products.length} products for category ${category}`,
          );
        })
        .catch((error) => {
          console.error(`❌ Error preloading ${category} products:`, error);
        });
    }

    // Only preload critical products if not reducing caching
    if (!reducedCaching) {
      await preloadCriticalProducts();
    } else {
      console.log(
        "⚠️ Skipping critical products preload due to reduced caching",
      );
    }

    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error preloading products:", error);
    return Promise.resolve(); // Resolve anyway to not block bootstrap
  }
}

/**
 * Preload categories
 */
async function preloadCategories(): Promise<void> {
  try {
    console.log("🔄 Preloading categories...");

    // Try to get from cache first - but with shorter TTL
    const cached = await cachingService.get(
      CacheRegion.SETTINGS,
      "categories",
      async () => {
        // Fetch from AWS DynamoDB if not in cache
        try {
          const categoryService = await import('@/lib/awsCategoryService');
          const getCategories = categoryService.getCategories || categoryService.default?.getCategories;
          if (!getCategories) {
            console.error('getCategories function not found in awsCategoryService');
            return [];
          }
          return await getCategories();
        } catch (error) {
          console.error('Error importing awsCategoryService:', error);
          return [];
        }
      },
      { ttl: 2 * 60 * 1000 }, // 2 minutes cache (reduced from 30 minutes)
    );

    console.log(`✅ Preloaded ${cached.length} categories`);
    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error preloading categories:", error);
    return Promise.resolve(); // Resolve anyway to not block bootstrap
  }
}

/**
 * Preload app settings
 */
async function preloadAppSettings(): Promise<void> {
  try {
    console.log("🔄 Preloading app settings...");

    // Try to get from cache first - with shorter TTL
    // ✅ AWS DYNAMODB - Settings disabled (not critical for bootstrap)
    console.warn('⚠️ App settings preload disabled - AWS implementation pending');
    const settings: any[] = [];

    console.log("✅ Preloaded app settings");
    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error preloading app settings:", error);
    return Promise.resolve(); // Resolve anyway to not block bootstrap
  }
}

/**
 * Preload media assets
 */
async function preloadMediaAssets(): Promise<void> {
  try {
    console.log("🔄 Preloading media assets...");

    // Preload common images
    const commonImages = [
      "/logo.png",
      "/placeholder-product.jpg",
      "/placeholder-profile.jpg",
      "/banner-default.jpg",
    ];

    // Create image elements to preload
    for (const src of commonImages) {
      const img = new Image();
      img.src = src;
    }

    // Preload web fonts (if using any custom fonts)
    // This ensures fonts don't cause layout shifts
    if ("fonts" in document) {
      try {
        await Promise.all([
          document.fonts.load("1em Inter"),
          document.fonts.load("1em Roboto"),
        ]);
      } catch (e) {
        // Ignore font loading errors
      }
    }

    console.log("✅ Preloaded media assets");
    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error preloading media assets:", error);
    return Promise.resolve(); // Resolve anyway to not block bootstrap
  }
}

/**
 * Warm up connections
 */
async function warmupConnections(): Promise<void> {
  try {
    console.log("🔄 Warming up connections...");

    // ✅ AWS DYNAMODB - Connection warmup disabled (AWS auto-manages connections)
    console.log('⚠️ Connection warmup disabled - AWS DynamoDB manages connections automatically');

    console.log("✅ Connections warmed up");
    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error warming up connections:", error);
    return Promise.resolve(); // Resolve anyway to not block bootstrap
  }
}

/**
 * Prefetch data for a specific user
 * Call this as soon as user logs in or is identified
 */
export async function prefetchUserData(userId: string): Promise<void> {
  if (!userId) return;

  console.log("🔄 Prefetching data for user:", userId);

  // ✅ AWS DYNAMODB - User data prefetch disabled (fetched on-demand via awsUserService)
  console.log(`⚠️ User data prefetch disabled - using AWS DynamoDB on-demand fetching for ${userId}`);
}

/**
 * Prefetch data for a specific route
 * Call this when user hovers over a link or when predicting navigation
 */
export async function prefetchRouteData(route: string): Promise<void> {
  console.log("🔄 Prefetching data for route:", route);

  // Match route patterns and prefetch relevant data
  if (route.startsWith("/product/")) {
    const productId = route.split("/").pop();
    if (productId) {
      // ✅ AWS DYNAMODB - Product prefetch disabled (fetched on-demand via API)
      console.log(`⚠️ Product prefetch disabled for ${productId} - using AWS DynamoDB on-demand`);
    }
  } else if (route.startsWith("/profile/")) {
    const userId = route.split("/").pop();
    if (userId) {
      // Prefetch user profile
      prefetchUserData(userId);
    }
  } else if (route.startsWith("/category/")) {
    const category = route.split("/").pop();
    if (category) {
      // Prefetch category products
      getOptimizedProducts(
        { category: category as string, status: "active" },
        "createdAt",
        "desc",
        20,
      );
    }
  }
}

// Export a default object for module usage
export default {
  bootstrapApplication,
  isBootstrapComplete,
  prefetchUserData,
  prefetchRouteData,
  // Add utility function to clear caches
  clearCaches: async () => {
    console.log("🧹 Clearing all application caches");
    try {
      // Always clear profile cache
      await cachingService.clearRegion(CacheRegion.PROFILES);

      // Clear product cache every hour
      const lastClearTime = localStorage.getItem("last_product_cache_clear");
      const now = Date.now();
      if (!lastClearTime || now - parseInt(lastClearTime) > 60 * 60 * 1000) {
        await cachingService.clearRegion(CacheRegion.PRODUCTS);
        localStorage.setItem("last_product_cache_clear", now.toString());
      }

      return true;
    } catch (error) {
      console.error("Failed to clear caches:", error);
      return false;
    }
  },
};
