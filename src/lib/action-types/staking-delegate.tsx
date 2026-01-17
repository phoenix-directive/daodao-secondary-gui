import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';
import { ActionType } from '../action-registry';

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
const isStakingDelegate = (data: any): data is StakingDelegateMsg => {
  return data?.stargate?.typeUrl === '/cosmos.staking.v1beta1.MsgDelegate';
};

// Form component
function StakingDelegateForm({
  data,
  onUpdate,
}: {
  data: StakingDelegateMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const value = data.stargate.value;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Delegator Address</Label>
        <Input
          value={value.delegatorAddress || ''}
          onChange={(e) => onUpdate(['stargate', 'value', 'delegatorAddress'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Validator Address</Label>
        <Input
          value={value.validatorAddress || ''}
          onChange={(e) => onUpdate(['stargate', 'value', 'validatorAddress'], e.target.value)}
          placeholder="cosmosvaloper1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input
          value={value.amount?.amount || ''}
          onChange={(e) => {
            const amount = { ...(value.amount || { denom: 'uluna', amount: '0' }) };
            amount.amount = e.target.value;
            onUpdate(['stargate', 'value', 'amount'], amount);
          }}
          placeholder="1000000"
        />
      </div>
      <div className="space-y-2">
        <Label>Denom</Label>
        <Input
          value={value.amount?.denom || ''}
          onChange={(e) => {
            const amount = { ...(value.amount || { denom: 'uluna', amount: '0' }) };
            amount.denom = e.target.value;
            onUpdate(['stargate', 'value', 'amount'], amount);
          }}
          placeholder="uluna"
        />
      </div>
    </div>
  );
}

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
