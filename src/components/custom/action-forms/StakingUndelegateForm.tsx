import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StakingUndelegateFormProps {
  data: {
    stargate: {
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate';
      value: {
        delegatorAddress: string;
        validatorAddress: string;
        amount: { denom: string; amount: string };
      };
    };
  };
  onUpdate: (path: string[], value: any) => void;
}

export function StakingUndelegateForm({ data, onUpdate }: StakingUndelegateFormProps) {
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
