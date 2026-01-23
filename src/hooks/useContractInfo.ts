import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from './useAsyncSignal';
import { useChainByContractOptional } from './useChain';

interface ContractInfo {
  code_id: number;
  creator: string;
  admin?: string;
  label: string;
  created?: {
    block_height: number;
    tx_index: number;
  };
  ibc_port_id?: string;
  extension?: any;
}

/**
 * Hook to query smart contract info from the blockchain
 * Returns the contract label and other metadata
 */
export const useContractInfo = (contractAddress: string | undefined, chain?: Chain) => {
  const chainByContract = useChainByContractOptional(contractAddress);
  const chainService = chain ? chainByContract : chainByContract;

  return useAsyncSignal(async () => {
    if (!contractAddress || !chainService) {
      return undefined;
    }

    try {
      // Query contract info using the chain service
      const info = await chainService.read.contractInfo(contractAddress);
      return info;
    } catch (error) {
      // If the query fails, it might not be a smart contract or the chain doesn't support this query
      console.debug(`Failed to fetch contract info for ${contractAddress}:`, error);
      return undefined;
    }
  }, [contractAddress, chainService]);
};
