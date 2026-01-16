/**
 * Signals Library
 *
 * Centralized exports and utilities for working with Preact Signals in React.
 * Signals provide fine-grained reactivity without the need for manual optimization.
 *
 * @see https://preactjs.com/guide/v10/signals/
 */

import { batch, computed, effect, ReadonlySignal, signal, Signal } from '@preact/signals-react';

// Re-export core signal primitives
export { batch, computed, effect, signal };
export type { ReadonlySignal, Signal };

/**
 * Create a persisted signal that syncs with localStorage
 *
 * @example
 * ```tsx
 * const theme = createPersistedSignal('theme', 'dark');
 * theme.value = 'light'; // Automatically saved to localStorage
 * ```
 */
export function createPersistedSignal<T>(key: string, initialValue: T): Signal<T> {
  // Try to load from localStorage
  let storedValue = initialValue;
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      storedValue = JSON.parse(item);
    }
  } catch (error) {
    console.warn(`Failed to load persisted signal "${key}":`, error);
  }

  const sig = signal<T>(storedValue);

  // Persist changes to localStorage
  effect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(sig.value));
    } catch (error) {
      console.warn(`Failed to persist signal "${key}":`, error);
    }
  });

  return sig;
}

/**
 * Create a store object with signals
 * Useful for organizing related state
 *
 * @example
 * ```tsx
 * const userStore = createStore({
 *   name: signal(''),
 *   email: signal(''),
 *   isLoggedIn: computed(() => name.value !== ''),
 * });
 * ```
 */
export function createStore<T extends Record<string, unknown>>(store: T): T {
  return store;
}

/**
 * Create an async signal that handles loading and error states
 *
 * @example
 * ```tsx
 * const data = createAsyncSignal(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 *
 * // Access state
 * if (data.loading.value) return <Spinner />;
 * if (data.error.value) return <Error error={data.error.value} />;
 * return <div>{data.value}</div>;
 * ```
 */
export function createAsyncSignal<T>(fetcher: () => Promise<T>, initialValue?: T) {
  const data = signal<T | undefined>(initialValue);
  const loading = signal<boolean>(false);
  const error = signal<Error | undefined>(undefined);

  const load = async () => {
    loading.value = true;
    error.value = undefined;
    try {
      data.value = await fetcher();
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  // Auto-load on creation
  load();

  return {
    data,
    loading,
    error,
    reload: load,
    get value() {
      return data.value;
    },
  };
}

/**
 * Debounce a signal value
 * Useful for search inputs or expensive computed values
 *
 * @example
 * ```tsx
 * const searchQuery = signal('');
 * const debouncedQuery = debounceSignal(searchQuery, 300);
 *
 * // Use debouncedQuery for API calls
 * effect(() => {
 *   if (debouncedQuery.value) {
 *     searchAPI(debouncedQuery.value);
 *   }
 * });
 * ```
 */
export function debounceSignal<T>(
  source: Signal<T> | ReadonlySignal<T>,
  delay: number,
): ReadonlySignal<T> {
  const debounced = signal<T>(source.value);
  let timeoutId: NodeJS.Timeout;

  effect(() => {
    const value = source.value;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debounced.value = value;
    }, delay);
  });

  return debounced;
}

/**
 * Create a signal that toggles between two values
 *
 * @example
 * ```tsx
 * const isOpen = createToggleSignal(false);
 * isOpen.toggle(); // true
 * isOpen.toggle(); // false
 * isOpen.set(true); // true
 * ```
 */
export function createToggleSignal(initialValue = false) {
  const sig = signal(initialValue);

  return {
    get value() {
      return sig.value;
    },
    set value(val: boolean) {
      sig.value = val;
    },
    toggle() {
      sig.value = !sig.value;
    },
    setTrue() {
      sig.value = true;
    },
    setFalse() {
      sig.value = false;
    },
  };
}

/**
 * Create a counter signal with increment/decrement methods
 *
 * @example
 * ```tsx
 * const counter = createCounterSignal(0);
 * counter.increment(); // 1
 * counter.decrement(); // 0
 * counter.reset(); // 0
 * ```
 */
export function createCounterSignal(initialValue = 0) {
  const sig = signal(initialValue);
  const initial = initialValue;

  return {
    get value() {
      return sig.value;
    },
    set value(val: number) {
      sig.value = val;
    },
    increment(step = 1) {
      sig.value += step;
    },
    decrement(step = 1) {
      sig.value -= step;
    },
    reset() {
      sig.value = initial;
    },
  };
}

/**
 * Global setting for including underlying APY in total APY calculations
 * Persisted to localStorage
 */
export const signalIncludeAssetApy = createPersistedSignal('includeAssetApy', true);
