// Navigation Hook - Prevent page reloads on navigation
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import pageStatePersistenceService from '@/lib/pageStatePersistenceService';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Navigate without page reload
  const navigate = useCallback((path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    // Save current state before navigation
    pageStatePersistenceService.saveCurrentState();
    
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
    
    // Scroll to top if needed
    if (options?.scroll !== false) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [router]);

  // Navigate back without page reload
  const goBack = useCallback(() => {
    pageStatePersistenceService.saveCurrentState();
    router.back();
  }, [router]);

  // Navigate forward without page reload
  const goForward = useCallback(() => {
    pageStatePersistenceService.saveCurrentState();
    router.forward();
  }, [router]);

  // Refresh current page without reload
  const refresh = useCallback(() => {
    pageStatePersistenceService.saveCurrentState();
    router.refresh();
  }, [router]);

  // Preload route for instant navigation
  const preload = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  // Save current page state
  const saveState = useCallback(() => {
    pageStatePersistenceService.saveCurrentState();
  }, []);

  // Restore page state
  const restoreState = useCallback(() => {
    pageStatePersistenceService.restoreState();
  }, []);

  // Check if state exists for current path
  const hasState = useCallback(() => {
    return pageStatePersistenceService.hasState(pathname);
  }, [pathname]);

  // Get state for current path
  const getState = useCallback(() => {
    return pageStatePersistenceService.getState(pathname);
  }, [pathname]);

  // Clear all states
  const clearStates = useCallback(() => {
    pageStatePersistenceService.clearAllStates();
  }, []);

  // Set up state persistence on mount
  useEffect(() => {
    // Restore state when component mounts
    const timer = setTimeout(() => {
      pageStatePersistenceService.restoreState();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Save state when component unmounts
      pageStatePersistenceService.saveCurrentState();
    };
  }, [pathname]);

  return {
    navigate,
    goBack,
    goForward,
    refresh,
    preload,
    saveState,
    restoreState,
    hasState,
    getState,
    clearStates,
    pathname
  };
}
