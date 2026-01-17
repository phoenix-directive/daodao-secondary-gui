/**
 * Factory for creating voting module adapters
 */

import { ChainClients } from '@/hooks/helpers/ChainService';
import { Cw20StakedAdapter } from './adapters/Cw20StakedAdapter';
import { Cw4Adapter } from './adapters/Cw4Adapter';
import { Cw721StakedAdapter } from './adapters/Cw721StakedAdapter';
import { TokenStakedAdapter } from './adapters/TokenStakedAdapter';
import { getVotingModuleType, VotingModuleType } from './constants';
import { VotingModuleAdapter } from './types';

export interface ContractInfo {
  contract: string;
  version: string;
}

export interface InfoResponse {
  info: ContractInfo;
}

/**
 * Create an adapter for a voting module
 *
 * @param votingModuleAddress The address of the voting module contract
 * @param chain The chain service instance
 * @returns Promise<VotingModuleAdapter | null> Returns null if unsupported
 */
export async function createVotingModuleAdapter(
  votingModuleAddress: string,
  chain: ChainClients,
): Promise<VotingModuleAdapter | null> {
  try {
    // Query contract info to determine type (cached for 7 days)
    const cacheTime = 7 * 24 * 60; // 7 days in minutes
    const infoResponse = (await chain.read.queryCached(
      votingModuleAddress,
      { info: {} },
      cacheTime,
    )) as InfoResponse;

    const contractName = infoResponse.info.contract;
    const moduleType = getVotingModuleType(contractName);

    // Create appropriate adapter based on type
    switch (moduleType) {
      case VotingModuleType.CW20_STAKED:
        return new Cw20StakedAdapter(votingModuleAddress, chain);

      case VotingModuleType.CW4:
        return new Cw4Adapter(votingModuleAddress, chain);

      case VotingModuleType.TOKEN_STAKED:
        return new TokenStakedAdapter(votingModuleAddress, chain, VotingModuleType.TOKEN_STAKED);

      case VotingModuleType.NATIVE_STAKED:
        return new TokenStakedAdapter(votingModuleAddress, chain, VotingModuleType.NATIVE_STAKED);

      case VotingModuleType.CW721_STAKED:
        return new Cw721StakedAdapter(votingModuleAddress, chain);

      case VotingModuleType.ONFT_STAKED:
      case VotingModuleType.SG_COMMUNITY_NFT:
        // These types would need custom adapters for NFT-based voting
        // For now, return null as they're not yet implemented
        console.warn(`Voting module type ${moduleType} not yet implemented`);
        return null;

      default:
        console.warn(`Unknown voting module type: ${contractName}`);
        return null;
    }
  } catch (error) {
    console.error('Failed to create voting module adapter:', error);
    return null;
  }
}
