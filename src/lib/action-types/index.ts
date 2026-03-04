/**
 * Central registry of all action types.
 * Import this file to ensure all action types are registered.
 */

import { actionRegistry } from '../action-registry';
import { BankBurnActionType } from './bank-burn/BankBurnAction';
import { BankSendActionType } from './bank-send/BankSendAction';
import { CW20SendActionType } from './cw20-send/CW20SendAction';
import { CW20TransferActionType } from './cw20-transfer/CW20TransferAction';
import { GovVoteActionType } from './gov-vote/GovVoteAction';
import { PaymentSetupActionType } from './payment-setup';
import { StakingDelegateActionType } from './staking-delegate/StakingDelegateAction';
import { StakingUndelegateActionType } from './staking-undelegate/StakingUndelegateAction';
import { StargateGovVoteActionType } from './stargate-gov-vote/StargateGovVoteAction';
import { WasmExecuteActionType } from './wasm-execute/WasmExecuteAction';
import { WasmUpdateAdminActionType } from './wasm-update-admin/WasmUpdateAdminAction';

// Register all action types
// Order matters: more specific types should come before more general ones
actionRegistry.registerAll([
  // CW20 Send and Transfer must come before generic Wasm Execute
  CW20SendActionType,
  CW20TransferActionType,

  // Specific message types
  BankSendActionType,
  BankBurnActionType,
  StakingDelegateActionType,
  StakingUndelegateActionType,
  GovVoteActionType,
  StargateGovVoteActionType,
  WasmUpdateAdminActionType,

  // Payment setup must come before generic Wasm Execute
  PaymentSetupActionType,

  // Generic Wasm Execute should be last among wasm types
  WasmExecuteActionType,
]);

// Export all action types for direct access if needed
export {
  BankBurnActionType,
  BankSendActionType,
  CW20SendActionType,
  CW20TransferActionType,
  GovVoteActionType,
  PaymentSetupActionType,
  StakingDelegateActionType,
  StakingUndelegateActionType,
  StargateGovVoteActionType,
  WasmExecuteActionType,
  WasmUpdateAdminActionType,
};

// Export the registry
export { actionRegistry };
