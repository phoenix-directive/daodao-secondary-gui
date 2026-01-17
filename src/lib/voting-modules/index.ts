/**
 * Voting Modules - Main exports
 *
 * This module provides a flexible system for querying members from different
 * types of DAO voting modules (CW20, CW4, Token Staked, etc.)
 */

export { createVotingModuleAdapter, type ContractInfo, type InfoResponse } from './adapter-factory';
export {
  ContractName,
  DAO_VOTING_CW20_STAKED_CONTRACT_NAMES,
  DAO_VOTING_CW4_CONTRACT_NAMES,
  DAO_VOTING_CW721_STAKED_CONTRACT_NAMES,
  DAO_VOTING_NATIVE_STAKED_CONTRACT_NAMES,
  DAO_VOTING_ONFT_STAKED_CONTRACT_NAMES,
  DAO_VOTING_SG_COMMUNITY_NFT_CONTRACT_NAMES,
  DAO_VOTING_TOKEN_STAKED_CONTRACT_NAMES,
  VotingModuleType,
  getVotingModuleType,
} from './constants';
export type { Member, MembersResponse, VotingModuleAdapter, VotingModuleConfig } from './types';
