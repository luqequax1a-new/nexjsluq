"use client";

import { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development' }: PerformanceMonitorProps) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        if (fps < 30) {
          console.warn(`[Performance] Low FPS detected: ${fps}`);
        }
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  // Monitor long tasks
  useEffect(() => {
    if (!enabled || !window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // longtask might not be supported in all browsers
    }

    return () => observer.disconnect();
  }, [enabled]);

  return null;
}
