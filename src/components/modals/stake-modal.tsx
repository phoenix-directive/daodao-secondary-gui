/**
 * StakeModal - Imperative modal for staking tokens
 * Supports both CW20 and native tokens
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
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { isCw20 } from '@/hooks/helpers/helpers';
import { fromBaseUnits, toBaseUnits } from '@/hooks/useBalances';
import { usePrices } from '@/hooks/usePrices';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { ModalComponentProps } from '@/lib/modal-service';
import { useEffect, useMemo, useState } from 'react';

interface StakeModalData {
  tokenBalance: string;
  tokenDecimals: number;
  tokenDenom: string;
  tokenDisplay: string;
  tokenAddress: string;
  stakingContract: string;
}

type StakeModalProps = ModalComponentProps<boolean, StakeModalData>;

export function StakeModal({ open, onOpenChange, onResolve, modalProps }: StakeModalProps) {
  if (!modalProps) {
    throw new Error('StakeModal requires modalProps');
  }

  const { tokenBalance, tokenDecimals, tokenDenom, tokenDisplay, tokenAddress, stakingContract } =
    modalProps;
  const [inputValue, setInputValue] = useState('');
  const { getPrice } = usePrices();
  const userAddress = useAddress(Chain.Terra);

  const stakeMessages = useMemo(() => {
    const baseAmount = toBaseUnits(inputValue, tokenDecimals);
    if (!stakingContract || !userAddress || +baseAmount <= 0) return [];

    if (isCw20(tokenDenom)) {
      // CW20: Use send message to token contract
      return tokenAddress
        ? [
            new MsgExecuteContract({
              sender: userAddress,
              contract: tokenAddress,
              msg: {
                send: {
                  contract: stakingContract,
                  amount: baseAmount,
                  msg: btoa(JSON.stringify({ stake: {} })),
                },
              },
              funds: [],
            }),
          ]
        : [];
    } else {
      // Native: Directly call staking contract with funds
      return [
        new MsgExecuteContract({
          sender: userAddress,
          contract: stakingContract,
          msg: { stake: {} },
          funds: [{ denom: tokenDenom, amount: baseAmount }],
        }),
      ];
    }
  }, [tokenAddress, stakingContract, userAddress, inputValue, tokenDecimals, tokenDenom]);

  const stakeTx = useTx(stakeMessages, {
    title: 'Stake Tokens',
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
    if (!tokenBalance) return;
    setInputValue(fromBaseUnits(tokenBalance, tokenDecimals || 6));
  };

  // Calculate USD value
  const priceData = tokenDenom ? getPrice(tokenDenom) : null;
  const usdValue =
    priceData && inputValue
      ? (parseFloat(inputValue) * parseFloat(priceData.price_usd)).toFixed(2)
      : null;

  const isValid = inputValue && parseFloat(inputValue) > 0;
  const exceedsBalance =
    inputValue && tokenDecimals && tokenBalance
      ? BigInt(toBaseUnits(inputValue, tokenDecimals)) > BigInt(tokenBalance)
      : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Stake Tokens</DialogTitle>
          <DialogDescription>
            Stake your {tokenDisplay} tokens to gain voting power in this DAO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Balance:</span>
            <span className="font-medium">
              {tokenBalance && tokenDecimals ? fromBaseUnits(tokenBalance, tokenDecimals) : '0'}{' '}
              {tokenDisplay || 'Token'}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="stake-amount">Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="stake-amount"
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
              <p className="text-sm text-destructive">Amount exceeds available balance</p>
            )}
            {usdValue && <p className="text-sm text-muted-foreground">≈ ${usdValue} USD</p>}
          </div>

          {/* Stake Button */}
          <Button
            onClick={() => stakeTx.broadcast()}
            disabled={
              !isValid || exceedsBalance || stakeTx.buttonProps.disabled || stakeTx.result.loading
            }
            className="w-full"
          >
            <TxButtonContent tx={stakeTx}>Stake Tokens</TxButtonContent>
          </Button>
        </div>
        <ErrorDisplay errors={stakeTx.buttonProps.errors} title="Validation Errors" />
      </DialogContent>
    </Dialog>
  );
}
