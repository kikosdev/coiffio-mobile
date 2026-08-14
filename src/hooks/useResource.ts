import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export type ResourceStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface UseResourceResult<T> {
  data: T | null;
  status: ResourceStatus;
  error?: string;
  reload: () => Promise<void>;
}

function isEmptyResult<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

/**
 * Fetches `fetcher()` on mount and whenever `deps` changes, exposing a single `status` instead
 * of separate booleans — 'empty' only follows a successful call that resolved to null/[], never
 * a failed one, so a network error can't be mistaken for "nothing here yet".
 */
export function useResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState<string | undefined>(undefined);

  // Guards against a slow, stale request overwriting a newer one's result when deps change
  // in quick succession (or reload() fires while a mount-triggered fetch is still in flight).
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(undefined);
    try {
      const result = await fetcher();
      if (id !== requestId.current) return;
      setData(result);
      setStatus(isEmptyResult(result) ? 'empty' : 'ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setData(null);
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, reload: load };
}
