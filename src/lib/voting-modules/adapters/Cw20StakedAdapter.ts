/**
 * Adapter for CW20 Staked voting modules
 *
 * CW20 staked voting modules require two queries:
 * 1. Query voting module for staking_contract address (cached 7 days)
 * 2. Query staking contract for list_stakers (paginated)
 */

import { ChainClients } from '@/hooks/helpers/ChainService';
import { VotingModuleType } from '../constants';
import { Member, MembersResponse, VotingModuleAdapter } from '../types';

export interface StakerBalanceResponse {
  address: string;
  balance: string; // Uint128
}

export interface ListStakersResponse {
  stakers: StakerBalanceResponse[];
}

export interface TotalValueResponse {
  total: string; // Uint128
}

export class Cw20StakedAdapter implements VotingModuleAdapter {
  private votingModuleAddress: string;
  private chain: ChainClients;

  constructor(votingModuleAddress: string, chain: ChainClients) {
    this.votingModuleAddress = votingModuleAddress;
    this.chain = chain;
  }

  async getStakingContract(): Promise<string> {
    const cacheTime = 7 * 24 * 60; // 7 days in minutes
    const result = await this.chain.read.queryCached<string>(
      this.votingModuleAddress,
      { staking_contract: {} },
      cacheTime,
    );

    return result;
  }

  async fetchTotal(): Promise<string> {
    const stakingContract = await this.getStakingContract();
    const result = (await this.chain.read.query(stakingContract, {
      total_value: {},
    })) as TotalValueResponse;

    return result.total;
  }

  async fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse> {
    const stakingContract = await this.getStakingContract();

    const result = (await this.chain.read.query(stakingContract, {
      list_stakers: {
        limit,
        start_after: startAfter,
      },
    })) as ListStakersResponse;

    // Filter out members with 0 balance
    const members: Member[] = result.stakers
      //   .filter((staker: StakerBalanceResponse) => BigInt(staker.balance) > BigInt(0))
      .map((staker: StakerBalanceResponse) => ({
        address: staker.address,
        votingPower: staker.balance,
      }));

    return {
      members,
      hasMore: result.stakers.length === limit,
      decimals: 6,
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
    return 6;
  }

  getType(): VotingModuleType {
    return VotingModuleType.CW20_STAKED;
  }
}
