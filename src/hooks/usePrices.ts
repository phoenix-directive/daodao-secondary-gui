import { useEffect, useState } from 'react';

interface PriceData {
  denom: string;
  price_usd: string;
  decimals: number;
  display: string;
}

type PricesMap = Record<string, PriceData>;

const CACHE_KEY = 'eris_prices_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: PricesMap;
  timestamp: number;
}

export function usePrices() {
  const [prices, setPrices] = useState<PricesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const cacheEntry: CacheEntry = JSON.parse(cached);
          const now = Date.now();
          if (now - cacheEntry.timestamp < CACHE_DURATION) {
            setPrices(cacheEntry.data);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch('https://backend.erisprotocol.com/prices');
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }

        const data: PricesMap = await response.json();

        // Cache the data
        const cacheEntry: CacheEntry = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));

        setPrices(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch prices:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const getPrice = (denom: string): PriceData | null => {
    return prices[denom] || null;
  };

  return { prices, loading, error, getPrice };
}
