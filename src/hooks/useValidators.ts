/**
 * Hook to fetch and cache validators from the staking module
 * Cached for 24 hours to reduce RPC calls
 */

import type { ChainClients } from '@/hooks/helpers/ChainService';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';

export type Validator = {
  address: string;
  moniker: string;
  status: string;
  commission: number;
  jailed: boolean;
};

/**
 * Fetch validators from the chain's staking module
 * @param chain - Chain clients to use for querying
 * @returns List of validators sorted by commission (lowest first)
 */
export function useValidators(chain: ChainClients) {
  return useAsyncSignal(async () => {
    const response = await chain.read.validatorsCached();
    return response;
  }, [chain.chainId]);
}
