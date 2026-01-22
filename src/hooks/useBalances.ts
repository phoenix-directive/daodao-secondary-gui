import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain, useChainByContractOptional } from '@/hooks/useChain';
import { usePrices } from '@/hooks/usePrices';
import { globalReload } from '@/hooks/useReload';

export interface Balance {
  denom: string;
  amount: string;
  decimals: number;
  display: string;
  priceUsd: string;
}

/**
 * Query all balances for a contract address and filter by available price data
 */
export const useBalances = (contractAddress: string | undefined) => {
  const chain = useChainByContractOptional(contractAddress) || useChain(Chain.Terra);
  const { prices, getPrice } = usePrices();

  return useAsyncSignal(async () => {
    if (!contractAddress) return [];

    try {
      // Query all balances for the contract
      const allBalances = await chain.read.balances(contractAddress);

      // Filter and enrich balances with price data
      const enrichedBalances: Balance[] = allBalances
        .map((balance) => {
          const priceData = getPrice(balance.denom);
          if (!priceData) return null;

          return {
            denom: balance.denom,
            amount: balance.amount,
            decimals: priceData.decimals,
            display: priceData.display,
            priceUsd: priceData.price_usd,
          };
        })
        .filter((balance): balance is Balance => balance !== null)
        .sort((a, b) => {
          // Sort by USD value (descending)
          const aValue = (parseFloat(a.amount) * parseFloat(a.priceUsd)) / Math.pow(10, a.decimals);
          const bValue = (parseFloat(b.amount) * parseFloat(b.priceUsd)) / Math.pow(10, b.decimals);
          return bValue - aValue;
        });

      return enrichedBalances;
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      return [];
    }
  }, [contractAddress, prices, globalReload.value]);
};

/**
 * Query a single balance for an address and denom
 */
export const useBalance = (
  address: string | undefined,
  denom: string | undefined
) => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    if (!address || !denom) return '0';

    try {
      const balance = await chain.read.balance(address, denom);
      return balance.amount;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return '0';
    }
  }, [address, denom, globalReload.value]);
};

/**
 * Convert from base units to human-readable decimal string
 * @param amount Amount in base units (e.g., "1000000" uluna)
 * @param decimals Number of decimal places (e.g., 6 for uluna)
 * @returns Human-readable string (e.g., "1.000000")
 */
export const fromBaseUnits = (amount: string, decimals: number): string => {
  if (!amount || amount === '0') return '0';

  const num = parseFloat(amount);
  if (isNaN(num)) return '0';

  const divisor = Math.pow(10, decimals);
  return (num / divisor).toFixed(decimals);
};

/**
 * Convert from human-readable decimal string to base units
 * @param amount Human-readable amount (e.g., "1.5")
 * @param decimals Number of decimal places (e.g., 6 for uluna)
 * @returns Amount in base units (e.g., "1500000")
 */
export const toBaseUnits = (amount: string, decimals: number): string => {
  if (!amount || amount === '0') return '0';

  const num = parseFloat(amount);
  if (isNaN(num)) return '0';

  const multiplier = Math.pow(10, decimals);
  return Math.floor(num * multiplier).toString();
};
