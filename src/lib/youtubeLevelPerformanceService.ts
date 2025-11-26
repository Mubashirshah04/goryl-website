// YouTube-Level Performance Service - Ultra-fast website optimization
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface RealtimeData {
  users: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  timestamp: number;
}

class YouTubeLevelPerformanceService {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  };

  private realtimeData: Map<string, RealtimeData> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();
  private prefetchQueue: string[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Initialize YouTube-level optimizations
  private initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🚀 Initializing YouTube-level performance optimizations...');

    // 1. Preload critical resources
    this.preloadCriticalResources();

    // 2. Set up intersection observers for lazy loading
    this.setupIntersectionObservers();

    // 3. Implement smart prefetching
    this.setupSmartPrefetching();

    // 4. Set up realtime updates
    this.setupRealtimeUpdates();

    // 5. Optimize memory usage
    this.setupMemoryOptimization();

    // 6. Set up performance monitoring
    this.setupPerformanceMonitoring();

    console.log('✅ YouTube-level optimizations initialized');
  }

  // Preload critical resources
  private preloadCriticalResources(): void {
    const criticalResources = [
      '/api/products',
      '/api/categories',
      // Skip /api/user/profile as it requires userId parameter
      // '/api/user/profile',
      '/api/realtime/stats'
    ];

    criticalResources.forEach(resource => {
      this.prefetchResource(resource);
    });
  }

  // Set up intersection observers for lazy loading
  private setupIntersectionObservers(): void {
    // Product cards lazy loading
    const productObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadProductData(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Image lazy loading
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
          }
        });
      },
      { rootMargin: '100px' }
    );

    this.observers.set('products', productObserver);
    this.observers.set('images', imageObserver);
  }

  // Set up smart prefetching
  private setupSmartPrefetching(): void {
    // Prefetch on hover
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        this.prefetchResource(link.href);
      }
    });

    // Prefetch on scroll
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.prefetchVisibleContent();
      }, 100);
    });
  }

  // Set up realtime updates
  private setupRealtimeUpdates(): void {
    // Simulate realtime data updates
    setInterval(() => {
      this.updateRealtimeData();
    }, 1000);

    // Set up WebSocket for real updates (if available)
    this.setupWebSocketConnection();
  }

  // Set up memory optimization
  private setupMemoryOptimization(): void {
    // Clean up unused observers
    setInterval(() => {
      this.cleanupUnusedObservers();
    }, 30000);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        this.monitorMemoryUsage();
      }, 10000);
    }
  }

  // Set up performance monitoring
  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();

    // Monitor custom metrics
    this.monitorCustomMetrics();
  }

  // Prefetch resource
  private prefetchResource(url: string): void {
    if (this.prefetchQueue.includes(url)) return;
    
    this.prefetchQueue.push(url);
    
    // Use fetch with cache-first strategy
    fetch(url, {
      method: 'GET',
      cache: 'force-cache',
      headers: {
        'X-Prefetch': 'true'
      }
    }).catch(error => {
      console.warn('Prefetch failed:', error);
    });
  }

  // Load product data
  private loadProductData(element: Element): void {
    const productId = element.getAttribute('data-product-id');
    if (productId) {
      // Load product data from cache or API
      this.loadProductFromCache(productId).then(data => {
        if (data) {
          this.renderProductData(element, data);
        } else {
          this.fetchProductData(productId).then(data => {
            this.cacheProductData(productId, data);
            this.renderProductData(element, data);
          });
        }
      });
    }
  }

  // Load image
  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
  }

  // Prefetch visible content
  private prefetchVisibleContent(): void {
    const visibleElements = document.querySelectorAll('[data-prefetch]');
    visibleElements.forEach(element => {
      const url = element.getAttribute('data-prefetch');
      if (url) {
        this.prefetchResource(url);
      }
    });
  }

  // Update realtime data
  private updateRealtimeData(): void {
    // Simulate realtime updates
    const updates = {
      users: Math.floor(Math.random() * 1000) + 5000,
      views: Math.floor(Math.random() * 10000) + 50000,
      likes: Math.floor(Math.random() * 500) + 2000,
      comments: Math.floor(Math.random() * 100) + 500,
      shares: Math.floor(Math.random() * 50) + 200,
      timestamp: Date.now()
    };

    this.realtimeData.set('global', updates);
    this.notifyRealtimeUpdates(updates);
  }

  // Set up WebSocket connection
  private setupWebSocketConnection(): void {
    // WebSocket connection for real-time updates
    // Note: This is optional - errors are expected if WebSocket server is not running
    try {
      const ws = new WebSocket('ws://localhost:3001/realtime');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealtimeMessage(data);
      };

      ws.onerror = () => {
        // Silently handle errors - WebSocket server is optional
        // Connection failures are expected if server is not running
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.setupWebSocketConnection();
        }, 5000);
      };
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  // Handle realtime message
  private handleRealtimeMessage(data: any): void {
    this.realtimeData.set(data.type, data);
    this.notifyRealtimeUpdates(data);
  }

  // Notify realtime updates
  private notifyRealtimeUpdates(data: RealtimeData): void {
    // Dispatch custom event for realtime updates
    const event = new CustomEvent('realtimeUpdate', { detail: data });
    window.dispatchEvent(event);
  }

  // Monitor Core Web Vitals
  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.loadTime = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.interactionTime = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      let clsValue = 0;
      list.getEntries().forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      // CLS value is tracked but not stored in metrics
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Monitor custom metrics
  private monitorCustomMetrics(): void {
    // Monitor render time
    const startTime = performance.now();
    requestAnimationFrame(() => {
      this.metrics.renderTime = performance.now() - startTime;
    });

    // Monitor cache hit rate
    this.monitorCacheHitRate();
  }

  // Monitor cache hit rate
  private monitorCacheHitRate(): void {
    // This would be implemented based on your caching strategy
    // For now, we'll simulate it
    this.metrics.cacheHitRate = Math.random() * 100;
  }

  // Monitor memory usage
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
  }

  // Clean up unused observers
  private cleanupUnusedObservers(): void {
    this.observers.forEach((observer, key) => {
      if (observer.takeRecords().length === 0) {
        observer.disconnect();
        this.observers.delete(key);
      }
    });
  }

  // Load product from cache
  private async loadProductFromCache(productId: string): Promise<any> {
    try {
      const cached = localStorage.getItem(`product_${productId}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (5 minutes)
        if (Date.now() - data.timestamp < 300000) {
          return data.product;
        }
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
    return null;
  }

  // Cache product data
  private cacheProductData(productId: string, data: any): void {
    try {
      const cacheData = {
        product: data,
        timestamp: Date.now()
      };
      localStorage.setItem(`product_${productId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  // Fetch product data
  private async fetchProductData(productId: string): Promise<any> {
    try {
      const response = await fetch(`/api/products/${productId}`);
      return await response.json();
    } catch (error) {
      console.error('Product fetch failed:', error);
      return null;
    }
  }

  // Render product data
  private renderProductData(element: Element, data: any): void {
    // Update element with product data
    const nameEl = element.querySelector('[data-product-name]');
    const priceEl = element.querySelector('[data-product-price]');
    const imageEl = element.querySelector('[data-product-image]');

    if (nameEl) nameEl.textContent = data.name;
    if (priceEl) priceEl.textContent = `$${data.price}`;
    if (imageEl) imageEl.src = data.image;
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get realtime data
  getRealtimeData(type: string): RealtimeData | null {
    return this.realtimeData.get(type) || null;
  }

  // Add element to observer
  observeElement(element: Element, type: 'products' | 'images'): void {
    const observer = this.observers.get(type);
    if (observer) {
      observer.observe(element);
    }
  }

  // Remove element from observer
  unobserveElement(element: Element, type: 'products' | 'images'): void {
    const observer = this.observers.get(type);
    if (observer) {
      observer.unobserve(element);
    }
  }

  // Prefetch route
  prefetchRoute(path: string): void {
    this.prefetchResource(path);
  }

  // Clear cache
  clearCache(): void {
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('product_') || key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear prefetch queue
    this.prefetchQueue = [];
  }
}

// Singleton instance
const youtubeLevelPerformanceService = new YouTubeLevelPerformanceService();

export default youtubeLevelPerformanceService;
