import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrices } from '@/hooks/usePrices';
import { useMemo } from 'react';

interface AmountDisplayProps {
  amount: string;
  denom: string;
  showUsd?: boolean;
}

export function AmountDisplay({ amount, denom, showUsd = true }: AmountDisplayProps) {
  const { getPrice, prices } = usePrices();

  const { displayAmount, displayDenom, usdValue } = useMemo(() => {
    const priceData = getPrice(denom);

    if (priceData) {
      const numAmount = Number(amount) / Math.pow(10, priceData.decimals);
      const usd = numAmount * Number(priceData.price_usd);

      return {
        displayAmount: numAmount.toLocaleString(undefined, {
          maximumFractionDigits: 6,
        }),
        displayDenom: priceData.display,
        usdValue: usd.toLocaleString(undefined, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
    }

    // Fallback if no price data
    return {
      displayAmount: Number(amount).toLocaleString(),
      displayDenom: denom,
      usdValue: null,
    };
  }, [amount, denom, getPrice, prices]);

  const showTooltip = displayDenom !== denom;

  return (
    <div className="flex items-baseline gap-2">
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium cursor-help">
              {displayAmount} {displayDenom}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {amount} {denom}
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="font-medium">
          {displayAmount} {displayDenom}
        </span>
      )}
      {showUsd && usdValue && <span className="text-sm text-muted-foreground">≈ {usdValue}</span>}
    </div>
  );
}
