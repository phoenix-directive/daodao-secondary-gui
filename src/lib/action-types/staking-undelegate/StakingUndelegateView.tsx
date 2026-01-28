import { AddressLink } from '@/components/ui/address-link';
import { fromBaseUnits } from '@/hooks';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { usePrices } from '@/hooks/usePrices';
import { useValidators } from '@/hooks/useValidators';
import { getStargateValue } from '@/lib/action-types/stargate-helpers';
import type { StakingUndelegateMsg } from './StakingUndelegateAction';

export function StakingUndelegateView({ data }: { data: StakingUndelegateMsg }) {
  const value = getStargateValue(data);
  const { getPrice } = usePrices();

  const clients = useChain(Chain.Terra);

  // Get price info for the token
  const priceData = getPrice(value.amount.denom);
  const decimals = priceData?.decimals || 6;
  const displayAmount = fromBaseUnits(value.amount.amount, decimals);
  const displayDenom = priceData?.display || value.amount.denom;

  // Fetch validators to get the moniker
  const { data: validators } = useValidators(clients);
  const validator = validators.value?.find((v) => v.address === value.validatorAddress);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Validator:</span>
        <div className="flex items-center gap-2">
          {validator ? (
            <>
              <span className="font-medium">{validator.moniker}</span>
              <span className="text-xs text-muted-foreground">
                ({validator.commission.toFixed(2)} commission)
              </span>
            </>
          ) : (
            <AddressLink address={value.validatorAddress} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Amount:</span>
        <span className="font-medium">
          {displayAmount} {displayDenom}
        </span>
      </div>
    </div>
  );
}
