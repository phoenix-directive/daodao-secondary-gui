/**
 * Adapter for CW721 Staked voting modules
 *
 * CW721 staked modules store member data in raw contract state using cw-storage-plus.
 * We need to query the RPC endpoint directly and parse the state keys/values:
 *
 * - Keys: Hex-encoded with format `00026e62` (prefix "\x00\x02nb") + hex(terra_address)
 * - Values: Base64-encoded JSON strings containing token counts (e.g., "2", "29")
 *
 * Example key: 00026e627465727261313061346d79...
 *   → Decodes to: \x00\x02nb + terra10a4mywgdtf4feaafu7csqhvxk0ugsywl5z0hem
 *
 * Example value: IjIi
 *   → Decodes to: "2" (2 NFTs staked)
 *
 * The "nb" prefix specifically marks member balances in the storage.
 */

import { ChainClients } from '@/hooks/helpers/ChainService';
import { VotingModuleType } from '../constants';
import { Member, MembersResponse, VotingModuleAdapter } from '../types';

export interface TotalPowerResponse {
  power: string;
  height: number;
}

export class Cw721StakedAdapter implements VotingModuleAdapter {
  private votingModuleAddress: string;
  private chain: ChainClients;

  constructor(votingModuleAddress: string, chain: ChainClients) {
    this.votingModuleAddress = votingModuleAddress;
    this.chain = chain;
  }

  /**
   * Parse hex-encoded key to extract terra address
   * Key format: 00 02 6e 62 + hex(terra_address)
   * Where: 00 02 = length control bytes, 6e 62 = "nb" (namespace), rest = address
   */
  private parseKey(hexKey: string): string | null {
    try {
      // Check if it starts with the member prefix
      const MEMBER_PREFIX_HEX = '00026e62';
      if (!hexKey.toLowerCase().startsWith(MEMBER_PREFIX_HEX)) {
        return null;
      }

      // Extract the address part (after prefix)
      const addressHex = hexKey.substring(MEMBER_PREFIX_HEX.length);

      // Convert hex to string
      const address = Buffer.from(addressHex, 'hex').toString('utf8');

      // Validate it's a terra address
      if (address.startsWith('terra1')) {
        return address;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse base64-encoded value to get token count
   * Value format: base64(JSON string like "2" or "29")
   */
  private parseValue(base64Value: string): string {
    try {
      const jsonString = Buffer.from(base64Value, 'base64').toString('utf8');
      const value = JSON.parse(jsonString);
      return String(value);
    } catch (error) {
      return '0';
    }
  }

  /**
   * Query total power for percentage calculations
   */
  async fetchTotal(): Promise<string> {
    const result = (await this.chain.read.query(this.votingModuleAddress, {
      total_power_at_height: {},
    })) as TotalPowerResponse;

    return result.power;
  }

  /**
   * Fetch contract state using ReadService queryRaw
   * Uses RPC endpoint directly for optimal performance
   */
  private async fetchContractState(
    limit: number,
    paginationKey?: string,
  ): Promise<{
    models: Array<{ key: string; value: string }>;
    pagination?: { next_key: string | null };
  }> {
    return this.chain.read.queryRaw(this.votingModuleAddress, limit, paginationKey);
  }

  async fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse> {
    const members: Member[] = [];
    // startAfter is the RPC pagination key, not a wallet address
    let paginationKey: string | undefined = startAfter;
    let hasMore = false;
    let nextKey: string | undefined = undefined;

    // Fetch pages until we have enough members or run out
    while (members.length < limit) {
      const membersBeforeFetch = members.length;
      const stateResponse = await this.fetchContractState(limit, paginationKey);

      for (const model of stateResponse.models) {
        const address = this.parseKey(model.key);

        if (!address) {
          continue; // Not a member key
        }

        const votingPower = this.parseValue(model.value);
        const votingPowerBig = BigInt(votingPower);

        // Filter out zero power members
        if (votingPowerBig === BigInt(0)) {
          continue;
        }

        members.push({
          address,
          votingPower,
        });

        // Stop if we have enough
        if (members.length >= limit) {
          hasMore = true;
          break;
        }
      }

      // If we fetched data but got no valid members, we've reached the end
      if (members.length === membersBeforeFetch && stateResponse.models.length > 0) {
        hasMore = false;
        nextKey = undefined;
        break;
      }

      // Check if there's more data to fetch
      if (stateResponse.pagination?.next_key) {
        nextKey = stateResponse.pagination.next_key;
        paginationKey = nextKey;

        // If we already have enough members, mark hasMore and break
        if (members.length >= limit) {
          hasMore = true;
          break;
        }
      } else {
        // No more pages
        nextKey = undefined;
        break;
      }
    }

    // If no members were returned, we've reached the end
    if (members.length === 0) {
      hasMore = false;
      nextKey = undefined;
    }

    return {
      members,
      hasMore,
      decimals: 0,
      nextKey: hasMore ? nextKey : undefined,
    };
  }

  async fetchMembersAll(): Promise<MembersResponse> {
    const allMembers: Member[] = [];
    let startAfter: string | undefined = undefined;
    const decimals = await this.fetchDecimals();

    while (true) {
      const response = await this.fetchMembers(1000, startAfter);
      allMembers.push(...response.members);

      if (!response.hasMore) {
        break;
      }

      // Use nextKey from response for CW721 (RPC pagination key)
      if (response.nextKey) {
        startAfter = response.nextKey;
      } else {
        break;
      }
    }

    return {
      members: allMembers,
      hasMore: false,
      decimals,
    };
  }

  async fetchDecimals(): Promise<number> {
    return 0;
  }

  getType(): VotingModuleType {
    return VotingModuleType.CW721_STAKED;
  }
}
