"use client";
import { useEffect, useRef, useState } from "react";

/** Loads data once on mount; call `reload()` (from an event handler) to refetch. */
export function useLoad<T>(fn: () => Promise<T>) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    let alive = true;
    fnRef.current().then(
      (data) => alive && set({ data, loading: false }),
      (e: Error) => alive && set({ error: e.message, loading: false }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);
  const reload = () => {
    set((s) => ({ ...s, loading: true, error: undefined }));
    setTick((t) => t + 1);
  };
  return { ...state, reload };
}
