/**
 * StakeNftModal - Imperative modal for staking CW721 NFTs
 * Allows users to select which NFTs to stake
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
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { ModalComponentProps } from '@/lib/modal-service';
import { batchGetNftInfo, getNftImageUrl, getUserNfts, NftInfo } from '@/lib/staking/cw721-helpers';
import { CheckSquare, Loader2, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StakeNftModalData {
  nftContractAddress: string;
  stakingContract: string;
  nfts?: NftInfo[]; // Optional pre-fetched NFTs to avoid re-querying
}

type StakeNftModalProps = ModalComponentProps<boolean, StakeNftModalData>;

export function StakeNftModal({ open, onOpenChange, onResolve, modalProps }: StakeNftModalProps) {
  if (!modalProps) {
    throw new Error('StakeNftModal requires modalProps');
  }

  const { nftContractAddress, stakingContract, nfts: preFetchedNfts } = modalProps;
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<string>>(new Set());
  const chain = useChain(Chain.Terra);
  const userAddress = useAddress(Chain.Terra);

  // Fetch user's unstaked NFTs (only if not pre-fetched)
  const nftsSignal = useAsyncSignal(async () => {
    if (preFetchedNfts) return preFetchedNfts; // Use pre-fetched data
    if (!userAddress || !nftContractAddress || !open) return [];
    const tokenIds = await getUserNfts(nftContractAddress, userAddress, chain);
    const nftInfos = await batchGetNftInfo(nftContractAddress, tokenIds, chain);
    return nftInfos;
  }, [nftContractAddress, userAddress, chain, open, preFetchedNfts]);

  const nfts = nftsSignal.data.value || [];
  const isLoading = !preFetchedNfts && nftsSignal.loading.value; // Don't show loading if we have pre-fetched data
  const error = nftsSignal.error.value;

  // Create stake messages for selected NFTs
  const stakeMessages = useMemo(() => {
    if (!stakingContract || !userAddress || selectedTokenIds.size === 0) return [];

    // For each selected NFT, create a send_nft message to the staking contract
    return Array.from(selectedTokenIds).map(
      (tokenId) =>
        new MsgExecuteContract({
          sender: userAddress,
          contract: nftContractAddress,
          msg: {
            send_nft: {
              contract: stakingContract,
              token_id: tokenId,
              msg: btoa(JSON.stringify({})), // Empty message for staking
            },
          },
          funds: [],
        }),
    );
  }, [nftContractAddress, stakingContract, userAddress, selectedTokenIds]);

  const stakeTx = useTx(stakeMessages, {
    title: 'Stake NFTs',
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
          <DialogTitle>Stake NFTs</DialogTitle>
          <DialogDescription>
            Select the NFTs you want to stake to gain voting power in this DAO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">Loading your NFTs...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-sm text-destructive p-4 border border-destructive rounded-lg">
              Failed to load NFTs: {error}
            </div>
          )}

          {/* No NFTs Available */}
          {!isLoading && !error && nfts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No NFTs Available</p>
              <p className="text-sm">You don't have any unstaked NFTs to stake.</p>
            </div>
          )}

          {/* NFT Selection */}
          {!isLoading && !error && nfts.length > 0 && (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-3">
                <Label className="text-sm font-medium">
                  Available NFTs ({nfts.length})
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

          {/* Stake Button */}
          {nfts.length > 0 && (
            <Button
              onClick={() => stakeTx.broadcast()}
              disabled={
                !isValid || stakeTx.buttonProps.disabled || stakeTx.result.loading || isLoading
              }
              className="w-full"
            >
              <TxButtonContent tx={stakeTx}>
                Stake {selectedTokenIds.size > 0 ? `${selectedTokenIds.size} ` : ''}NFT
                {selectedTokenIds.size !== 1 ? 's' : ''}
              </TxButtonContent>
            </Button>
          )}
        </div>
        <ErrorDisplay errors={stakeTx.buttonProps.errors} title="Validation Errors" />
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
