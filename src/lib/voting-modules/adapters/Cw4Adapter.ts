/**
 * Adapter for CW4 voting modules
 *
 * CW4 voting modules require two queries:
 * 1. Query voting module for group_contract address (cached 7 days)
 * 2. Query group contract for list_members (paginated)
 */

import { ChainClients } from '@/hooks/helpers/ChainService';
import { VotingModuleType } from '../constants';
import { Member, MembersResponse, VotingModuleAdapter } from '../types';

export interface Cw4Member {
  addr: string;
  weight: number;
}

export interface ListMembersResponse {
  members: Cw4Member[];
}

export interface TotalWeightResponse {
  weight: number;
}

export class Cw4Adapter implements VotingModuleAdapter {
  private votingModuleAddress: string;
  private chain: ChainClients;

  constructor(votingModuleAddress: string, chain: ChainClients) {
    this.votingModuleAddress = votingModuleAddress;
    this.chain = chain;
  }

  async getGroupContract(): Promise<string> {
    const cacheTime = 7 * 24 * 60; // 7 days in minutes
    const result = await this.chain.read.queryCached<string>(
      this.votingModuleAddress,
      { group_contract: {} },
      cacheTime,
    );

    return result;
  }

  async fetchTotal(): Promise<string> {
    const groupContract = await this.getGroupContract();
    const result = await this.chain.read.query<TotalWeightResponse>(groupContract, {
      total_weight: {},
    });

    return String(result.weight);
  }

  async fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse> {
    const groupContract = await this.getGroupContract();

    const result = await this.chain.read.query<ListMembersResponse>(groupContract, {
      list_members: {
        limit,
        start_after: startAfter,
      },
    });

    // Filter out members with 0 weight
    const members: Member[] = result.members
      .filter((member: Cw4Member) => member.weight > 0)
      .map((member: Cw4Member) => ({
        address: member.addr,
        votingPower: member.weight.toString(),
      }));

    return {
      members,
      hasMore: result.members.length === limit,
      decimals: 0,
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

      // Use last member's address as cursor for next page
      const lastMember = response.members[response.members.length - 1];
      if (lastMember) {
        startAfter = lastMember.address;
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
    return VotingModuleType.CW4;
  }
}
