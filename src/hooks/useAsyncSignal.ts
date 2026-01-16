import { getErrorMessage } from '@/hooks/helpers/helpers';
import { signal, Signal, useSignal } from '@preact/signals-react';
import { useCallback, useEffect } from 'react';

// Define the return type for the custom hook
export interface UseAsyncSignalReturn<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
  refetch: () => Promise<void>;
}

// Custom hook to manage async data with separate signals
export function useAsyncSignal<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: { onLoaded?: (data: T) => void } = {},
): UseAsyncSignalReturn<T> {
  const data = useSignal<T | null>(null);
  const loading = useSignal<boolean>(true);
  const error = useSignal<string | null>(null);

  // Memoized refetch function to avoid unnecessary re-renders
  const fetchData = useCallback(async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFunction();
      data.value = result;
      options.onLoaded?.(data.value);
    } catch (err) {
      error.value = await getErrorMessage(err);
      console.warn('error in async signal', error.value);
    } finally {
      loading.value = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFunction]);

  // Automatically fetch data on mount
  useEffect(() => {
    // console.log("fetching data", dependencies);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: async () => {
      if (!loading.value) {
        // console.log("refetching");
        await fetchData();
      }
    },
  };
}

// Custom hook to manage async data with separate signals
export function asyncSignal<T>(
  fetchFunction: () => Promise<T>,
  options: { onLoaded?: (data: T) => void } = {},
): UseAsyncSignalReturn<T> {
  const data = signal<T | null>(null);
  const loading = signal<boolean>(true);
  const error = signal<string | null>(null);

  // Memoized refetch function to avoid unnecessary re-renders
  const fetchData = async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFunction();
      data.value = result;
      options.onLoaded?.(data.value);
    } catch (err) {
      error.value = await getErrorMessage(err);
      console.warn('error in async signal', error.value);
    } finally {
      loading.value = false;
    }
  };

  fetchData();

  return {
    data,
    loading,
    error,
    refetch: () => {
      console.log('refetching');
      return fetchData();
    },
  };
}
