import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StakingUndelegateMsg } from './StakingUndelegateAction';

export function StakingUndelegateForm({
  data,
  onUpdate,
}: {
  data: StakingUndelegateMsg;
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
