/**
 * StakingInterface - Complete UI for staked voting module membership management
 * Supports both CW20 staked and native staked voting modules
 * Includes staking, unstaking, and claiming functionality with dollar value displays
 */

import { StakeModal } from '@/components/modals/stake-modal';
import { UnstakeModal } from '@/components/modals/unstake-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExecuteMsg as Cw20StakeExecuteMsg } from '@/daodao/types/contracts/Cw20Stake';
import type { ExecuteMsg as NativeStakeExecuteMsg } from '@/daodao/types/contracts/DaoVotingNativeStaked';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { fromBaseUnits, useBalance } from '@/hooks/useBalances';
import { useChain } from '@/hooks/useChain';
import { usePrices } from '@/hooks/usePrices';
import { globalReload } from '@/hooks/useReload';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { modalService } from '@/lib/modal-service';
import {
  formatReleaseTime,
  formatUnstakingDuration,
  getStakingConfig,
  getStakingContract,
  getUserClaims,
  getUserStakedAmount,
  isClaimReady,
} from '@/lib/staking/staking-helpers';
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Clock, Loader2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';

interface StakingInterfaceProps {
  votingModuleAddress: string;
}

export function StakingInterface({ votingModuleAddress }: StakingInterfaceProps) {
  const chain = useChain(Chain.Terra);
  const userAddress = useAddress(Chain.Terra);
  const { getPrice } = usePrices();

  // Fetch staking contract and config (cached)
  // For CW20: votingModule -> staking_contract -> config
  // For Native: votingModule is the staking contract
  const stakingDataSignal = useAsyncSignal(async () => {
    try {
      // Try to get staking contract (CW20 pattern)
      const stakingContract = await getStakingContract(votingModuleAddress, chain);
      const config = await getStakingConfig(stakingContract, chain);
      return { stakingContract, config, isNative: false };
    } catch {
      // If that fails, assume native staking (voting module is the staking contract)
      const config = await getStakingConfig(votingModuleAddress, chain);
      return { stakingContract: votingModuleAddress, config, isNative: true };
    }
  }, [votingModuleAddress, chain]);

  const stakingData = stakingDataSignal.data.value;
  const stakingContract = stakingData?.stakingContract;
  const config = stakingData?.config;
  const isNative = stakingData?.isNative || false;
  const tokenAddress = config?.token_address;
  const tokenDenom = (config as any)?.denom || tokenAddress || '';

  // Fetch token balance using useBalance hook
  const tokenBalanceSignal = useBalance(userAddress, tokenDenom);

  // Get token decimals from price data
  const priceData = getPrice(tokenDenom);
  const tokenDecimals = priceData?.decimals || 6;
  const tokenDisplay = priceData?.display || 'Token';

  // Fetch user's staked amount
  const stakedAmountSignal = useAsyncSignal(async () => {
    if (!stakingContract || !userAddress) return '0';
    return getUserStakedAmount(stakingContract, userAddress, chain);
  }, [stakingContract, userAddress, globalReload.value]);

  // Fetch user's claims (unbondings)
  const claimsSignal = useAsyncSignal(async () => {
    if (!stakingContract || !userAddress) return { claims: [] };
    return getUserClaims(stakingContract, userAddress, chain);
  }, [stakingContract, userAddress, globalReload.value]);

  const tokenBalance = tokenBalanceSignal.data.value || '0';
  const stakedAmount = stakedAmountSignal.data.value || '0';
  const claims = useMemo(() => claimsSignal.data.value?.claims || [], [claimsSignal.data.value]);

  // Sort claims by release time (ascending)
  const sortedClaims = useMemo(
    () =>
      [...claims].sort((a, b) => {
        if ('at_time' in a.release_at && 'at_time' in b.release_at) {
          return parseInt(a.release_at.at_time!) - parseInt(b.release_at.at_time!);
        }
        return 0;
      }),
    [claims],
  );

  const readyClaims = useMemo(
    () => sortedClaims.filter((claim) => isClaimReady(claim.release_at)),
    [sortedClaims],
  );

  const totalClaimableAmount = useMemo(
    () => readyClaims.reduce((sum, claim) => sum + BigInt(claim.amount), BigInt(0)),
    [readyClaims],
  );

  // Claim transaction (kept here as it's a simple action)
  const claimMessages = useMemo(
    () =>
      stakingContract && userAddress && totalClaimableAmount > BigInt(0)
        ? [
            new MsgExecuteContract({
              sender: userAddress,
              contract: stakingContract,
              msg: {
                claim: {},
              } as Cw20StakeExecuteMsg | NativeStakeExecuteMsg,
              funds: [],
            }),
          ]
        : [],
    [stakingContract, userAddress, totalClaimableAmount],
  );

  const claimTx = useTx(claimMessages, {
    title: 'Claim Tokens',
    chainId: Chain.Terra,
  });

  const handleClaim = useCallback(async () => {
    if (!stakingContract || !userAddress) return;
    await claimTx.broadcast();
  }, [stakingContract, userAddress, claimTx]);

  // Open stake modal imperatively
  const handleOpenStakeModal = useCallback(async () => {
    if (!tokenDenom || !stakingContract) return;
    await modalService.open(StakeModal, {
      tokenBalance,
      tokenDecimals,
      tokenDenom,
      tokenDisplay,
      tokenAddress: tokenAddress || tokenDenom, // For CW20 use address, for native use denom
      stakingContract,
    });
  }, [tokenAddress, tokenDenom, stakingContract, tokenBalance, tokenDecimals, tokenDisplay]);

  // Open unstake modal imperatively
  const handleOpenUnstakeModal = useCallback(async () => {
    if (!stakingContract) return;
    await modalService.open(UnstakeModal, {
      stakedBalance: stakedAmount,
      tokenDecimals,
      tokenDenom,
      tokenDisplay,
      unstakingDuration: config?.unstaking_duration,
      stakingContract,
    });
  }, [
    stakingContract,
    stakedAmount,
    tokenDecimals,
    tokenDenom,
    tokenDisplay,
    config?.unstaking_duration,
  ]);

  // Format USD value
  const formatUsdValue = useCallback(
    (baseAmount: string): string | null => {
      if (!priceData || !baseAmount || baseAmount === '0') return (0).toFixed(2);

      const amount = parseFloat(fromBaseUnits(baseAmount, tokenDecimals));
      const usdValue = amount * parseFloat(priceData.price_usd);
      return usdValue.toFixed(2);
    },
    [priceData, tokenDecimals],
  );

  const isLoading =
    stakingDataSignal.loading.value ||
    tokenBalanceSignal.loading.value ||
    stakedAmountSignal.loading.value ||
    claimsSignal.loading.value;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading staking data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userAddress) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your wallet to manage your membership.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Available Balance Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available to Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {fromBaseUnits(tokenBalance, tokenDecimals)} {tokenDisplay}
              </p>
              {
                <p className="text-sm text-muted-foreground">
                  ≈ ${formatUsdValue(tokenBalance)} USD
                </p>
              }
            </div>
            <Button
              onClick={handleOpenStakeModal}
              disabled={BigInt(tokenBalance) <= BigInt(0)}
              className="w-full mt-4"
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Stake Tokens
            </Button>
          </CardContent>
        </Card>

        {/* Staked Balance Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {fromBaseUnits(stakedAmount, tokenDecimals)} {tokenDisplay}
              </p>
              {
                <p className="text-sm text-muted-foreground">
                  ≈ ${formatUsdValue(stakedAmount)} USD
                </p>
              }
            </div>
            <Button
              onClick={handleOpenUnstakeModal}
              disabled={BigInt(stakedAmount) <= BigInt(0)}
              variant="outline"
              className="w-full mt-4"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Unstake Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unstaking Duration Info */}
      {config?.unstaking_duration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Unstaking Duration
            </CardTitle>
            <CardDescription>
              Tokens will be locked for this period after unstaking before you can claim them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatUnstakingDuration(config.unstaking_duration)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unbondings List */}
      {sortedClaims.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unbondings</CardTitle>
                <CardDescription>Your tokens that are currently unstaking</CardDescription>
              </div>
              {readyClaims.length > 0 && (
                <Button onClick={handleClaim} disabled={claimTx.result.loading}>
                  {claimTx.result.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    `Claim All (${readyClaims.length})`
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedClaims.map((claim, index) => {
                const ready = isClaimReady(claim.release_at);
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      ready ? 'bg-success/5 border-success/20' : 'bg-muted/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {fromBaseUnits(claim.amount, tokenDecimals)} {tokenDisplay}
                      </p>
                      {formatUsdValue(claim.amount) && (
                        <p className="text-sm text-muted-foreground">
                          ≈ ${formatUsdValue(claim.amount)} USD
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${ready ? 'text-success' : ''}`}>
                        {formatReleaseTime(claim.release_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
