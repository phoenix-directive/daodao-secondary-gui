/**
 * Common types for voting module adapters
 */

import { VotingModuleType } from './constants';

/**
 * Represents a member with voting power
 */
export interface Member {
  address: string;
  votingPower: string; // Uint128 as string
}

/**
 * Response from fetching members
 */
export interface MembersResponse {
  members: Member[];
  hasMore: boolean;
  decimals: number; // Number of decimals for voting power display
  nextKey?: string; // Pagination cursor for the next page (adapter-specific)
}

/**
 * Configuration for a voting module adapter
 */
export interface VotingModuleConfig {
  votingModuleAddress: string;
  type: VotingModuleType;
}

/**
 * Abstract interface for voting module adapters
 * Each voting module type implements this to fetch members
 */
export interface VotingModuleAdapter {
  /**
   * Fetch the total voting power/weight for percentage calculations
   * This should be called once and memoized by the consuming component
   */
  fetchTotal(): Promise<string>;

  /**
   * Fetch members with pagination
   * @param limit Maximum number of members to fetch
   * @param startAfter Pagination cursor (adapter-specific: could be an address or RPC key)
   * @returns Promise<MembersResponse>
   */
  fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse>;

  /**
   * Fetch all members iteratively
   * This method automatically handles pagination and fetches all members
   * @returns Promise<MembersResponse> All members with hasMore always false
   */
  fetchMembersAll(): Promise<MembersResponse>;

  fetchDecimals(): Promise<number>;

  /**
   * Get the voting module type
   */
  getType(): VotingModuleType;
}
