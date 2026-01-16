import { AddressInputModal } from '@/components/modals';
import {
  BroadcastResult,
  Network,
  NetworkCurrency,
  SigningResult,
  TransactionMsg,
  WalletConnection,
  WalletExtensionProvider,
} from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { modalService } from '@/lib/modal-service';

/**
 * Example usage of the modal service for address input:
 *
 * ```typescript
 * import { modalService } from '@/lib/modal-service-core';
 * import { AddressInputModal } from '@/components/modals/address-input-modal';
 * import { Chain } from '@/hooks/helpers/assets';
 *
 * // Open the modal and await the result
 * async function getAddressFromUser() {
 *   const address = await modalService.open<string>(AddressInputModal, {
 *     title: 'Enter Readonly Wallet Address',
 *     description: 'Provide a Terra address to use in readonly mode',
 *     chain: Chain.Terra,
 *   });
 *
 *   if (address) {
 *     console.log('User entered address:', address);
 *     // Use the address for readonly wallet connection
 *     return address;
 *   }
 *
 *   return null;
 * }
 * ```
 */

export class ReadonlyWalletProvider extends WalletExtensionProvider {
  readonlyAddresses: Record<string, string> = {};

  load() {
    const stored = localStorage.getItem(`readonly-wallet-address`);
    if (stored) {
      this.readonlyAddresses = JSON.parse(stored);
    }
  }
  store(chain: string, address: string) {
    this.readonlyAddresses[chain] = address;
    localStorage.setItem(`readonly-wallet-address`, JSON.stringify(this.readonlyAddresses));
  }
  remove(chain?: string) {
    if (chain) {
      delete this.readonlyAddresses[chain];
    }
    localStorage.setItem(`readonly-wallet-address`, JSON.stringify(this.readonlyAddresses));
  }
  tryGet(chain: string): string | null {
    return this.readonlyAddresses[chain] || null;
  }

  constructor({ networks }: { networks: Network[] }) {
    async function getAddressFromUser() {
      const address = await modalService.open<string>(AddressInputModal, {
        title: 'Enter Readonly Wallet Address',
        description: 'Provide a Terra address to use in readonly mode',
        chain: Chain.Terra,
      });

      if (address) {
        console.log('User entered address:', address);
        // Use the address for readonly wallet connection
        return address;
      }

      return null;
    }

    super({
      id: 'readonly',
      name: 'Readonly Wallet',
      networks,
      extensionProviderAdapter: {
        async init(provider: WalletExtensionProvider): Promise<void> {
          const readonly = provider as ReadonlyWalletProvider;
          readonly.load();
        },
        isReady(): boolean {
          return true;
        },
        async connect(
          provider: WalletExtensionProvider,
          options: { network: Network },
        ): Promise<WalletConnection> {
          console.log('Readonly', provider, options);
          const readonly = provider as ReadonlyWalletProvider;
          const existing = readonly.tryGet(options.network.chainId);
          const address = existing || (await getAddressFromUser());
          if (!address) {
            throw new Error('Address not provided');
          }
          readonly.store(options.network.chainId, address);

          return {
            account: {
              address: address,
              algo: 'secp256k1',
              pubkey: null as any,
              isLedger: false,
            },
            id: `provider:${provider.id}:network:${options.network.chainId}:address:${address}`,
            providerId: provider.id,
            network: options.network,
            mobileSession: {},
          };
        },
        async disconnect(
          provider: WalletExtensionProvider,
          options?: { network: Network; wallet: WalletConnection },
        ): Promise<void> {
          const readonly = provider as ReadonlyWalletProvider;
          readonly.remove(options?.network.chainId);
        },
        sign(
          provider: WalletExtensionProvider,
          options: {
            network: Network;
            messages: TransactionMsg[];
            wallet: WalletConnection;
            feeAmount?: string | null;
            gasLimit?: string | null;
            memo?: string | null;
            overrides?: {
              rpc?: string;
              rest?: string;
              gasAdjustment?: number;
              gasPrice?: string;
              feeCurrency?: NetworkCurrency;
            };
          },
        ): Promise<SigningResult> {
          throw new Error(
            'Readonly wallet cannot sign transactions. Disconnect and use a different wallet.',
          );
        },
        signAndBroadcast(
          provider: WalletExtensionProvider,
          options: {
            network: Network;
            messages: TransactionMsg[];
            wallet: WalletConnection;
            feeAmount?: string | null;
            gasLimit?: string | null;
            memo?: string | null;
            overrides?: {
              rpc?: string;
              rest?: string;
              gasAdjustment?: number;
              gasPrice?: string;
              feeCurrency?: NetworkCurrency;
            };
          },
        ): Promise<BroadcastResult> {
          throw new Error(
            'Readonly wallet cannot sign and broadcast transactions. Disconnect and use a different wallet.',
          );
        },
        signArbitrary(
          provider: WalletExtensionProvider,
          options: {
            network: Network;
            wallet: WalletConnection;
            data: Uint8Array;
          },
        ): Promise<SigningResult> {
          throw new Error(
            'Readonly wallet cannot sign arbitrary data. Disconnect and use a different wallet.',
          );
        },
        verifyArbitrary(
          provider: WalletExtensionProvider,
          options: {
            network: Network;
            wallet: WalletConnection;
            data: Uint8Array;
            signResult: SigningResult;
          },
        ): Promise<boolean> {
          throw new Error(
            'Readonly wallet cannot verify arbitrary data. Disconnect and use a different wallet.',
          );
        },
      },
    });
  }
}
