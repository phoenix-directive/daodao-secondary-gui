/**
 * UnstakeModal - Imperative modal for unstaking tokens
 * Supports both CW20 and native staked tokens
 */

import { TxButtonContent } from '@/components/custom/tx-button-content';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Duration } from '@/daodao/types/contracts/Cw20Stake';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { fromBaseUnits, toBaseUnits } from '@/hooks/useBalances';
import { usePrices } from '@/hooks/usePrices';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { ModalComponentProps } from '@/lib/modal-service';
import { formatUnstakingDuration } from '@/lib/staking/staking-helpers';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface UnstakeModalData {
  stakedBalance: string;
  tokenDecimals: number;
  tokenDenom: string;
  tokenDisplay: string;
  unstakingDuration: Duration | null | undefined;
  stakingContract: string;
}

type UnstakeModalProps = ModalComponentProps<boolean, UnstakeModalData>;

export function UnstakeModal({ open, onOpenChange, onResolve, modalProps }: UnstakeModalProps) {
  if (!modalProps) {
    throw new Error('UnstakeModal requires modalProps');
  }
  const {
    stakedBalance,
    tokenDecimals,
    tokenDenom,
    tokenDisplay,
    unstakingDuration,
    stakingContract,
  } = modalProps;
  const [inputValue, setInputValue] = useState('');
  const { getPrice } = usePrices();
  const userAddress = useAddress(Chain.Terra);

  const unstakeMessages = useMemo(() => {
    const baseAmount = toBaseUnits(inputValue, tokenDecimals);
    return stakingContract && userAddress && +baseAmount > 0
      ? [
          new MsgExecuteContract({
            sender: userAddress,
            contract: stakingContract,
            msg: {
              unstake: {
                amount: baseAmount,
              },
            },
            funds: [],
          }),
        ]
      : [];
  }, [stakingContract, userAddress, inputValue, tokenDecimals]);

  const unstakeTx = useTx(unstakeMessages, {
    title: 'Unstake Tokens',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      onResolve(true);
      onOpenChange(false);
    },
  });

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  const handleMaxClick = () => {
    if (!stakedBalance) return;
    setInputValue(fromBaseUnits(stakedBalance, tokenDecimals || 6));
  };

  // Calculate USD value
  const priceData = tokenDenom ? getPrice(tokenDenom) : null;
  const usdValue =
    priceData && inputValue
      ? (parseFloat(inputValue) * parseFloat(priceData.price_usd)).toFixed(2)
      : null;

  const isValid = inputValue && parseFloat(inputValue) > 0;
  const exceedsBalance =
    inputValue && tokenDecimals && stakedBalance
      ? BigInt(toBaseUnits(inputValue, tokenDecimals)) > BigInt(stakedBalance)
      : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Unstake Tokens</DialogTitle>
          <DialogDescription>
            Unstake your {tokenDisplay} tokens. They will be available to claim after the unstaking
            period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Unstaking Duration Warning */}
          {unstakingDuration && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Unstaking Period</p>
                <p className="text-muted-foreground">
                  Your tokens will be locked for {formatUnstakingDuration(unstakingDuration)} before
                  you can claim them.
                </p>
              </div>
            </div>
          )}

          {/* Staked Balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Staked Balance:</span>
            <span className="font-medium">
              {stakedBalance && tokenDecimals ? fromBaseUnits(stakedBalance, tokenDecimals) : '0'}{' '}
              {tokenDisplay || 'Token'}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="unstake-amount">Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="unstake-amount"
                  placeholder="0.0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className={exceedsBalance ? 'border-destructive' : ''}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {tokenDisplay}
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleMaxClick}>
                MAX
              </Button>
            </div>
            {exceedsBalance && (
              <p className="text-sm text-destructive">Amount exceeds staked balance</p>
            )}
            {usdValue && <p className="text-sm text-muted-foreground">≈ ${usdValue} USD</p>}
          </div>

          {/* Unstake Button */}
          <Button
            onClick={() => unstakeTx.broadcast()}
            disabled={
              !isValid ||
              exceedsBalance ||
              unstakeTx.buttonProps.disabled ||
              unstakeTx.result.loading
            }
            className="w-full"
          >
            <TxButtonContent tx={unstakeTx}>Unstake Tokens</TxButtonContent>
          </Button>
        </div>
        <ErrorDisplay errors={unstakeTx.buttonProps.errors} title="Validation Errors" />
      </DialogContent>
    </Dialog>
  );
}
