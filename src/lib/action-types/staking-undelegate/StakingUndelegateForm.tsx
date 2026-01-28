import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fromBaseUnits, toBaseUnits, useDelegations } from '@/hooks';
import { useChainByContract } from '@/hooks/useChain';
import { useValidators } from '@/hooks/useValidators';
import { getStargateValue, updateStargateValue } from '@/lib/action-types/stargate-helpers';
import { useProposalFormContext } from '@/lib/proposal-form-context';
import { useEffect, useMemo, useState } from 'react';
import type { StakingUndelegateMsg } from './StakingUndelegateAction';

export function StakingUndelegateForm({
  data,
  onUpdate,
}: {
  data: StakingUndelegateMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const value = getStargateValue(data);
  const { balances, daoAddress } = useProposalFormContext();

  // Get chain info from the DAO address
  const chain = useChainByContract(daoAddress);

  // Fetch validators and delegations
  const { data: validators, loading: validatorsLoading } = useValidators(chain);
  const { data: delegations, loading: delegationsLoading } = useDelegations(chain, daoAddress);

  // Get native token info from chain config
  const defaultCurrency = chain.config.network.defaultCurrency;
  const nativeDenom = defaultCurrency?.coinMinimalDenom || 'uluna';
  const decimals = defaultCurrency?.coinDecimals || 6;
  const denom = value.amount?.denom || nativeDenom;

  // Find the balance for the native token
  const nativeToken = balances.data.value?.find((b) => b.denom === nativeDenom);

  // Filter validators to only show those with active delegations
  const validatorsWithDelegations = useMemo(() => {
    if (!validators.value || !delegations.value) return [];

    const delegationMap = new Map(delegations.value.map((d) => [d.validatorAddress, d]));

    return validators.value
      .filter((v) => delegationMap.has(v.address))
      .map((v) => ({
        ...v,
        delegation: delegationMap.get(v.address)!,
      }));
  }, [validators.value, delegations.value]);

  // Get current delegation amount for selected validator
  const currentDelegation = useMemo(() => {
    if (!value.validatorAddress || !delegations.value) return null;
    return delegations.value.find((d) => d.validatorAddress === value.validatorAddress);
  }, [value.validatorAddress, delegations.value]);

  // Convert from base units for display
  const displayAmount = fromBaseUnits(value.amount?.amount || '0', decimals);

  // Local state for input value
  const [inputValue, setInputValue] = useState(displayAmount);

  // Set delegatorAddress to daoAddress if it's empty
  useEffect(() => {
    if (!value.delegatorAddress && daoAddress) {
      updateStargateValue(data, onUpdate, { delegatorAddress: daoAddress });
    }
  }, [daoAddress, value.delegatorAddress, data, onUpdate]);

  const handleValidatorChange = (validatorAddress: string) => {
    updateStargateValue(data, onUpdate, {
      delegatorAddress: daoAddress,
      validatorAddress,
    });
  };

  const handleAmountBlur = () => {
    // Convert to base units for storage
    const baseAmount = inputValue === '' ? '0' : toBaseUnits(inputValue, decimals);
    const amount = { denom, amount: baseAmount };
    updateStargateValue(data, onUpdate, {
      delegatorAddress: daoAddress,
      amount,
    });
  };

  const setMaxAmount = () => {
    if (!currentDelegation) return;

    const maxAmount = fromBaseUnits(currentDelegation.amount, decimals);
    setInputValue(maxAmount);

    // Update the form data immediately
    const amount = { denom: currentDelegation.denom, amount: currentDelegation.amount };
    updateStargateValue(data, onUpdate, {
      delegatorAddress: daoAddress,
      amount,
    });
  };

  const selectedValidator = validatorsWithDelegations.find(
    (v) => v.address === value.validatorAddress,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Validator</Label>
        <Select value={value.validatorAddress || ''} onValueChange={handleValidatorChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select validator to undelegate from">
              {selectedValidator ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{selectedValidator.moniker}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {selectedValidator.commission}% commission
                  </span>
                </div>
              ) : (
                'Select validator to undelegate from'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {validatorsLoading.value || delegationsLoading.value ? (
              <SelectItem value="_loading" disabled>
                Loading delegations...
              </SelectItem>
            ) : validatorsWithDelegations.length > 0 ? (
              validatorsWithDelegations.map((validator) => (
                <SelectItem key={validator.address} value={validator.address}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{validator.moniker}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {fromBaseUnits(validator.delegation.amount, decimals)}{' '}
                      {defaultCurrency?.coinDenom || denom}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="_empty" disabled>
                No active delegations
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleAmountBlur}
            placeholder="0.00"
            className="flex-1"
          />
          <div className="flex items-center px-3 py-2 border rounded-md bg-muted text-sm">
            {defaultCurrency?.coinDenom || denom}
          </div>
        </div>
        {currentDelegation && (
          <p className="text-xs text-muted-foreground">
            Delegated:{' '}
            <button
              type="button"
              onClick={setMaxAmount}
              className="text-primary hover:underline cursor-pointer font-medium"
            >
              {fromBaseUnits(currentDelegation.amount, decimals)}
            </button>{' '}
            {defaultCurrency?.coinDenom || denom}
          </p>
        )}
      </div>
    </div>
  );
}
