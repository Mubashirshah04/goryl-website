/**
 * UltraFastLoader - YouTube/TikTok-style instant loading system
 *
 * This system provides extremely fast loading with minimal caching for
 * a super-responsive UX similar to YouTube and TikTok.
 *
 * Features:
 * - Priority-based loading (load what the user sees first)
 * - Progressive enhancement (show content as it loads)
 * - Viewport-aware loading (only load what's visible)
 * - Network-aware optimizations (adapt to network conditions)
 * - Prefetching based on user behavior
 * - Minimized caching to prevent stale data
 */

// Check for browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

// Only import Firebase on client-side
let collection, query, getDocs, getDoc, doc, where, orderBy, limit;
let DocumentData, FirestoreError, Firestore, DocumentReference, QuerySnapshot;
let db;

// Dynamically import Firebase only in browser
if (isBrowser) {
  const firebaseImports = require("@/lib/firestore");
  const dbImport = require("./firebase");

  collection = firebaseImports.collection;
  query = firebaseImports.query;
  getDocs = firebaseImports.getDocs;
  getDoc = firebaseImports.getDoc;
  doc = firebaseImports.doc;
  where = firebaseImports.where;
  orderBy = firebaseImports.orderBy;
  limit = firebaseImports.limit;

  DocumentData = firebaseImports.DocumentData;
  FirestoreError = firebaseImports.FirestoreError;
  Firestore = firebaseImports.Firestore;
  DocumentReference = firebaseImports.DocumentReference;
  QuerySnapshot = firebaseImports.QuerySnapshot;

  db = dbImport.db;
}

// Network condition detection
type NetworkCondition = "fast" | "medium" | "slow" | "offline";

// Content loading priorities
export enum LoadPriority {
  CRITICAL = 0, // Must load immediately (viewport content)
  HIGH = 1, // Load right after critical (just outside viewport)
  MEDIUM = 2, // Load soon after high priority (may scroll to soon)
  LOW = 3, // Load when idle (far from viewport)
  LAZY = 4, // Only load when requested explicitly
}

// Content types that can be loaded
export enum ContentType {
  PROFILE = "profile",
  PRODUCT = "product",
  PRODUCTS_LIST = "products_list",
  FEED = "feed",
  COMMENTS = "comments",
  REVIEWS = "reviews",
  USER_DATA = "user_data",
}

// Interface for the load request object
interface LoadRequest {
  id: string;
  type: ContentType;
  priority: LoadPriority;
  params?: any;
  callback: (data: any) => void;
  errorCallback?: (error: any) => void;
  timeout?: number; // ms before timing out
  retryCount?: number; // number of times to retry on failure
  ttl?: number; // Time to live in ms for temporary cache (default: 0 = no cache)
  forceRefresh?: boolean; // bypass any temporary caching
}

// Loader configuration
interface LoaderConfig {
  maxConcurrent: number;
  defaultTimeout: number;
  enablePrefetching: boolean;
  defaultTTL: number;
  retryOnError: boolean;
  maxRetries: number;
  prefetchThreshold: number; // distance to viewport to trigger prefetch
  batchSize: number; // how many items to load in parallel
}

// Default configuration
const DEFAULT_CONFIG: LoaderConfig = {
  maxConcurrent: 4,
  defaultTimeout: 5000,
  enablePrefetching: true,
  defaultTTL: 10000, // 10 seconds cache for immediate re-requests
  retryOnError: true,
  maxRetries: 3,
  prefetchThreshold: 1000, // 1000px away from viewport
  batchSize: 10,
};

/**
 * The main UltraFast loader class
 */
class UltraFastLoader {
  private config: LoaderConfig;
  private queue: LoadRequest[] = [];
  private processing: Set<string> = new Set(); // Set of request IDs currently processing
  private tempCache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  > = new Map();
  private networkCondition: NetworkCondition = "fast";
  private isOnline: boolean = true;
  private viewportItems: Set<string> = new Set(); // Set of IDs currently visible in viewport
  private db: Firestore;

