import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';

export interface DaoDaoConfig {
  name: string;
  description: string;
  image_url: string | null;
  automatically_add_cw20s: boolean;
  automatically_add_cw721s: boolean;
  dao_uri: string | null;
}

export interface ProposalModule {
  address: string;
  prefix: string;
  status: 'enabled' | 'disabled';
}

export interface Version {
  contract: string;
  version: string;
}

export interface PauseInfo {
  unpaused?: {};
  paused?: { expiration: any };
}

export interface DaoDaoDumpState {
  admin: string;
  config: DaoDaoConfig;
  pause_info: PauseInfo;
  version: Version;
  proposal_modules: ProposalModule[];
  voting_module: string;
  active_proposal_module_count: number;
  total_proposal_module_count: number;
}

export type DaoDaoStateResponse = DaoDaoDumpState & {
  _computed: {
    address: string;
    availableProposalTypes: {
      single: boolean;
      multiple: boolean;
    };
  };
};

/**
 * Query DAO DAO contract for its current state
 */
export const useDaoDaoState = (contractAddress: string | undefined) => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    if (!contractAddress) return null;

    const cacheTimeMin = 24 * 60; // 24 hours
    const result = await chain.read.queryCached<DaoDaoDumpState>(
      contractAddress,
      {
        dump_state: {},
      },
      cacheTimeMin,
    );

    // Compute available proposal types based on enabled modules
    const modules = result?.proposal_modules || [];
    const hasSingleChoice = modules.some((m) => m.prefix === 'A' && m.status === 'enabled');
    const hasMultipleChoice = modules.some((m) => m.prefix === 'B' && m.status === 'enabled');

    return {
      ...result,
      _computed: {
        address: contractAddress,
        availableProposalTypes: {
          single: hasSingleChoice,
          multiple: hasMultipleChoice,
        },
      },
    } as DaoDaoStateResponse;
  }, [contractAddress, globalReload.value]);
};

/**
 * Get avatar initials from DAO name
 * Takes first character of first two words
 */
export const getDaoInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Generate gradient colors for DAO avatar
 * Uses red/orange theme colors
 */
export const getDaoGradient = (name: string): string => {
  // Generate consistent gradient based on name hash using logo colors
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const gradients = [
    'from-[#9E1B0F] to-[#E24A17]', // Deep Red to Fire Orange
    'from-[#B32712] to-[#FF8A1E]', // Deep Red to Bright Orange
    'from-[#E24A17] to-[#FF9F2E]', // Fire Orange to Bright Orange
    'from-[#F0651E] to-[#FFC83D]', // Fire Orange Light to Golden Yellow
    'from-[#FF8A1E] to-[#FFD966]', // Bright Orange to Golden Yellow Light
    'from-[#9E1B0F] to-[#FFC83D]', // Deep Red Shadow to Golden Yellow
  ];

  return gradients[hash % gradients.length];
};
