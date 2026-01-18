import { TrendingUp } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { StakingDelegateForm } from './StakingDelegateForm';

// Type definition for Staking Delegate message
export type StakingDelegateMsg = {
  stargate: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate';
    value: {
      delegatorAddress: string;
      validatorAddress: string;
      amount: { denom: string; amount: string };
    };
  };
};

// Type guard
export const isStakingDelegate = (data: any): data is StakingDelegateMsg => {
  return data?.stargate?.typeUrl === '/cosmos.staking.v1beta1.MsgDelegate';
};

// Export the action type configuration
export const StakingDelegateActionType: ActionType<StakingDelegateMsg> = {
  id: 'staking_delegate',
  name: 'Delegate Stake',
  icon: TrendingUp,
  guard: isStakingDelegate,
  getTitle: () => 'Delegate Stake',
  expandable: false,
  FormEditor: StakingDelegateForm,
};
