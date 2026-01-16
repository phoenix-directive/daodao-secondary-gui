import { globalCache } from "@/hooks/helpers/ChainService";
import { Signal, useSignal } from "@preact/signals-react";
import { useEffect } from "react";

export const useFetch = <T>(
  url: string,
  {
    cacheKey,
    liveTimeMin = 0,
    body,
  }: { cacheKey?: string; liveTimeMin?: number; body?: any }
) => {
  const cache = globalCache;
  // Signals to manage state with typing
  const data: Signal<T | null> = useSignal(null);
  const loading: Signal<boolean> = useSignal(true);
  const error: Signal<string | null> = useSignal(null);

  useEffect(() => {
    const fetchData = async () => {
      loading.value = true;
      error.value = null;

      try {
        let response: Response;
        if (body) {
          // console.log('POST', body);
          response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });
        } else {
          response = await fetch(url);
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        data.value = (await response.json()) as T;
        return data.value;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : "Unknown error";
      } finally {
        loading.value = false;
      }
    };

    if (!cacheKey || !liveTimeMin) {
      fetchData();
      return;
    } else {
      cache
        .getCached(cacheKey ?? "", liveTimeMin, () => fetchData())
        .then((res) => {
          //   console.log("setting from cache", res);
          data.value = res as T;
          loading.value = false;
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, cacheKey, liveTimeMin]);

  return { data, loading, error };
};
