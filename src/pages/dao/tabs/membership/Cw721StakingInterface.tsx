/**
 * Cw721StakingInterface - Complete UI for CW721 (NFT) staked voting module membership management
 * Includes staking, unstaking, and claiming functionality for NFTs
 */

import { TxButtonContent } from '@/components/custom/tx-button-content';
import { StakeNftModal } from '@/components/modals/stake-nft-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExecuteMsg as Cw721StakeExecuteMsg } from '@/daodao/types/contracts/DaoVotingCw721Staked';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { modalService } from '@/lib/modal-service';
import {
  batchGetNftInfo,
  getCw721StakingConfig,
  getNftImageUrl,
  getUserNftClaims,
  getUserNfts,
  getUserStakedNfts,
} from '@/lib/staking/cw721-helpers';
import {
  formatReleaseTime,
  formatUnstakingDuration,
  isClaimReady,
} from '@/lib/staking/staking-helpers';
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Clock, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface Cw721StakingInterfaceProps {
  votingModuleAddress: string;
}

export function Cw721StakingInterface({ votingModuleAddress }: Cw721StakingInterfaceProps) {
  const chain = useChain(Chain.Terra);
  const userAddress = useAddress(Chain.Terra);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedForUnstake, setSelectedForUnstake] = useState<Set<string>>(new Set());

  // Fetch staking contract config
  const configSignal = useAsyncSignal(async () => {
    // For CW721, the voting module IS the staking contract
    const config = await getCw721StakingConfig(votingModuleAddress, chain);
    return config;
  }, [votingModuleAddress, chain]);

  const config = configSignal.data.value;
  const nftContractAddress = config?.nft_address;

  // Fetch user's staked NFTs
  const stakedNftsSignal = useAsyncSignal(async () => {
    if (!userAddress || !votingModuleAddress || !nftContractAddress) return [];
    const tokenIds = await getUserStakedNfts(votingModuleAddress, userAddress, chain);
    if (!nftContractAddress || tokenIds.length === 0) return [];
    const nftInfos = await batchGetNftInfo(nftContractAddress, tokenIds, chain);
    return nftInfos;
  }, [votingModuleAddress, nftContractAddress, userAddress, globalReload.value]);

  // Fetch user's unstaked NFTs (available to stake)
  const unstakedNftsSignal = useAsyncSignal(async () => {
    if (!userAddress || !nftContractAddress) return [];
    const tokenIds = await getUserNfts(nftContractAddress, userAddress, chain);
    if (tokenIds.length === 0) return [];
    const nftInfos = await batchGetNftInfo(nftContractAddress, tokenIds, chain);
    return nftInfos;
  }, [nftContractAddress, userAddress, globalReload.value]);

  // Fetch user's NFT claims (unbondings)
  const claimsSignal = useAsyncSignal(async () => {
    if (!votingModuleAddress || !userAddress) return { nft_claims: [] };
    return getUserNftClaims(votingModuleAddress, userAddress, chain);
  }, [votingModuleAddress, userAddress, globalReload.value]);

  // Fetch NFT info for claims
  const claimsWithInfoSignal = useAsyncSignal(async () => {
    const claims = claimsSignal.data.value?.nft_claims || [];
    if (claims.length === 0 || !nftContractAddress) return [];

    const tokenIds = claims.map((c) => c.token_id);
    const nftInfos = await batchGetNftInfo(nftContractAddress, tokenIds, chain);

    return claims.map((claim, i) => ({
      ...claim,
      nftInfo: nftInfos[i],
    }));
  }, [claimsSignal.data.value, nftContractAddress]);

  const stakedNfts = useMemo(
    () => stakedNftsSignal.data.value || [],
    [stakedNftsSignal.data.value],
  );
  const unstakedNfts = useMemo(
    () => unstakedNftsSignal.data.value || [],
    [unstakedNftsSignal.data.value],
  );
  const claimsWithInfo = useMemo(
    () => claimsWithInfoSignal.data.value || [],
    [claimsWithInfoSignal.data.value],
  );

  const readyClaims = useMemo(
    () => claimsWithInfo.filter((claim) => isClaimReady(claim.release_at)),
    [claimsWithInfo],
  );

  // Unstake messages for selected NFTs
  const unstakeMessages = useMemo(
    () =>
      votingModuleAddress && userAddress && selectedForUnstake.size > 0
        ? [
            new MsgExecuteContract({
              sender: userAddress,
              contract: votingModuleAddress,
              msg: {
                unstake: {
                  token_ids: Array.from(selectedForUnstake),
                },
              },
              funds: [],
            }),
          ]
        : [],
    [votingModuleAddress, userAddress, selectedForUnstake],
  );

  // Claim transaction
  const claimMessages = useMemo(
    () =>
      votingModuleAddress && userAddress && readyClaims.length > 0
        ? [
            new MsgExecuteContract({
              sender: userAddress,
              contract: votingModuleAddress,
              msg: {
                claim_nfts: {},
              } as Cw721StakeExecuteMsg,
              funds: [],
            }),
          ]
        : [],
    [votingModuleAddress, userAddress, readyClaims],
  );

  const claimTx = useTx(claimMessages, {
    title: 'Claim NFTs',
    chainId: Chain.Terra,
  });

  const unstakeTx = useTx(unstakeMessages, {
    title: 'Unstake NFTs',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      setSelectedForUnstake(new Set());
    },
  });

  const handleClaim = useCallback(async () => {
    if (!votingModuleAddress || !userAddress) return;
    await claimTx.broadcast();
  }, [votingModuleAddress, userAddress, claimTx]);

  const handleUnstake = useCallback(async () => {
    if (!votingModuleAddress || !userAddress || selectedForUnstake.size === 0) return;
    await unstakeTx.broadcast();
  }, [votingModuleAddress, userAddress, selectedForUnstake, unstakeTx]);

  const handleToggleNft = useCallback((tokenId: string) => {
    setSelectedForUnstake((prev) => {
      const next = new Set(prev);
      if (next.has(tokenId)) {
        next.delete(tokenId);
      } else {
        next.add(tokenId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedForUnstake.size === stakedNfts.length && stakedNfts.length > 0) {
      setSelectedForUnstake(new Set());
    } else {
      setSelectedForUnstake(new Set(stakedNfts.map((nft) => nft.tokenId)));
    }
  }, [selectedForUnstake.size, stakedNfts]);

  // Open stake modal
  const handleOpenStakeModal = useCallback(async () => {
    if (!nftContractAddress || !votingModuleAddress) return;
    await modalService.open(StakeNftModal, {
      nftContractAddress,
      stakingContract: votingModuleAddress,
      nfts: unstakedNfts, // Pass pre-fetched NFTs
    });
  }, [nftContractAddress, votingModuleAddress, unstakedNfts]);

  const handleImageError = (tokenId: string) => {
    setImageErrors((prev) => new Set(prev).add(tokenId));
  };

  const isLoading =
    configSignal.loading.value ||
    stakedNftsSignal.loading.value ||
    unstakedNftsSignal.loading.value ||
    claimsSignal.loading.value ||
    claimsWithInfoSignal.loading.value;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading NFT staking data...</span>
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
              Please connect your wallet to manage your NFT membership.
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
        {/* Stake NFTs Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stake NFTs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="space-y-1 mb-4">
              <p className="text-lg text-muted-foreground">
                Stake your NFTs to gain voting power in this DAO.
              </p>
            </div>
            <Button
              onClick={handleOpenStakeModal}
              className="w-full mt-auto"
              disabled={unstakedNfts.length === 0}
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Stake NFTs {unstakedNfts.length > 0 && `(${unstakedNfts.length})`}
            </Button>
          </CardContent>
        </Card>

        {/* Voting Power Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-4">
              <p className="text-2xl font-bold">{stakedNfts.length}</p>
              <p className="text-sm text-muted-foreground">
                Staked NFT{stakedNfts.length !== 1 ? 's' : ''}
              </p>
            </div>
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
              NFTs will be locked for this period after unstaking before you can claim them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatUnstakingDuration(config.unstaking_duration)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Staked NFTs with Inline Unstaking */}
      {stakedNfts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Staked NFTs</CardTitle>
                <CardDescription>
                  Select NFTs to unstake.{' '}
                  {config?.unstaking_duration &&
                    `Unstaking period: ${formatUnstakingDuration(config.unstaking_duration)}`}
                </CardDescription>
              </div>
              {stakedNfts.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedForUnstake.size === stakedNfts.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stakedNfts.map((nft) => {
                const imageUrl = getNftImageUrl(nft.imageUrl, 160);
                const hasError = imageErrors.has(nft.tokenId);
                const isSelected = selectedForUnstake.has(nft.tokenId);

                return (
                  <button
                    key={nft.tokenId}
                    type="button"
                    onClick={() => handleToggleNft(nft.tokenId)}
                    className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="shrink-0">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-input'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="white"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M10.0315 2.08463C10.3642 2.29629 10.4638 2.73893 10.2521 3.07159L5.67775 10.213C5.56888 10.3914 5.39197 10.5151 5.18856 10.5546C4.98515 10.5942 4.77465 10.5463 4.60627 10.4229L1.31746 7.7418C1.01197 7.50657 0.95033 7.06918 1.18556 6.76369C1.42079 6.4582 1.85818 6.39656 2.16367 6.63179L4.78207 8.67152L8.92235 2.28696C9.13401 1.9543 9.57665 1.85467 9.90931 2.06633L10.0315 2.08463Z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* NFT Thumbnail */}
                    <div className="w-16 h-16 rounded-lg border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {imageUrl && !hasError ? (
                        <img
                          src={imageUrl}
                          alt={nft.name || `NFT ${nft.tokenId}`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(nft.tokenId)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                          <span className="text-lg font-bold text-primary/30">
                            #{nft.tokenId.substring(0, 3)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* NFT Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{nft.name || `Token #${nft.tokenId}`}</p>
                      <p className="text-sm text-muted-foreground truncate">#{nft.tokenId}</p>
                    </div>
                  </button>
                );
              })}

              {/* Unstake Button */}
              {selectedForUnstake.size > 0 && (
                <Button
                  onClick={handleUnstake}
                  disabled={unstakeTx.buttonProps.disabled || unstakeTx.result.loading}
                  className="w-full"
                  variant="default"
                >
                  <TxButtonContent tx={unstakeTx}>
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Unstake {selectedForUnstake.size} NFT{selectedForUnstake.size !== 1 ? 's' : ''}
                  </TxButtonContent>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Claims */}
      {claimsWithInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unstaking NFTs</CardTitle>
            <CardDescription>
              NFTs in the unstaking period. You can claim them when the period ends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claimsWithInfo.map((claim, idx) => {
                const isReady = isClaimReady(claim.release_at);
                const imageUrl = getNftImageUrl(claim.nftInfo.imageUrl, 160);
                const hasError = imageErrors.has(claim.token_id);

                return (
                  <div
                    key={`${claim.token_id}-${idx}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {/* NFT Thumbnail */}
                      <div className="w-16 h-16 rounded-lg border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {imageUrl && !hasError ? (
                          <img
                            src={imageUrl}
                            alt={claim.nftInfo.name || `NFT ${claim.token_id}`}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(claim.token_id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                            <span className="text-lg font-bold text-primary/30">
                              #{claim.token_id.substring(0, 3)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-medium">
                          {claim.nftInfo.name || `Token #${claim.token_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">#{claim.token_id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          isReady ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        {formatReleaseTime(claim.release_at)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Claim Button */}
              {readyClaims.length > 0 && (
                <Button
                  onClick={handleClaim}
                  disabled={claimTx.buttonProps.disabled || claimTx.result.loading}
                  className="w-full"
                >
                  <TxButtonContent tx={claimTx}>
                    Claim {readyClaims.length} NFT{readyClaims.length !== 1 ? 's' : ''}
                  </TxButtonContent>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
