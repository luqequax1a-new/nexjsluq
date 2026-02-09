"use client";

import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook to optimize performance by debouncing expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}

/**
 * Hook to throttle function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook to prevent memory leaks by cleaning up timeouts/intervals
 */
export function useAsyncCleanup() {
  const cleanupRefs = useRef<Array<() => void>>([]);
  
  useEffect(() => {
    return () => {
      cleanupRefs.current.forEach(cleanup => cleanup());
      cleanupRefs.current = [];
    };
  }, []);
  
  return useCallback((cleanup: () => void) => {
    cleanupRefs.current.push(cleanup);
  }, []);
}

/**
 * Hook to optimize scroll performance
 */
export function useScrollOptimization() {
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

/**
 * Hook to optimize touch events for mobile
 */
export function useTouchOptimization() {
  useEffect(() => {
    // Add passive event listeners for better touch performance
    const touchEvents = ['touchstart', 'touchmove'];
    
    touchEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true } as EventListenerOptions);
    });
    
    return () => {
      touchEvents.forEach(event => {
        document.removeEventListener(event, () => {}, { passive: true } as EventListenerOptions);
      });
    };
  }, []);
}
