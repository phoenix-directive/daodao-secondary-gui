export interface AstroportTuneInfoResponse {
  new_emissions_state: NewEmissionsState;
  next_pools_grouped: Record<string, [string, string][]>;
}

export interface NewEmissionsState {
  xastro_rate: string;
  collected_astro: string;
  ema: string;
  emissions_amount: string;
}

export type VotedPoolsResponse = [string, PoolVote][];

export interface PoolVote {
  init_ts: number;
  voting_power: string;
}

export interface PairResponse {
  asset_infos: AssetInfo[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: PairType;
}

export interface AssetInfo {
  native_token: NativeToken;
}

export interface NativeToken {
  denom: string;
}

export interface PairType {
  custom: string;
}

