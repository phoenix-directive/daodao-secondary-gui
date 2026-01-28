import { TrendingDown } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { createStargateTypeGuard, StargateActionWithDecoded } from '../stargate-helpers';
import { StakingUndelegateForm } from './StakingUndelegateForm';
import { StakingUndelegateView } from './StakingUndelegateView';

// Type definition for the decoded value
export type StakingUndelegateValue = {
  delegatorAddress: string;
  validatorAddress: string;
  amount: { denom: string; amount: string };
};

// Type definition for Staking Undelegate message (use the base type for consistency)
export type StakingUndelegateMsg = StargateActionWithDecoded<StakingUndelegateValue>;

// Type guard with automatic base64 decoding
export const isStakingUndelegate = createStargateTypeGuard<StakingUndelegateValue>(
  '/cosmos.staking.v1beta1.MsgUndelegate',
  (value) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'validatorAddress' in value &&
      'amount' in value
    );
  },
);

// Export the action type configuration
export const StakingUndelegateActionType: ActionType<StakingUndelegateMsg> = {
  id: 'staking_undelegate',
  name: 'Undelegate Stake',
  icon: TrendingDown,
  guard: isStakingUndelegate,
  getTitle: () => 'Undelegate Stake',
  expandable: true,
  FormEditor: StakingUndelegateForm,
  ViewComponent: StakingUndelegateView,
};
