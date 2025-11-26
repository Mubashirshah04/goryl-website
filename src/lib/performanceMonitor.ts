// ✅ PERFORMANCE MONITORING for instant loading optimization
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.set('lcp', lastEntry.startTime)
          console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms')
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const fidEntry = entry as any
            if (fidEntry.processingStart) {
              this.metrics.set('fid', fidEntry.processingStart - fidEntry.startTime)
              console.log('📊 FID:', (fidEntry.processingStart - fidEntry.startTime).toFixed(2), 'ms')
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.set('fid', fidObserver)

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          this.metrics.set('cls', clsValue)
          console.log('📊 CLS:', clsValue.toFixed(4))
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)

        // Time to First Byte (TTFB)
        const ttfbObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const ttfb = (entry as any).responseStart - (entry as any).requestStart
              this.metrics.set('ttfb', ttfb)
              console.log('📊 TTFB:', ttfb.toFixed(2), 'ms')
            }
          })
        })
        ttfbObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('ttfb', ttfbObserver)

      } catch (error) {
        console.warn('Performance monitoring not supported:', error)
      }
    }
  }

  // Start timing a custom metric
  startTiming(name: string): void {
    this.metrics.set(`${name}_start`, performance.now())
  }

  // End timing a custom metric
  endTiming(name: string): number {
    const startTime = this.metrics.get(`${name}_start`)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.set(name, duration)
      console.log(`📊 ${name}:`, duration.toFixed(2), 'ms')
      return duration
    }
    return 0
  }

  // Record a custom metric
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value)
    console.log(`📊 ${name}:`, value)
  }

  // Get all metrics
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {}
    this.metrics.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  // Get specific metric
  getMetric(name: string): number | undefined {
    return this.metrics.get(name)
  }

  // Check if performance is good
  isPerformanceGood(): boolean {
    const lcp = this.getMetric('lcp')
    const fid = this.getMetric('fid')
    const cls = this.getMetric('cls')
    const ttfb = this.getMetric('ttfb')

    // Good performance thresholds
    const goodLCP = !lcp || lcp < 2500 // < 2.5s
    const goodFID = !fid || fid < 100 // < 100ms
    const goodCLS = !cls || cls < 0.1 // < 0.1
    const goodTTFB = !ttfb || ttfb < 600 // < 600ms

    return goodLCP && goodFID && goodCLS && goodTTFB
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const lcp = this.getMetric('lcp') || 0
    const fid = this.getMetric('fid') || 0
    const cls = this.getMetric('cls') || 0
    const ttfb = this.getMetric('ttfb') || 0

    // Calculate scores for each metric (0-100)
    const lcpScore = Math.max(0, 100 - (lcp / 25)) // 0-100 based on LCP
    const fidScore = Math.max(0, 100 - (fid * 10)) // 0-100 based on FID
    const clsScore = Math.max(0, 100 - (cls * 1000)) // 0-100 based on CLS
    const ttfbScore = Math.max(0, 100 - (ttfb / 6)) // 0-100 based on TTFB

    // Weighted average
    const score = (lcpScore * 0.4 + fidScore * 0.3 + clsScore * 0.2 + ttfbScore * 0.1)
    return Math.round(score)
  }

  // Log performance report
  logPerformanceReport(): void {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()
    const isGood = this.isPerformanceGood()

    console.log('🚀 Performance Report:')
    console.log('📊 Overall Score:', score, '/ 100')
    console.log('✅ Performance Status:', isGood ? 'GOOD' : 'NEEDS IMPROVEMENT')
    console.log('📈 Metrics:', metrics)
    
    // Log specific recommendations
    if (metrics.lcp > 2500) {
      console.warn('⚠️ LCP is slow. Consider optimizing images and reducing render-blocking resources.')
    }
    if (metrics.fid > 100) {
      console.warn('⚠️ FID is slow. Consider reducing JavaScript execution time.')
    }
    if (metrics.cls > 0.1) {
      console.warn('⚠️ CLS is high. Consider adding size attributes to images and avoiding dynamic content insertion.')
    }
    if (metrics.ttfb > 600) {
      console.warn('⚠️ TTFB is slow. Consider optimizing server response time.')
    }
  }

  // Clean up observers
  cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor()

// Export for use
export default performanceMonitor

// Export individual functions for convenience
export const startTiming = (name: string) => performanceMonitor.startTiming(name)
export const endTiming = (name: string) => performanceMonitor.endTiming(name)
export const recordMetric = (name: string, value: number) => performanceMonitor.recordMetric(name, value)
export const getMetrics = () => performanceMonitor.getMetrics()
export const getPerformanceScore = () => performanceMonitor.getPerformanceScore()
export const isPerformanceGood = () => performanceMonitor.isPerformanceGood()
export const logPerformanceReport = () => performanceMonitor.logPerformanceReport()
