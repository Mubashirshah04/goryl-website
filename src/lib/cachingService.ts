/**
 * Advanced Caching Service
 *
 * This service provides multi-level caching for instant data loading,
 * similar to how YouTube/Facebook delivers content:
 *
 * 1. Memory cache (fastest, but cleared on refresh)
 * 2. IndexedDB cache (persistent browser storage, survives refreshes)
 * 3. LocalStorage cache (fallback for older browsers)
 * 4. Session-level prefetching for anticipated data
 *
 * Features:
 * - Time-based cache expiration
 * - Background cache refresh
 * - Cache versioning
 * - Automatic cache invalidation
 * - Cache analytics for optimization
 * - Cache preloading on app init
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the database schema
interface CacheDB extends DBSchema {
  "cache-items": {
    key: string;
    value: {
      data: any;
      timestamp: number;
      version: number;
      ttl: number;
    };
    indexes: { "by-timestamp": number };
  };
  "cache-metadata": {
    key: string;
    value: {
      lastCleanup: number;
      cacheHits: number;
      cacheMisses: number;
      size: number;
    };
  };
}

type CacheOptions = {
  ttl?: number; // Time to live in milliseconds
  version?: number; // Cache version, incremented when data structure changes
  background?: boolean; // Whether to refresh cache in background
  priority?: "high" | "medium" | "low"; // Priority for prefetching
  forceRefresh?: boolean; // Force refresh from source
};

// Default cache options
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 60 * 1000, // 1 minute (reduced from 5 minutes)
  version: 1,
  background: false,
  priority: "medium",
  forceRefresh: false,
};

// Cache regions for different data types
export enum CacheRegion {
  PRODUCTS = "products",
  PROFILES = "profiles",
  FEEDS = "feeds",
  SETTINGS = "settings",
  RECOMMENDATIONS = "recommendations",
  ANALYTICS = "analytics",
  NOTIFICATIONS = "notifications",
}

class CachingService {
  private static instance: CachingService;
  private db: IDBPDatabase<CacheDB> | null = null;
  private isInitialized = false;
  private memoryCache = new Map<string, any>();
  private pendingWrites = new Map<string, Promise<void>>();
  private backgroundRefreshQueue: Set<string> = new Set();
  private statistics = {
    hits: 0,
    misses: 0,
    errors: 0,
    stale: 0,
    prefetches: 0,
  };

  // Debug mode for development
  private debugMode = process.env.NODE_ENV === "development";

  /**
   * Get the singleton instance
   */
  public static getInstance(): CachingService {
    if (!CachingService.instance) {
      CachingService.instance = new CachingService();
    }
    return CachingService.instance;
  }

  /**
   * Initialize the caching service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      this.logDebug("IndexedDB not available, skipping cache initialization");
      return;
    }

    try {
      // Open IndexedDB
      this.db = await openDB<CacheDB>("zaillisy-cache", 1, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains("cache-items")) {
            const store = db.createObjectStore("cache-items");
            store.createIndex("by-timestamp", "timestamp");
          }
          if (!db.objectStoreNames.contains("cache-metadata")) {
            db.createObjectStore("cache-metadata");
          }
        },
      });

      this.isInitialized = true;
      this.logDebug("Cache service initialized");

      // Schedule a cleanup
      this.scheduleCleanup();

      // Preload critical data
      this.preloadCriticalData();
    } catch (error) {
      console.error("Failed to initialize cache service:", error);
      // Continue without IndexedDB - will fall back to memory and localStorage
      this.isInitialized = true;
    }
  }

  /**
   * Get an item from cache
   * @param region Cache region (e.g., 'products', 'profiles')
   * @param key The cache key
   * @param fetcher Function to fetch data if not in cache
   * @param options Cache options
   */
  public async get<T>(
    region: CacheRegion | string,
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Special handling for profile data - always fetch fresh data
    if (region === CacheRegion.PROFILES) {
      this.logDebug(`⚠️ Bypassing cache for profile data: ${key}`);
      return this.fetchAndCache(`${region}:${key}`, fetcher, {
        ...options,
        forceRefresh: true,
      });
    }

    const fullKey = `${region}:${key}`;
    const mergedOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };

    // Force refresh if requested
    if (mergedOptions.forceRefresh) {
      return this.fetchAndCache(fullKey, fetcher, mergedOptions);
    }

    // Check memory cache first (fastest)
    if (this.memoryCache.has(fullKey)) {
      const cacheItem = this.memoryCache.get(fullKey);
      const isExpired = Date.now() - cacheItem.timestamp > mergedOptions.ttl!;

      if (!isExpired) {
        this.statistics.hits++;
        this.logDebug(`✅ Memory cache hit for ${fullKey}`);

        // Schedule background refresh if getting close to expiry
        if (
          mergedOptions.background &&
          Date.now() - cacheItem.timestamp > mergedOptions.ttl! * 0.8
        ) {
          this.backgroundRefresh(fullKey, fetcher, mergedOptions);
        }

        return cacheItem.data;
      }

      this.statistics.stale++;
      this.logDebug(`⚠️ Stale memory cache for ${fullKey}`);
    }

    // Check IndexedDB if available
    if (this.db) {
      try {
        const cacheItem = await this.db.get("cache-items", fullKey);
        if (
          cacheItem &&
          cacheItem.version === mergedOptions.version &&
          Date.now() - cacheItem.timestamp < cacheItem.ttl
        ) {
          // Store in memory cache for faster access next time
          this.memoryCache.set(fullKey, cacheItem);

          this.statistics.hits++;
          this.logDebug(`✅ IndexedDB cache hit for ${fullKey}`);

          // Schedule background refresh if getting close to expiry
          if (
            mergedOptions.background &&
            Date.now() - cacheItem.timestamp > cacheItem.ttl * 0.8
          ) {
            this.backgroundRefresh(fullKey, fetcher, mergedOptions);
          }

          return cacheItem.data;
        }
      } catch (error) {
        this.statistics.errors++;
        this.logDebug(`❌ IndexedDB error for ${fullKey}:`, error);
      }
    }

    // Check localStorage as fallback
    try {
      const lsKey = `zaillisy_cache_${fullKey}`;
      const lsData = localStorage.getItem(lsKey);
      const lsTimestamp = localStorage.getItem(`${lsKey}_timestamp`);
      const lsVersion = localStorage.getItem(`${lsKey}_version`);

      if (lsData && lsTimestamp && lsVersion) {
        const timestamp = parseInt(lsTimestamp);
        const version = parseInt(lsVersion);

        if (
          version === mergedOptions.version &&
          Date.now() - timestamp < mergedOptions.ttl!
        ) {
          try {
            const data = JSON.parse(lsData);

            // Store in memory cache for faster access
            this.memoryCache.set(fullKey, {
              data,
              timestamp,
              version,
              ttl: mergedOptions.ttl,
            });

            this.statistics.hits++;
            this.logDebug(`✅ LocalStorage cache hit for ${fullKey}`);

            // Schedule background refresh if getting close to expiry
            if (
              mergedOptions.background &&
              Date.now() - timestamp > mergedOptions.ttl! * 0.8
            ) {
              this.backgroundRefresh(fullKey, fetcher, mergedOptions);
            }

            return data;
          } catch (e) {
            // JSON parsing error, ignore
          }
        }
      }
    } catch (error) {
      // LocalStorage error, ignore
    }

    // Cache miss - fetch fresh data
    this.statistics.misses++;
    this.logDebug(`⛔ Cache miss for ${fullKey}`);

    return this.fetchAndCache(fullKey, fetcher, mergedOptions);
  }

  /**
   * Set an item in cache directly
   * @param region Cache region
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   */
  public async set(
    region: CacheRegion | string,
    key: string,
    data: any,
    options: CacheOptions = {},
  ): Promise<void> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    const fullKey = `${region}:${key}`;
    const mergedOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };

    const cacheItem = {
      data,
      timestamp: Date.now(),
      version: mergedOptions.version!,
      ttl: mergedOptions.ttl!,
    };

    // Update memory cache
    this.memoryCache.set(fullKey, cacheItem);

    // Check if there's a pending write for this key
    const existingWrite = this.pendingWrites.get(fullKey);
    if (existingWrite) {
      // Wait for the existing write to complete
      await existingWrite;
    }

    // Create a new promise for this write
    const writePromise = this.performWrite(fullKey, cacheItem);
    this.pendingWrites.set(fullKey, writePromise);

    try {
      await writePromise;
    } finally {
      // Remove from pending writes
      if (this.pendingWrites.get(fullKey) === writePromise) {
        this.pendingWrites.delete(fullKey);
      }
    }
  }

  /**
   * Perform the actual cache write operations
   */
  private async performWrite(fullKey: string, cacheItem: any): Promise<void> {
    // Write to IndexedDB if available
    if (this.db) {
      try {
        await this.db.put("cache-items", cacheItem, fullKey);
      } catch (error) {
        this.logDebug(`❌ IndexedDB write error for ${fullKey}:`, error);
      }
    }

    // Write to localStorage as fallback
    try {
      const lsKey = `zaillisy_cache_${fullKey}`;
      localStorage.setItem(lsKey, JSON.stringify(cacheItem.data));
      localStorage.setItem(
        `${lsKey}_timestamp`,
        cacheItem.timestamp.toString(),
      );
      localStorage.setItem(`${lsKey}_version`, cacheItem.version.toString());
    } catch (error) {
      // LocalStorage might be full or disabled, ignore
    }
  }

  /**
   * Remove an item from cache
   * @param region Cache region
   * @param key Cache key
   */
  public async remove(
    region: CacheRegion | string,
    key: string,
  ): Promise<void> {
    const fullKey = `${region}:${key}`;

    // Remove from memory cache
    this.memoryCache.delete(fullKey);

    // Remove from IndexedDB
    if (this.db) {
      try {
        await this.db.delete("cache-items", fullKey);
      } catch (error) {
        this.logDebug(`❌ IndexedDB delete error for ${fullKey}:`, error);
      }
    }

    // Remove from localStorage
    try {
      const lsKey = `zaillisy_cache_${fullKey}`;
      localStorage.removeItem(lsKey);
      localStorage.removeItem(`${lsKey}_timestamp`);
      localStorage.removeItem(`${lsKey}_version`);
    } catch (error) {
      // LocalStorage error, ignore
    }
  }

  /**
   * Clear all items in a specific cache region
   * @param region Cache region to clear
   */
  public async clearRegion(region: CacheRegion | string): Promise<void> {
    // For profiles, always clear aggressively
    if (region === CacheRegion.PROFILES) {
      this.logDebug(`🧹 Aggressively clearing all profile cache data`);

      // Clear all profile data from memory
      for (const key of this.memoryCache.keys()) {
        if (
          key.includes("profile") ||
          key.includes("user") ||
          key.startsWith(`${CacheRegion.PROFILES}:`)
        ) {
          this.memoryCache.delete(key);
        }
      }
    }

    const prefix = `${region}:`;

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from IndexedDB
    if (this.db) {
      try {
        const keys = await this.db.getAllKeys("cache-items");
        const regionKeys = keys.filter(
          (key) => typeof key === "string" && key.startsWith(prefix),
        );

        for (const key of regionKeys) {
          await this.db.delete("cache-items", key);
        }
      } catch (error) {
        this.logDebug(`❌ IndexedDB region clear error for ${region}:`, error);
      }
    }

    // Clear from localStorage
    try {
      const lsPrefix = `zaillisy_cache_${prefix}`;
      const toRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(lsPrefix)) {
          toRemove.push(key);
        }
      }

      for (const key of toRemove) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
        localStorage.removeItem(`${key}_version`);
      }
    } catch (error) {
      // LocalStorage error, ignore
    }
  }

  /**
   * Clear all cache
   */
  public async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.db) {
      try {
        await this.db.clear("cache-items");
      } catch (error) {
        this.logDebug("❌ IndexedDB clear error:", error);
      }
    }

    // Clear localStorage cache items
    try {
      const prefix = "zaillisy_cache_";
      const toRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          toRemove.push(key);
        }
      }

      for (const key of toRemove) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
        localStorage.removeItem(`${key}_version`);
      }
    } catch (error) {
      // LocalStorage error, ignore
    }
  }

  /**
   * Preload data into the cache
   * @param items Items to preload
   */
  public async preload(
    items: Array<{
      region: CacheRegion | string;
      key: string;
      fetcher: () => Promise<any>;
      options?: CacheOptions;
    }>,
  ): Promise<void> {
    this.statistics.prefetches += items.length;

    // Sort by priority
    const sorted = [...items].sort((a, b) => {
      const priorityA = a.options?.priority || "medium";
      const priorityB = b.options?.priority || "medium";

      const priorityMap: Record<string, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return priorityMap[priorityA] - priorityMap[priorityB];
    });

    // Fetch in batches to avoid overwhelming the network
    const batchSize = 5;
    for (let i = 0; i < sorted.length; i += batchSize) {
      const batch = sorted.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          const fullKey = `${item.region}:${item.key}`;
          this.logDebug(`🔄 Preloading ${fullKey}`);

          try {
            await this.get(item.region, item.key, item.fetcher, {
              ...(item.options || {}),
              forceRefresh: true,
            });
          } catch (error) {
            this.logDebug(`❌ Preload error for ${fullKey}:`, error);
          }
        }),
      );
    }
  }

  /**
   * Get cache statistics
   */
  public getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.memoryCache.size,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): string {
    const total = this.statistics.hits + this.statistics.misses;
    if (total === 0) return "0%";
    return `${((this.statistics.hits / total) * 100).toFixed(2)}%`;
  }

  /**
   * Perform a background refresh of cache item
   */
  private backgroundRefresh<T>(
    fullKey: string,
    fetcher: () => Promise<T>,
    options: CacheOptions,
  ): void {
    // Skip background refresh for profiles to prevent caching issues
    if (fullKey.startsWith(`${CacheRegion.PROFILES}:`)) {
      this.logDebug(
        `⚠️ Skipping background refresh for profile data: ${fullKey}`,
      );
      return;
    }

    // Prevent multiple refreshes of the same item
    if (this.backgroundRefreshQueue.has(fullKey)) return;

    this.backgroundRefreshQueue.add(fullKey);
    this.logDebug(`🔄 Background refresh started for ${fullKey}`);

    // Perform fetch in background
    fetcher()
      .then((data) => {
        this.set(
          fullKey.split(":")[0] as CacheRegion,
          fullKey.split(":")[1],
          data,
          options,
        );
        this.logDebug(`✅ Background refresh completed for ${fullKey}`);
      })
      .catch((error) => {
        this.logDebug(`❌ Background refresh failed for ${fullKey}:`, error);
      })
      .finally(() => {
        this.backgroundRefreshQueue.delete(fullKey);
      });
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(
    fullKey: string,
    fetcher: () => Promise<T>,
    options: CacheOptions,
  ): Promise<T> {
    try {
      this.logDebug(`🔄 Fetching fresh data for ${fullKey}`);
      const data = await fetcher();

      // Split the key back into region and key
      const [region, key] = fullKey.split(":");

      // For profiles, don't cache or use very short TTL
      if (region === CacheRegion.PROFILES) {
        if (key.includes(":")) {
          this.logDebug(
            `⚠️ Not caching profile data: ${key} due to potential ID issues`,
          );
          return data;
        }

        // Very short TTL for profile data (10 seconds)
        options = { ...options, ttl: 10 * 1000 };
        this.logDebug(`⏱️ Using short TTL (10s) for profile data: ${key}`);
      }

      // Cache the result
      await this.set(region, key, data, options);

      return data;
    } catch (error) {
      this.statistics.errors++;
      this.logDebug(`❌ Fetch error for ${fullKey}:`, error);
      throw error;
    }
  }

  /**
   * Schedule a cache cleanup
   */
  private scheduleCleanup(): void {
    // Run cleanup every 10 minutes
    setInterval(() => this.performCleanup(), 10 * 60 * 1000);
  }

  /**
   * Perform cache cleanup
   */
  private async performCleanup(): Promise<void> {
    if (!this.db) return;

    try {
      // Get the last cleanup time
      const metadata = await this.db.get("cache-metadata", "cleanup");
      const now = Date.now();

      // If we cleaned up less than an hour ago, skip
      if (metadata && now - metadata.lastCleanup < 60 * 60 * 1000) {
        return;
      }

      this.logDebug("🧹 Starting cache cleanup");

      // Get all expired items
      const tx = this.db.transaction("cache-items", "readwrite");
      const index = tx.store.index("by-timestamp");
      const cursor = await index.openCursor();

      let deletedCount = 0;

      if (cursor) {
        do {
          const item = cursor.value;
          if (now - item.timestamp > item.ttl) {
            // Also remove from memory cache
            const key = cursor.key.toString();
            this.memoryCache.delete(key);
            await cursor.delete();
            deletedCount++;
          }
        } while (await cursor.continue());
      }

      // Update metadata
      await this.db.put(
        "cache-metadata",
        {
          lastCleanup: now,
          deletedCount,
        },
        "cleanup",
      );

      this.logDebug(
        `🧹 Cache cleanup complete. Deleted ${deletedCount} items.`,
      );
    } catch (error) {
      this.logDebug("❌ Cleanup error:", error);
    }
  }

  /**
   * Preload critical data for instant app start
   */
  private async preloadCriticalData(): Promise<void> {
    // This would be implemented based on app-specific requirements
    this.logDebug("🚀 Preloading critical data");

    // Preload only non-user-specific data
    try {
      // Preload app settings - these rarely change
      await this.get(
        CacheRegion.SETTINGS,
        "app-config",
        async () => {
          try {
            const response = await fetch("/api/config");
            if (response.ok) return response.json();
            return {};
          } catch (e) {
            return {};
          }
        },
        { priority: "high", ttl: 5 * 60 * 1000 }, // Settings can be cached longer
      );

      // Skip preloading profiles - always fetch those fresh
      this.logDebug("⚠️ Skipping profile preloading to avoid caching issues");
    } catch (error) {
      this.logDebug("❌ Error preloading critical data:", error);
    }
  }

  /**
   * Log debug message if in debug mode
   */
  private logDebug(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`🔷 Cache: ${message}`, ...args);
    }
  }

  // -- Public utility methods --

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Check if an item exists in cache
   */
  public async exists(
    region: CacheRegion | string,
    key: string,
  ): Promise<boolean> {
    // For profiles, always return false to force fresh data
    if (region === CacheRegion.PROFILES) {
      this.logDebug(`⚠️ Forcing cache miss for profile: ${key}`);
      return false;
    }

    const fullKey = `${region}:${key}`;

    // Check memory first
    if (this.memoryCache.has(fullKey)) {
      const item = this.memoryCache.get(fullKey);
      // Check if item is expired
      if (item && Date.now() - item.timestamp > item.ttl) {
        this.logDebug(`⏱️ Cache item expired: ${fullKey}`);
        return false;
      }
      return true;
    }

    // For other data types, check IndexedDB
    if (this.db) {
      try {
        const item = await this.db.get("cache-items", fullKey);
        if (item && Date.now() - item.timestamp > item.ttl) {
          this.logDebug(`⏱️ IndexedDB item expired: ${fullKey}`);
          return false;
        }
        return item !== undefined;
      } catch (error) {
        // Fall through to localStorage check
      }
    }

    // Check localStorage
    try {
      const data = localStorage.getItem(`zaillisy_cache_${fullKey}`);
      const timestamp = localStorage.getItem(
        `zaillisy_cache_${fullKey}_timestamp`,
      );
      if (data && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age > DEFAULT_CACHE_OPTIONS.ttl) {
          this.logDebug(`⏱️ LocalStorage item expired: ${fullKey}`);
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache status
   */
  public async getCacheStatus(): Promise<{
    available: boolean;
    size: number;
    indexed: boolean;
    localStorage: boolean;
    memorySize: number;
  }> {
    let indexedDB = false;
    let localStorage = false;
    let size = 0;

    // Check IndexedDB
    if (this.db) {
      try {
        const count = await this.db.count("cache-items");
        indexedDB = true;
        size += count;
      } catch (error) {
        // IndexedDB not available
      }
    }

    // Check localStorage
    try {
      const prefix = "zaillisy_cache_";
      let lsCount = 0;

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          key.startsWith(prefix) &&
          !key.endsWith("_timestamp") &&
          !key.endsWith("_version")
        ) {
          lsCount++;
        }
      }

      localStorage = true;
      size += lsCount;
    } catch (error) {
      // LocalStorage not available
    }

    return {
      available: indexedDB || localStorage,
      size,
      indexed: indexedDB,
      localStorage,
      memorySize: this.memoryCache.size,
    };
  }
}

// Export the singleton instance
const cachingService = CachingService.getInstance();
export default cachingService;
