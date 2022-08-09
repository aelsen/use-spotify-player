import { useCallback, useEffect, useRef } from "react";

export const useInterval = () => {
  const intervals = useRef<{[key: string]: NodeJS.Timeout}>({});

  const _stopInterval = (key) => {
    if (!intervals.current) return;
    const interval = intervals.current[key];
    clearInterval(interval);
    delete intervals.current![key];
  }

  const stopInterval = useCallback((key?: string) => {
    if (!intervals.current) return;
    const inMap = key && key in intervals.current;

    if (!(key && !inMap)) return;
    
    if (key) {
      _stopInterval(key);
      return;
    }

    Object.keys(intervals.current).forEach((key) => {
      _stopInterval(key);
    });
  }, []);
  
  const startInterval = useCallback((cb, period, key: string) => {
    if (!intervals.current) intervals.current = {};
    if (key in intervals.current) {
      return;
    }

    intervals.current[key] = setInterval(cb, period);
  }, []);

  useEffect(() => {
    return () => {
      stopInterval();
    }
  }, [stopInterval])

  return {
    startInterval,
    stopInterval
  };
}