  // Stats tracking
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    timeouts: 0,
    totalLoadTime: 0,
  };

  constructor(config: Partial<LoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Skip browser-specific setup in SSR
    if (!isBrowser) {
      return;
    }

    this.db = db;

    // Set up network condition detection
    this.detectNetworkCondition();

    // Set up online/offline detection
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    this.isOnline = navigator.onLine;

    // Start the queue processor
    this.processQueue();
  }

  /**
   * Load data with priority-based queueing
   */
  public load<T = any>(request: Omit<LoadRequest, "id">): string {
    // Skip if not in browser environment
    if (!isBrowser) {
      // Return dummy request ID - this will be ignored server-side
      return `ssr-dummy-${Date.now()}-${Math.random()}`;
    }

    const requestId = this.generateRequestId(request.type, request.params);

    // Check temporary cache first if not forcing refresh
    if (!request.forceRefresh && this.checkCache(requestId)) {
      const cached = this.tempCache.get(requestId);
      if (cached) {
        this.stats.cacheHits++;
        request.callback(cached.data);
        return requestId;
      }
    }

    this.stats.cacheMisses++;
    this.stats.totalRequests++;

    const fullRequest: LoadRequest = {
      ...request,
      id: requestId,
      timeout: request.timeout || this.config.defaultTimeout,
      retryCount: request.retryCount || 0,
      ttl: request.ttl || this.config.defaultTTL,
    };

    // Add to queue and sort by priority
    this.queue.push(fullRequest);
    this.sortQueue();

    // Immediately process if we're not at max concurrent
    if (this.processing.size < this.config.maxConcurrent) {
      this.processQueue();
    }

    return requestId;
  }

  /**
   * Load a profile with minimal caching
   */
  public loadProfile(
    profileId: string,
    callback: (profile: any) => void,
    priority = LoadPriority.CRITICAL,
  ): string {
    return this.load({
      type: ContentType.PROFILE,
      priority,
      params: { profileId },
      callback,
      ttl: 5000, // 5 seconds cache for profiles only
      forceRefresh: true, // always get fresh profile data
    });
  }

  /**
   * Load a product with minimal caching
   */
  public loadProduct(
    productId: string,
    callback: (product: any) => void,
    priority = LoadPriority.HIGH,
  ): string {
    return this.load({
      type: ContentType.PRODUCT,
      priority,
      params: { productId },
      callback,
      ttl: 30000, // 30 seconds for product data
    });
  }

  /**
   * Load products list with smart batching and minimal caching
   */
  public loadProductsList(
    filters: any = {},
    orderByField: string = "createdAt",
    orderDirection: "asc" | "desc" = "desc",
    limitCount: number = 20,
    callback: (products: any[]) => void,
    priority = LoadPriority.MEDIUM,
  ): string {
    return this.load({
      type: ContentType.PRODUCTS_LIST,
      priority,
      params: { filters, orderByField, orderDirection, limitCount },
      callback,
      ttl: 20000, // 20 seconds for product lists
    });
  }

  /**
   * Load user feed with immediate display
   */
  public loadFeed(
    userId: string,
    callback: (feed: any[]) => void,
    priority = LoadPriority.HIGH,
  ): string {
    return this.load({
      type: ContentType.FEED,
      priority,
      params: { userId },
      callback,
      ttl: 15000, // 15 seconds for feed
    });
  }

  /**
   * Cancel a request by ID
   */
  public cancelRequest(requestId: string): boolean {
    const index = this.queue.findIndex((req) => req.id === requestId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Mark an item as being in viewport
   */
  public markInViewport(itemId: string, inViewport: boolean): void {
    if (inViewport) {
      this.viewportItems.add(itemId);

      // Reprioritize queue based on viewport
      this.reprioritizeQueue();
    } else {
      this.viewportItems.delete(itemId);
    }
  }

  /**
   * Prefetch data that will likely be needed soon
   */
  public prefetch(type: ContentType, params: any): void {
    if (!this.config.enablePrefetching || !this.isOnline) return;

    // Only prefetch if network is good
    if (this.networkCondition === "slow" || this.networkCondition === "offline")
      return;

    this.load({
      type,
      priority: LoadPriority.LOW, // Prefetched content is low priority
      params,
      callback: () => {}, // No callback needed for prefetch
      ttl: 30000, // Cache prefetched data longer
    });
  }

  /**
   * Get loader performance stats
   */
  public getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      processing: this.processing.size,
      cacheSize: this.tempCache.size,
      networkCondition: this.networkCondition,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear temporary cache
   */
  public clearCache(): void {
    this.tempCache.clear();
  }

  /**
   * Clean up event listeners on destroy
   */
  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  // ---- PRIVATE METHODS ----

  private async processQueue(): Promise<void> {
    // Skip if not in browser environment
    if (!isBrowser) return;

    if (
      this.queue.length === 0 ||
      this.processing.size >= this.config.maxConcurrent
    ) {
      return;
    }

    // Get the highest priority request
    const request = this.queue.shift();
    if (!request) return;

    // Mark as processing
    this.processing.add(request.id);

    try {
      const startTime = performance.now();
      const data = await this.fetchData(request);

      // Store in temp cache if TTL > 0
      if (request.ttl && request.ttl > 0) {
        this.tempCache.set(request.id, {
          data,
          timestamp: Date.now(),
          ttl: request.ttl,
        });
      }

      // Execute callback
      request.callback(data);

      // Update stats
      const loadTime = performance.now() - startTime;
      this.stats.totalLoadTime += loadTime;

      console.log(`✅ Loaded ${request.type} in ${loadTime.toFixed(0)}ms`);
    } catch (error) {
      console.error(`❌ Error loading ${request.type}:`, error);
      this.stats.errors++;

      // Retry if configured
      if (
        this.config.retryOnError &&
        request.retryCount < (this.config.maxRetries || 3)
      ) {
        const newRequest = {
          ...request,
          retryCount: (request.retryCount || 0) + 1,
          priority: LoadPriority.HIGH, // Bump priority for retries
        };
        this.queue.push(newRequest);
        this.sortQueue();
      } else if (request.errorCallback) {
        request.errorCallback(error);
      }
    } finally {
      // Remove from processing
      this.processing.delete(request.id);

      // Process next item
      setTimeout(() => this.processQueue(), 0);
    }
  }

  private async fetchData(request: LoadRequest): Promise<any> {
    // Set up timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error(`Request timed out for ${request.type}`));
      }, request.timeout);
    });

    // Set up data fetching promise
    const dataPromise = this.fetchByType(request.type, request.params);

    // Race timeout against data fetch
    return Promise.race([dataPromise, timeoutPromise]);
  }

  private async fetchByType(type: ContentType, params: any): Promise<any> {
    // Skip if not in browser environment or missing Firebase
    if (!isBrowser || !db || !doc || !getDoc) {
      throw new Error("Cannot fetch data: Browser APIs not available");
    }

    switch (type) {
      case ContentType.PROFILE:
        return this.fetchProfile(params.profileId);

      case ContentType.PRODUCT:
        return this.fetchProduct(params.productId);

      case ContentType.PRODUCTS_LIST:
        return this.fetchProductsList(
          params.filters,
          params.orderByField,
          params.orderDirection,
          params.limitCount,
        );

      case ContentType.FEED:
        return this.fetchFeed(params.userId);

      case ContentType.COMMENTS:
        return this.fetchComments(params.entityId, params.limit);

      case ContentType.REVIEWS:
        return this.fetchReviews(params.productId, params.limit);

      case ContentType.USER_DATA:
        return this.fetchUserData(params.userId);

      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  // Actual data fetching methods that access Firestore directly

  private async fetchProfile(profileId: string): Promise<any> {
    try {
      const profileRef = doc(this.db, "users", profileId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      const profileData = profileSnap.data();

      // Return normalized profile
      return {
        ...profileData,
        id: profileId, // Ensure correct ID
        joinedAt: profileData.joinedAt?.toDate(),
        followers: Array.isArray(profileData.followers)
          ? profileData.followers
          : [],
        following: Array.isArray(profileData.following)
          ? profileData.following
          : [],
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  private async fetchProduct(productId: string): Promise<any> {
    try {
      const productRef = doc(this.db, "products", productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product not found: ${productId}`);
      }

      return {
        id: productId,
        ...productSnap.data(),
        _lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  private async fetchProductsList(
    filters: any = {},
    orderByField: string = "createdAt",
    orderDirection: "asc" | "desc" = "desc",
    limitCount: number = 20,
  ): Promise<any[]> {
    try {
      let q = collection(this.db, "products");

      // Apply filters
      if (filters.category) {
        q = query(q, where("category", "==", filters.category));
      }

      if (filters.sellerId) {
        q = query(q, where("sellerId", "==", filters.sellerId));
      }

      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }

      if (filters.minPrice !== undefined) {
        q = query(q, where("price", ">=", filters.minPrice));
      }

      if (filters.maxPrice !== undefined) {
        q = query(q, where("price", "<=", filters.maxPrice));
      }

      // Apply order and limit
      q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process results
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        _lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error("Error fetching products list:", error);
      throw error;
    }
  }

  private async fetchFeed(userId: string): Promise<any[]> {
    try {
      // Placeholder for feed data fetching
      // In a real implementation, this would fetch posts from followed users

      return [];
    } catch (error) {
      console.error("Error fetching feed:", error);
      throw error;
    }
  }

  private async fetchComments(
    entityId: string,
    limitCount: number = 10,
  ): Promise<any[]> {
    try {
      const commentsQuery = query(
        collection(this.db, "comments"),
        where("entityId", "==", entityId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(commentsQuery);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  }

  private async fetchReviews(
    productId: string,
    limitCount: number = 10,
  ): Promise<any[]> {
    try {
      const reviewsQuery = query(
        collection(this.db, "reviews"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(reviewsQuery);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }
  }

  private async fetchUserData(userId: string): Promise<any> {
    try {
      const userRef = doc(this.db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User not found: ${userId}`);
      }

      return {
        id: userId,
        ...userSnap.data(),
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  // Utility methods

  private generateRequestId(type: ContentType, params: any): string {
    return `${type}-${JSON.stringify(params)}-${Date.now()}`;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then by whether item is in viewport
      const aInViewport = this.viewportItems.has(a.id);
      const bInViewport = this.viewportItems.has(b.id);

      if (aInViewport && !bInViewport) return -1;
      if (!aInViewport && bInViewport) return 1;

      // Then by retry count (higher retry count = higher priority)
      if (a.retryCount !== b.retryCount) {
        return (b.retryCount || 0) - (a.retryCount || 0);
      }

      return 0;
    });
  }

  private reprioritizeQueue(): void {
    // Bump priority for items in viewport
    this.queue.forEach((request) => {
      if (
        this.viewportItems.has(request.id) &&
        request.priority > LoadPriority.HIGH
      ) {
        request.priority = LoadPriority.HIGH;
      }
    });

    this.sortQueue();
  }

  private checkCache(requestId: string): boolean {
    const cached = this.tempCache.get(requestId);

    if (!cached) return false;

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > cached.ttl) {
      // Expired, remove from cache
      this.tempCache.delete(requestId);
      return false;
    }

    return true;
  }

  private detectNetworkCondition(): void {
    // Skip if not in browser environment
    if (!isBrowser) return;

    try {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;

        if (connection) {
          // Get initial network condition
          this.updateNetworkCondition(connection);

          // Listen for changes
          connection.addEventListener("change", () => {
            this.updateNetworkCondition(connection);
          });
        }
      }
    } catch (error) {
      // Safely handle any navigation/connection errors
      console.warn("Error detecting network condition:", error);
    }
  }

  private updateNetworkCondition(connection: any): void {
    if (connection.downlink >= 7) {
      this.networkCondition = "fast"; // 7+ Mbps
    } else if (connection.downlink >= 2) {
      this.networkCondition = "medium"; // 2-7 Mbps
    } else {
      this.networkCondition = "slow"; // < 2 Mbps
    }

    // Update config based on network
    if (this.networkCondition === "slow") {
      this.config.maxConcurrent = 2; // Reduce concurrent connections
      this.config.batchSize = 5; // Smaller batches
    } else {
      this.config.maxConcurrent = DEFAULT_CONFIG.maxConcurrent;
      this.config.batchSize = DEFAULT_CONFIG.batchSize;
    }
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    // Resume processing
    this.processQueue();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.networkCondition = "offline";
  };
}

// Create and export singleton instance - but only initialize it in browser
let ultraFastLoader: UltraFastLoader;

// In server-side rendering, provide a stub implementation
if (!isBrowser) {
  // Create minimal stub with same API but no-op functions
  ultraFastLoader = new UltraFastLoader();
} else {
  // Create real instance in browser
  ultraFastLoader = new UltraFastLoader();
}

export default ultraFastLoader;
