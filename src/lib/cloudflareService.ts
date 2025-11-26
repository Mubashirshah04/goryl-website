// AWS CloudFront CDN and caching service
export class CloudFrontService {
  private static instance: CloudFrontService;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CloudFrontService {
    if (!CloudFrontService.instance) {
      CloudFrontService.instance = new CloudFrontService();
    }
    return CloudFrontService.instance;
  }

  // Invalidate CloudFront cache
  async invalidateCache(paths: string[]): Promise<boolean> {
    try {
      console.log('Invalidating CloudFront cache for paths:', paths);
      
      // Clear local cache
      paths.forEach(path => {
        this.cache.delete(path);
      });
      
      return true;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  }

  // Get cached data
  getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Optimize image URL for CloudFront
  optimizeImageUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}): string {
    if (!url) return url;
    
    const { width, height, quality = 80, format = 'webp' } = options;
    
    try {
      const imageUrl = new URL(url);
      const params = new URLSearchParams(imageUrl.search);
      
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('quality', quality.toString());
      params.append('format', format);
      
      imageUrl.search = params.toString();
      return imageUrl.toString();
    } catch (error) {
      return url;
    }
  }

  // Optimize video URL for CloudFront
  optimizeVideoUrl(url: string, options: {
    quality?: 'low' | 'medium' | 'high';
    format?: 'mp4' | 'webm';
  } = {}): string {
    if (!url) return url;
    
    const { quality = 'medium', format = 'mp4' } = options;
    
    try {
      const videoUrl = new URL(url);
      const params = new URLSearchParams(videoUrl.search);
      
      switch (quality) {
        case 'low':
          params.append('quality', '30');
          break;
        case 'medium':
          params.append('quality', '60');
          break;
        case 'high':
          params.append('quality', '80');
          break;
      }
      
      params.append('format', format);
      
      videoUrl.search = params.toString();
      return videoUrl.toString();
    } catch (error) {
      return url;
    }
  }

  // Get responsive image srcset
  getResponsiveSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${this.optimizeImageUrl(baseUrl, { width: size })} ${size}w`)
      .join(', ');
  }

  // Preload critical resources
  preloadResources(resources: Array<{
    url: string;
    as: 'image' | 'video' | 'script' | 'style' | 'font';
    crossorigin?: boolean;
  }>): void {
    if (typeof window === 'undefined') return;

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.as;
      
      if (resource.crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  // DNS prefetch for external domains
  prefetchDNS(domains: string[]): void {
    if (typeof window === 'undefined') return;

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  // Resource hints for AWS services
  addResourceHints(): void {
    if (typeof window === 'undefined') return;

    // DNS prefetch for AWS services
    this.prefetchDNS([
      'cloudfront.net',
      'amazonaws.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]);

    // Preconnect to critical domains
    const preconnectDomains = [
      `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN}`,
      `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Cache warming
  async warmCache(urls: string[]): Promise<void> {
    const promises = urls.map(async url => {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          console.log(`✅ Cache warmed for: ${url}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to warm cache for ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cloudFrontService = CloudFrontService.getInstance();
export default cloudFrontService;
