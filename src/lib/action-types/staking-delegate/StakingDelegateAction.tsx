import { StakingDelegateView } from '@/lib/action-types/staking-delegate/StakingDelegateView';
import { TrendingUp } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { createStargateTypeGuard, StargateActionWithDecoded } from '../stargate-helpers';
import { StakingDelegateForm } from './StakingDelegateForm';

// Type definition for the decoded value
export type StakingDelegateValue = {
  delegatorAddress: string;
  validatorAddress: string;
  amount: { denom: string; amount: string };
};

// Type definition for Staking Delegate message (use the base type for consistency)
export type StakingDelegateMsg = StargateActionWithDecoded<StakingDelegateValue>;

// Type guard with automatic base64 decoding
export const isStakingDelegate = createStargateTypeGuard<StakingDelegateValue>(
  '/cosmos.staking.v1beta1.MsgDelegate',
  (value) => {
    // Additional validation: ensure required fields exist
    return (
      typeof value === 'object' &&
      value !== null &&
      'validatorAddress' in value &&
      'amount' in value
    );
  },
);

// Export the action type configuration
export const StakingDelegateActionType: ActionType<StakingDelegateMsg> = {
  id: 'staking_delegate',
  name: 'Delegate Stake',
  icon: TrendingUp,
  guard: isStakingDelegate,
  getTitle: () => 'Delegate Stake',
  expandable: true,
  FormEditor: StakingDelegateForm,
  ViewComponent: StakingDelegateView,
};
