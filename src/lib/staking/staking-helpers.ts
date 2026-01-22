/**
 * Helper functions for staked voting module queries
 * Provides reusable query logic for both CW20 and native staked voting modules
 *
 * CW20 Pattern: votingModule -> staking_contract -> config/queries
 * Native Pattern: votingModule (is staking contract) -> config/queries
 */

import type {
  ClaimsResponse,
  Config,
  StakedValueResponse,
} from '@/daodao/types/contracts/Cw20Stake';
import { ChainClients } from '@/hooks/helpers/ChainService';

// Cache duration constants
const CONFIG_CACHE_DURATION = 24 * 60; // 1 day in minutes
const STAKING_CONTRACT_CACHE_DURATION = 7 * 24 * 60; // 7 days in minutes

/**
 * Get the staking contract address for a CW20 voting module
 * For native staking, the voting module address IS the staking contract
 * This function is only needed for CW20 staking modules
 */
export async function getStakingContract(
  votingModuleAddress: string,
  chain: ChainClients,
): Promise<string> {
  const result = await chain.read.queryCached<string>(
    votingModuleAddress,
    { staking_contract: {} },
    STAKING_CONTRACT_CACHE_DURATION,
  );
  return result;
}

/**
 * Query the staking contract configuration
 * Works for both CW20 (includes token_address and unstaking_duration)
 * and native staking (includes denom and unstaking_duration)
 */
export async function getStakingConfig(
  stakingContractAddress: string,
  chain: ChainClients,
): Promise<Config> {
  const config = await chain.read.queryCached<Config>(
    stakingContractAddress,
    { get_config: {} },
    CONFIG_CACHE_DURATION,
  );
  return config;
}

/**
 * Query user's staked amount
 * Works for both CW20 and native staking modules
 */
export async function getUserStakedAmount(
  stakingContractAddress: string,
  userAddress: string,
  chain: ChainClients,
): Promise<string> {
  const result = await chain.read.query<StakedValueResponse>(stakingContractAddress, {
    staked_value: {
      address: userAddress,
    },
  });
  return result.value;
}

/**
 * Query user's pending claims (unbondings)
 * Works for both CW20 and native staking modules
 */
export async function getUserClaims(
  stakingContractAddress: string,
  userAddress: string,
  chain: ChainClients,
): Promise<ClaimsResponse> {
  const result = await chain.read.query<ClaimsResponse>(stakingContractAddress, {
    claims: {
      address: userAddress,
    },
  });
  return result;
}

/**
 * Helper to determine if a claim is ready to be claimed
 */
export function isClaimReady(releaseAt: {
  at_height?: number;
  at_time?: string;
  never?: {};
}): boolean {
  if ('never' in releaseAt) {
    return false;
  }

  if ('at_time' in releaseAt) {
    // Time is in nanoseconds
    const releaseTimeNs = parseInt(releaseAt.at_time!);
    const releaseTimeMs = releaseTimeNs / 1_000_000;
    return Date.now() >= releaseTimeMs;
  }

  // For height-based, we'd need current block height
  // For now, return false (would need chain query to compare)
  return false;
}

/**
 * Format release time for display
 */
export function formatReleaseTime(releaseAt: {
  at_height?: number;
  at_time?: string;
  never?: {};
}): string {
  if ('never' in releaseAt) {
    return 'Never';
  }

  if ('at_time' in releaseAt) {
    const releaseTimeNs = parseInt(releaseAt.at_time!);
    const releaseTimeMs = releaseTimeNs / 1_000_000;
    const date = new Date(releaseTimeMs);

    if (Date.now() >= releaseTimeMs) {
      return 'Ready to claim';
    }

    return date.toLocaleString();
  }

  if ('at_height' in releaseAt) {
    return `Block ${releaseAt.at_height}`;
  }

  return 'Unknown';
}

/**
 * Format unstaking duration for display
 */
export function formatUnstakingDuration(
  duration: { height?: number; time?: number } | null | undefined,
): string {
  if (!duration) {
    return 'None';
  }

  if ('time' in duration) {
    const seconds = duration.time!;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  if ('height' in duration) {
    return `${duration.height} blocks`;
  }

  return 'Unknown';
}
