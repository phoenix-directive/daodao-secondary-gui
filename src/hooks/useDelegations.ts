import { ChainClients } from '@/hooks/helpers/ChainService';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';

export interface Delegation {
  validatorAddress: string;
  amount: string;
  denom: string;
}

export function useDelegations(chain: ChainClients, address?: string) {
  return useAsyncSignal(async () => {
    if (!address) return [];
    return await chain.read.delegations(address);
  }, [address, chain.chainId]);
}
