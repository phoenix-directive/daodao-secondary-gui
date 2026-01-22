/**
 * UnstakeNftModal - Imperative modal for unstaking CW721 NFTs
 * Allows users to select which staked NFTs to unstake
 */

import { TxButtonContent } from '@/components/custom/tx-button-content';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Label } from '@/components/ui/label';
import type { Duration } from '@/daodao/types/contracts/DaoVotingCw721Staked';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { ModalComponentProps } from '@/lib/modal-service';
import {
  batchGetNftInfo,
  getNftImageUrl,
  getUserStakedNfts,
  NftInfo,
} from '@/lib/staking/cw721-helpers';
import { formatUnstakingDuration } from '@/lib/staking/staking-helpers';
import { AlertCircle, CheckSquare, Loader2, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface UnstakeNftModalData {
  nftContractAddress: string;
  stakingContract: string;
  unstakingDuration: Duration | null | undefined;
}

type UnstakeNftModalProps = ModalComponentProps<boolean, UnstakeNftModalData>;

export function UnstakeNftModal({
  open,
  onOpenChange,
  onResolve,
  modalProps,
}: UnstakeNftModalProps) {
  if (!modalProps) {
    throw new Error('UnstakeNftModal requires modalProps');
  }

  const { nftContractAddress, stakingContract, unstakingDuration } = modalProps;
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<string>>(new Set());
  const chain = useChain(Chain.Terra);
  const userAddress = useAddress(Chain.Terra);

  // Fetch user's staked NFTs (only when modal is open)
  const nftsSignal = useAsyncSignal(async () => {
    if (!userAddress || !stakingContract || !open) return [];
    const tokenIds = await getUserStakedNfts(stakingContract, userAddress, chain);
    const nftInfos = await batchGetNftInfo(nftContractAddress, tokenIds, chain);
    return nftInfos;
  }, [stakingContract, nftContractAddress, userAddress, chain, open]);

  const nfts = nftsSignal.data.value || [];
  const isLoading = nftsSignal.loading.value;
  const error = nftsSignal.error.value;

  // Create unstake message
  const unstakeMessages = useMemo(() => {
    if (!stakingContract || !userAddress || selectedTokenIds.size === 0) return [];

    return [
      new MsgExecuteContract({
        sender: userAddress,
        contract: stakingContract,
        msg: {
          unstake: {
            token_ids: Array.from(selectedTokenIds),
          },
        },
        funds: [],
      }),
    ];
  }, [stakingContract, userAddress, selectedTokenIds]);

  const unstakeTx = useTx(unstakeMessages, {
    title: 'Unstake NFTs',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      onResolve(true);
      onOpenChange(false);
    },
  });

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTokenIds(new Set());
    }
  }, [open]);

  const handleToggleNft = (tokenId: string) => {
    setSelectedTokenIds((prev) => {
      const next = new Set(prev);
      if (next.has(tokenId)) {
        next.delete(tokenId);
      } else {
        next.add(tokenId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTokenIds.size === nfts.length) {
      setSelectedTokenIds(new Set());
    } else {
      setSelectedTokenIds(new Set(nfts.map((nft) => nft.tokenId)));
    }
  };

  const isValid = selectedTokenIds.size > 0;
  const allSelected = nfts.length > 0 && selectedTokenIds.size === nfts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Unstake NFTs</DialogTitle>
          <DialogDescription>
            Select the staked NFTs you want to unstake. They will be available to claim after the
            unstaking period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {/* Unstaking Duration Warning */}
          {unstakingDuration && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Unstaking Period</p>
                <p className="text-muted-foreground">
                  Your NFTs will be locked for {formatUnstakingDuration(unstakingDuration)} before
                  you can claim them.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">
                Loading your staked NFTs...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-sm text-destructive p-4 border border-destructive rounded-lg">
              Failed to load staked NFTs: {error}
            </div>
          )}

          {/* No NFTs Staked */}
          {!isLoading && !error && nfts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No NFTs Staked</p>
              <p className="text-sm">You don't have any staked NFTs to unstake.</p>
            </div>
          )}

          {/* NFT Selection */}
          {!isLoading && !error && nfts.length > 0 && (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-3">
                <Label className="text-sm font-medium">
                  Staked NFTs ({nfts.length})
                  {selectedTokenIds.size > 0 && ` • ${selectedTokenIds.size} selected`}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
              </div>

              {/* NFT Grid */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {nfts.map((nft) => (
                    <NftCard
                      key={nft.tokenId}
                      nft={nft}
                      selected={selectedTokenIds.has(nft.tokenId)}
                      onToggle={() => handleToggleNft(nft.tokenId)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Unstake Button */}
          {nfts.length > 0 && (
            <Button
              onClick={() => unstakeTx.broadcast()}
              disabled={
                !isValid || unstakeTx.buttonProps.disabled || unstakeTx.result.loading || isLoading
              }
              className="w-full"
            >
              <TxButtonContent tx={unstakeTx}>
                Unstake {selectedTokenIds.size > 0 ? `${selectedTokenIds.size} ` : ''}NFT
                {selectedTokenIds.size !== 1 ? 's' : ''}
              </TxButtonContent>
            </Button>
          )}
        </div>
        <ErrorDisplay errors={unstakeTx.buttonProps.errors} title="Validation Errors" />
      </DialogContent>
    </Dialog>
  );
}

interface NftCardProps {
  nft: NftInfo;
  selected: boolean;
  onToggle: () => void;
}

function NftCard({ nft, selected, onToggle }: NftCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getNftImageUrl(nft.imageUrl, 160);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative rounded-lg border-2 transition-all overflow-hidden group ${
        selected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-2 right-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          className="bg-background shadow-md"
        />
      </div>

      {/* Image */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={nft.name || `NFT ${nft.tokenId}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30">
              #{nft.tokenId.substring(0, 4)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-background">
        <p className="text-xs font-medium truncate">{nft.name || `Token #${nft.tokenId}`}</p>
        <p className="text-xs text-muted-foreground truncate">#{nft.tokenId}</p>
      </div>
    </button>
  );
}
