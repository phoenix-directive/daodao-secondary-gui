/**
 * Adapter for Token Staked and Native Staked voting modules
 *
 * These modules directly support list_stakers query without intermediate contract
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

export class TokenStakedAdapter implements VotingModuleAdapter {
  private votingModuleAddress: string;
  private chain: ChainClients;
  private type: VotingModuleType;

  constructor(
    votingModuleAddress: string,
    chain: ChainClients,
    type: VotingModuleType = VotingModuleType.TOKEN_STAKED,
  ) {
    this.votingModuleAddress = votingModuleAddress;
    this.chain = chain;
    this.type = type;
  }

  async fetchTotal(): Promise<string> {
    const cacheTime = 7 * 24 * 60; // 7 days in minutes
    const result = (await this.chain.read.queryCached(
      this.votingModuleAddress,
      { total_value: {} },
      cacheTime,
    )) as TotalValueResponse;

    return result.total;
  }

  async fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse> {
    const result = (await this.chain.read.query(this.votingModuleAddress, {
      list_stakers: {
        limit,
        start_after: startAfter,
      },
    })) as ListStakersResponse;

    // Filter out members with 0 balance
    const members: Member[] = result.stakers
      .filter((staker: StakerBalanceResponse) => BigInt(staker.balance) > BigInt(0))
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

  getType(): VotingModuleType {
    return this.type;
  }
}
