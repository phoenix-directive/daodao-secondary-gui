import { useSignal } from "@preact/signals-react";

export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T
) {
  const state = useSignal<{ loading: boolean; error?: Error }>({
    loading: false,
  });

  const execute = async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    state.value = { loading: true };
    try {
      const res = await callback(...args);
      state.value = { loading: false };
      return res;
    } catch (err) {
      state.value = { loading: false, error: err as Error };
      throw err;
    }
  };

  return {
    get loading() {
      return state.value.loading;
    },
    get error() {
      return state.value.error;
    },
    execute,
  };
}
