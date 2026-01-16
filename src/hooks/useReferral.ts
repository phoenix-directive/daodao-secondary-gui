import { useShuttle } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { getErrorMessage } from '@/hooks/helpers/helpers';
import { useApi } from '@/hooks/useApi';
import { useAddress } from '@/hooks/useWallet';
import { createPersistedSignal } from '@/lib/signals';
import { toBase64 } from '@cosmjs/encoding';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Store the referral code from URL query param
export const pendingReferralCode = createPersistedSignal<string | null>(
  'pending-referral-code',
  null,
);

/**
 * Get the referral code from localStorage
 */
export function getPendingReferralCode(): string | null {
  return pendingReferralCode.peek();
}

/**
 * Store the referral code in localStorage
 */
export function setPendingReferralCode(code: string | null) {
  pendingReferralCode.value = code;
}

/**
 * Clear the pending referral code (after it's been used)
 */
export function clearPendingReferralCode() {
  pendingReferralCode.value = null;
}

/**
 * Extract referral code from URL query params and store it
 */
export function checkAndStorePendingReferralCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    setPendingReferralCode(refCode);
    console.log('Referral code stored:', refCode);

    // Remove the ref parameter from the URL
    urlParams.delete('ref');
    const newUrl = urlParams.toString()
      ? `${window.location.pathname}?${urlParams.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
}

/**
 * Hook to handle using a referral code
 */
export function useReferralCode() {
  const { wallets, signArbitrary, availableExtensionProviders, availableMobileProviders } =
    useShuttle();
  const address = useAddress(Chain.Terra);
  const api = useApi();

  const useReferralCode = useCallback(
    async (code: string) => {
      if (!address) {
        toast.error('Please connect your wallet first');
        return false;
      }

      const wallet = wallets.find((w) => w.network.chainId === Chain.Terra);
      if (!wallet || !wallet.account.pubkey) {
        toast.error('Wallet not properly connected');
        return false;
      }

      const allProviders = [...availableExtensionProviders, ...availableMobileProviders];
      const provider = allProviders.find((p) => p.id === wallet.providerId);
      if (!provider) {
        return false;
      }

      try {
        // Create the signature data
        const data = JSON.stringify({ accept_referral: code });

        // Request signature from user
        const signature = await signArbitrary({
          wallet,
          data: data as any,
        });

        // Call the API to use the referral code
        await api.referral.referralControllerUseReferralCode({
          UseReferralCode: {
            code,
            address,
            signature: {
              pubkey: wallet.account.pubkey,
              data,
              signature: toBase64(signature.signatures[0]),
              signByMemo: !!signature.response?.signed?.memo,
            },
          },
        });

        toast.success('Referral code successfully applied!');
        clearPendingReferralCode();
        return true;
      } catch (error) {
        console.error('Failed to use referral code:', error);
        const message = await getErrorMessage(error);
        if (message) {
          toast.error(`Failed to apply referral code: ${message}`);
        } else {
          toast.error(`Failed to apply referral code. Please try again.`);
        }
        clearPendingReferralCode();

        return false;
      }
    },
    [address, api, signArbitrary, wallets, availableExtensionProviders, availableMobileProviders],
  );

  return { useReferralCode };
}
