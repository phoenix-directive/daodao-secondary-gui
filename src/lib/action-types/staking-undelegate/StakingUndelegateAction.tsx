import { TrendingDown } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { StakingUndelegateForm } from './StakingUndelegateForm';

// Type definition for Staking Undelegate message
export type StakingUndelegateMsg = {
  stargate: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate';
    value: {
      delegatorAddress: string;
      validatorAddress: string;
      amount: { denom: string; amount: string };
    };
  };
};

// Type guard
export const isStakingUndelegate = (data: any): data is StakingUndelegateMsg => {
  return data?.stargate?.typeUrl === '/cosmos.staking.v1beta1.MsgUndelegate';
};

// Export the action type configuration
export const StakingUndelegateActionType: ActionType<StakingUndelegateMsg> = {
  id: 'staking_undelegate',
  name: 'Undelegate Stake',
  icon: TrendingDown,
  guard: isStakingUndelegate,
  getTitle: () => 'Undelegate Stake',
  expandable: false,
  FormEditor: StakingUndelegateForm,
};
