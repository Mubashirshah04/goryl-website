import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll<T>(
  fetchData: (page: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions = {}
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useRef<HTMLDivElement>(null)

  const { threshold = 0.1, rootMargin = '20px' } = options

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newData = await fetchData(page)
      if (newData.length === 0) {
        setHasMore(false)
      } else {
        setData(prev => [...prev, ...newData])
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading more data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchData, page, loading, hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold, rootMargin }
    )

    observerRef.current = observer

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, loading, threshold, rootMargin])

  const reset = useCallback(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    hasMore,
    lastElementRef,
    reset,
    loadMore,
  }
}
