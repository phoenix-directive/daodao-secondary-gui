import { useAsyncSignal } from './useAsyncSignal';
import { useChainByContractOptional } from './useChain';

interface ProposalCreationPolicy {
  module?: {
    addr: string;
  };
  anyone?: {
    enabled: boolean;
  };
}

/**
 * Query the proposal creation policy for a proposal module
 * Cached for 7 days (10080 minutes)
 */
export function useProposalCreationPolicy(proposalModuleAddress: string | undefined) {
  const chain = useChainByContractOptional(proposalModuleAddress);

  return useAsyncSignal(async () => {
    if (!proposalModuleAddress || !chain) {
      return undefined;
    }

    try {
      const result = await chain.read.queryCached<ProposalCreationPolicy>(
        proposalModuleAddress,
        {
          proposal_creation_policy: {},
        },
        1 * 24 * 60, // 1 day in minutes
      );

      return result;
    } catch (error) {
      console.error('Failed to fetch proposal creation policy:', error);
      return undefined;
    }
  }, [proposalModuleAddress]);
}
