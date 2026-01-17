/**
 * Central registry of all action types.
 * Import this file to ensure all action types are registered.
 */

import { actionRegistry } from '../action-registry';
import { BankSendActionType } from './bank-send';
import { CW20SendActionType } from './cw20-send';
import { CW20TransferActionType } from './cw20-transfer';
import { GovVoteActionType } from './gov-vote';
import { StakingDelegateActionType } from './staking-delegate';
import { StakingUndelegateActionType } from './staking-undelegate';
import { StargateGovVoteActionType } from './stargate-gov-vote';
import { WasmExecuteActionType } from './wasm-execute';
import { WasmUpdateAdminActionType } from './wasm-update-admin';

// Register all action types
// Order matters: more specific types should come before more general ones
actionRegistry.registerAll([
  // CW20 Send and Transfer must come before generic Wasm Execute
  CW20SendActionType,
  CW20TransferActionType,

  // Specific message types
  BankSendActionType,
  StakingDelegateActionType,
  StakingUndelegateActionType,
  GovVoteActionType,
  StargateGovVoteActionType,
  WasmUpdateAdminActionType,

  // Generic Wasm Execute should be last among wasm types
  WasmExecuteActionType,
]);

// Export all action types for direct access if needed
export {
  BankSendActionType,
  CW20SendActionType,
  CW20TransferActionType,
  GovVoteActionType,
  StakingDelegateActionType,
  StakingUndelegateActionType,
  StargateGovVoteActionType,
  WasmExecuteActionType,
  WasmUpdateAdminActionType,
};

// Export the registry
export { actionRegistry };
