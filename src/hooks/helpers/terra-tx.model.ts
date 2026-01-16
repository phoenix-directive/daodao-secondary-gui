export interface TxPage {
  limit: number;
  txs: Tx[];
}

export interface Tx {
  id: string;
  chainId: string;
  tx: Tx2;
  code: number;
  data: string;
  info: string;
  logs: Log[];
  events: Event2[];
  height: string;
  txhash: string;
  raw_log: string;
  gas_used: string;
  codespace: string;
  timestamp: string;
  gas_wanted: string;
}

export interface Tx2 {
  body: Body;
  '@type': string;
  auth_info: AuthInfo;
  signatures: string[];
}

export interface Body {
  memo: string;
  messages: Message[];
  timeout_height: string;
  extension_options: any[];
  non_critical_extension_options: any[];
}

export interface Message {
  msg: any;
  '@type': string;
  sender: string;
  code_id: string;
  contract?: string;
  admin?: string;
  funds?: any[];
  label?: string;
}

export interface Lsd {
  name: string;
  disabled: boolean;
  lsd_type: LsdType;
}

export interface LsdType {
  eris: Eris;
}

export interface Eris {
  addr: string;
  cw20: string;
}

export interface FeeConfig {
  protocol_fee_contract: string;
  protocol_withdraw_fee: string;
  immediate_withdraw_fee: string;
  protocol_performance_fee: string;
}

export interface UtilizationMethod {
  steps: string[][];
}

export interface AuthInfo {
  fee: Fee;
  tip: any;
  signer_infos: SignerInfo[];
}

export interface Fee {
  payer: string;
  amount: Amount[];
  granter: string;
  gas_limit: string;
}

export interface Amount {
  denom: string;
  amount: string;
}

export interface SignerInfo {
  sequence: string;
  mode_info: ModeInfo;
  public_key: PublicKey;
}

export interface ModeInfo {
  single: Single;
}

export interface Single {
  mode: string;
}

export interface PublicKey {
  key: string;
  '@type': string;
}

export interface Log {
  log: string;
  events: LcdEvent[];
  msg_index: number;
}

export interface LcdEvent {
  type: string;
  attributes: Attribute[];
}

export interface Attribute {
  key: string;
  value: string;
}

export interface Event2 {
  type: string;
  attributes: Attribute2[];
}

export interface Attribute2 {
  key: string;
  index: boolean;
  value: string;
}

