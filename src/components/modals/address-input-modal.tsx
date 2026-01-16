/**
 * Address Input Modal Component
 *
 * A modal dialog for inputting and validating a blockchain address.
 * Verifies the address by querying its balance to ensure it's a valid account or contract.
 *
 * Features:
 * - Terra address input with validation
 * - Automatic debounced verification (200ms after typing stops)
 * - Loading states during debounce and verification
 * - Error display for invalid addresses
 * - Can be opened imperatively via modalService
 *
 * Usage with Modal Service:
 * ```tsx
 * import { modalService } from '@/lib/modal-service-core';
 * import { AddressInputModal } from '@/components/modals/address-input-modal';
 *
 * const address = await modalService.open<string>(AddressInputModal, {
 *   title: 'Enter Address',
 *   description: 'Please provide a Terra address to verify',
 * });
 *
 * if (address) {
 *   console.log('Verified address:', address);
 * }
 * ```
 *
 * Usage as Regular Modal:
 * ```tsx
 * <AddressInputModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onResolve={(address) => console.log('Address:', address)}
 *   onReject={() => console.log('Cancelled')}
 * />
 * ```
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { useDebounce } from '@/hooks/useDebounce';
import { ModalComponentProps } from '@/lib/modal-service';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface AddressInputModalProps {
  title?: string;
  description?: string;
  placeholder?: string;
  chain?: Chain;
}

export function AddressInputModal({
  open,
  onOpenChange,
  onResolve,
  onReject,
  modalProps,
}: ModalComponentProps<string, AddressInputModalProps>) {
  const [address, setAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const chain = useChain(modalProps?.chain ?? Chain.Terra);

  // Debounce the address input by 200ms
  const debouncedAddress = useDebounce(address, 200);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setAddress('');
      setIsVerifying(false);
      setVerificationError(null);
      setIsVerified(false);
    }
  }, [open]);

  // Validate address format
  const isValidAddressFormat = useCallback(
    (addr: string) => {
      if (!addr) return false;
      const prefix = chain.config.network.bech32Config?.bech32PrefixAccAddr ?? 'terra';
      return addr.startsWith(prefix) && addr.length > 40 && addr.length < 100;
    },
    [chain],
  );

  // Verify address by querying balance
  const verifyAddress = useCallback(
    async (addr: string) => {
      if (!isValidAddressFormat(addr)) {
        setVerificationError('Invalid address format');
        setIsVerified(false);
        return false;
      }

      setIsVerifying(true);
      setVerificationError(null);
      setIsVerified(false);

      try {
        // Try to query the balance - if it succeeds, the address exists
        const balances = await chain.read.balances(addr);

        // Address is valid if we can query it (even if balance is empty)
        setIsVerified(true);
        setVerificationError(null);
        return true;
      } catch (error: any) {
        console.error('Address verification failed:', error);

        // Check if it's a contract by trying to query it
        try {
          await chain.read.query(addr, { contract_info: {} });
          // If contract query succeeds, it's a valid contract address
          setIsVerified(true);
          setVerificationError(null);
          return true;
        } catch {
          // Not a valid account or contract
          setVerificationError(
            error.message?.includes('not found')
              ? 'Address not found on chain'
              : 'Failed to verify address',
          );
          setIsVerified(false);
          return false;
        }
      } finally {
        setIsVerifying(false);
      }
    },
    [chain, isValidAddressFormat],
  );

  // Automatically verify address when debounced value changes
  useEffect(() => {
    if (debouncedAddress && isValidAddressFormat(debouncedAddress)) {
      verifyAddress(debouncedAddress);
    } else if (debouncedAddress && !isValidAddressFormat(debouncedAddress)) {
      setVerificationError('Invalid address format');
      setIsVerified(false);
      setIsVerifying(false);
    } else {
      // Empty address, reset verification state
      setIsVerified(false);
      setVerificationError(null);
      setIsVerifying(false);
    }
  }, [debouncedAddress, isValidAddressFormat, verifyAddress]);

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setAddress(value);
    setIsVerified(false);
    setVerificationError(null);

    // Show loading state during debounce period if address has valid format
    if (value && isValidAddressFormat(value)) {
      setIsVerifying(true);
    } else {
      setIsVerifying(false);
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    if (isVerified && address) {
      onResolve(address);
      onOpenChange(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onReject?.();
    onOpenChange(false);
  };

  const canConfirm = isVerified && !isVerifying;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{modalProps?.title ?? 'Enter Address'}</DialogTitle>
          <DialogDescription>
            {modalProps?.description ??
              'Enter a blockchain address to verify. The address will be validated by querying its balance.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="address-input">Address</Label>
            <div className="relative">
              <Input
                placeholder={
                  modalProps?.placeholder ??
                  `${chain.config.network.bech32Config?.bech32PrefixAccAddr ?? 'terra'}1...`
                }
                value={address}
                onChange={handleAddressChange}
                className={cn(
                  'pr-10',
                  isVerified && 'border-green-500',
                  verificationError && 'border-red-500',
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    handleConfirm();
                  }
                }}
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {isVerifying && <Spinner className="size-4" />}
                {!isVerifying && isVerified && <CheckCircle2 className="size-4 text-green-500" />}
                {!isVerifying && verificationError && (
                  <AlertCircle className="size-4 text-red-500" />
                )}
              </div>
            </div>
            {!isVerifying && !isVerified && !verificationError && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertCircle className="size-3" />
                Input address for verification
              </p>
            )}

            {isVerifying && !isVerified && !verificationError && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Verifying address...
              </p>
            )}

            {verificationError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" />
                {verificationError}
              </p>
            )}
            {isVerified && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Address verified successfully
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button className="w-full" onClick={handleConfirm} disabled={!canConfirm}>
            {isVerifying ? (
              <>
                <Spinner className="size-4 mr-2" />
                Verifying...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
