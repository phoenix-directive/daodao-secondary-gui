/**
 * Voting Module Contract Names and Type Detection
 *
 * This file contains constants for identifying different voting module types
 * used by DAOs. Each voting module type has different member query patterns.
 */

export enum ContractName {
  // Core contracts
  Cw1Whitelist = 'crates.io:cw1-whitelist',
  Cw3FixedMultisig = 'crates.io:cw3-fixed-multisig',
  Cw3FlexMultisig = 'crates.io:cw3-flex-multisig',
  CwTokenSwap = 'crates.io:cw-token-swap',
  CwPayrollFactory = 'crates.io:cw-payroll-factory',
  CwVesting = 'crates.io:cw-vesting',
  CwTokenfactoryIssuer = 'cw-tokenfactory-issuer',
  DaoProposalSingle = 'crates.io:dao-proposal-single',
  DaoVotingCw4 = 'crates.io:dao-voting-cw4',
  DaoVotingTokenStaked = 'crates.io:dao-voting-token-staked',
  PolytoneProxy = 'crates.io:polytone-proxy',
  PreProposeSingle = 'crates.io:dao-pre-propose-single',
  PreProposeMultiple = 'crates.io:dao-pre-propose-multiple',
  PreProposeApprovalSingle = 'crates.io:dao-pre-propose-approval-single',
  PreProposeApprovalMultiple = 'crates.io:dao-pre-propose-approval-multiple',
  PreProposeApprover = 'crates.io:dao-pre-propose-approver',
  NeutronCwdSubdaoCore = 'crates.io:cwd-subdao-core',
  NeutronCwdSubdaoPreProposeSingle = 'crates.io:cwd-subdao-pre-propose-single',
  NeutronCwdSubdaoTimelockSingle = 'crates.io:cwd-subdao-timelock-single',
  NeutronCwdPreProposeSingleOverrule = 'crates.io:cwd-pre-propose-single-overrule',
  OraichainCw20StakingProxySnapshot = 'cw20-staking-proxy-snapshot',
  ValenceAccount = 'crates.io:valence-account',
}

// Voting module contract name groups
export const DAO_VOTING_CW20_STAKED_CONTRACT_NAMES = [
  // V1
  'crates.io:cw20-staked-balance-voting',
  // V2+
  'crates.io:cwd-voting-cw20-staked',
  'crates.io:dao-voting-cw20-staked',
  // Secret
  'crates.io:dao-voting-snip20-staked',
];

export const DAO_VOTING_CW4_CONTRACT_NAMES = [
  // V1
  'crates.io:cw4-voting',
  // V2
  'crates.io:cwd-voting-cw4',
  ContractName.DaoVotingCw4,
];

export const DAO_VOTING_CW721_STAKED_CONTRACT_NAMES = [
  // V2+
  'crates.io:dao-voting-cw721-staked',
  // Secret
  'crates.io:dao-voting-snip721-staked',
];

export const DAO_VOTING_ONFT_STAKED_CONTRACT_NAMES = ['crates.io:dao-voting-onft-staked'];

export const DAO_VOTING_SG_COMMUNITY_NFT_CONTRACT_NAMES = ['crates.io:dao-voting-sg-community-nft'];

export const DAO_VOTING_TOKEN_STAKED_CONTRACT_NAMES = [ContractName.DaoVotingTokenStaked] as const;

export const DAO_VOTING_NATIVE_STAKED_CONTRACT_NAMES = [
  'crates.io:dao-voting-native-staked',
] as const;

/**
 * Enum for voting module types
 */
export enum VotingModuleType {
  CW20_STAKED = 'CW20_STAKED',
  CW4 = 'CW4',
  CW721_STAKED = 'CW721_STAKED',
  ONFT_STAKED = 'ONFT_STAKED',
  SG_COMMUNITY_NFT = 'SG_COMMUNITY_NFT',
  TOKEN_STAKED = 'TOKEN_STAKED',
  NATIVE_STAKED = 'NATIVE_STAKED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Determine voting module type from contract name
 */
export function getVotingModuleType(contractName: string): VotingModuleType {
  if ((DAO_VOTING_CW20_STAKED_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.CW20_STAKED;
  }
  if ((DAO_VOTING_CW4_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.CW4;
  }
  if ((DAO_VOTING_CW721_STAKED_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.CW721_STAKED;
  }
  if ((DAO_VOTING_ONFT_STAKED_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.ONFT_STAKED;
  }
  if ((DAO_VOTING_SG_COMMUNITY_NFT_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.SG_COMMUNITY_NFT;
  }
  if ((DAO_VOTING_TOKEN_STAKED_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.TOKEN_STAKED;
  }
  if ((DAO_VOTING_NATIVE_STAKED_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
    return VotingModuleType.NATIVE_STAKED;
  }
  return VotingModuleType.UNKNOWN;
}
