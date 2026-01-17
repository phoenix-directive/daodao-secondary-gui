import { chain } from '@/config/chain-data';
import { AnyChain } from '@/daodao/protobuf/types';
import { decodedStargateMsgToCw, getAminoTypes, protobufToCwMsg } from '@/daodao/protobuf/utils';
import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import { EMPTY_PUB_KEY } from '@/hooks/helpers/helpers';
import { DaoDaoStateResponse } from '@/hooks/useDaoDao';
import { useIsConnected } from '@/hooks/useWallet';
import type { StdSignDoc } from '@cosmjs/amino';
import { fromBech32 } from '@cosmjs/encoding';
import type { SimpleAccount, WalletAccount } from '@cosmos-kit/core';
import { wallets } from '@cosmos-kit/keplr';
import { ChainProvider, useIframe } from '@cosmos-kit/react-lite';
import { SignDoc, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  RefCallback,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

interface AccountData {
  address: string;
  algo: string;
  pubkey: Uint8Array;
}

export interface AppIframeProps {
  /** The URL to load in the iframe */
  src: string;
  /** Additional allow permissions */
  allow?: string;
  /** CSS class name */
  className?: string;
  /** iframe title */
  title?: string;
  /** Callback when messages are decoded from the app */
  onMessagesDecoded?: (chainId: string, sender: string, msgs: UnifiedCosmosMsg[]) => void;

  daoData: DaoDaoStateResponse;
}

export interface AppIframeRef {
  /** The underlying iframe element */
  iframe: HTMLIFrameElement | null;
}

function getChainForChainId(chainId: string): AnyChain {
  // Currently only supporting Terra Phoenix-1, can be extended for other chains
  switch (chainId) {
    case 'phoenix-1':
      return {
        chainId: 'phoenix-1',
        chainName: 'terra2',
        bech32Prefix: 'terra',
        prettyName: 'Terra',
      };
    default:
      // Fallback to current chain for unsupported chain IDs
      console.warn(`Chain ID ${chainId} not supported, falling back to Terra Phoenix-1`);
      return {
        chainId: chain.chainId || 'phoenix-1',
        chainName: 'terra2',
        bech32Prefix: 'terra',
        prettyName: 'Terra',
      };
  }
}

/**
 * AppIframe component with wallet injection for DAO DAO apps.
 * This component provides a standardized iframe with Cosmos wallet integration
 * that allows apps to request signatures and interact with the wallet.
 */
export const AppIframe = forwardRef<AppIframeRef, AppIframeProps>(
  ({ src, allow = 'clipboard-write', className, title, onMessagesDecoded, daoData }, ref) => {
    return (
      <ChainProvider chains={[]} assetLists={[]} wallets={wallets}>
        <AppIframeInner
          src={src}
          allow={allow}
          className={className}
          title={title}
          onMessagesDecoded={onMessagesDecoded}
          ref={ref}
          daoData={daoData}
        />
      </ChainProvider>
    );
  },
);

AppIframe.displayName = 'AppIframe';

/**
 * Internal iframe component that uses the wallet hooks.
 * This needs to be separate so it can use hooks that require ChainProvider context.
 */
const AppIframeInner = forwardRef<AppIframeRef, AppIframeProps>(
  ({ src, allow = 'clipboard-write', className, title, onMessagesDecoded, daoData }, ref) => {
    const isConnected = useIsConnected();

    const decodeDirect = useCallback(
      (sender: string, signDoc: SignDoc) => {
        const encodedMessages = TxBody.decode(signDoc.bodyBytes).messages;
        const messages = encodedMessages.flatMap(
          (msg) => protobufToCwMsg(getChainForChainId(signDoc.chainId!), msg, false).msg,
        );

        console.log('APP DIRECT DECODING', {
          chainId: signDoc.chainId,
          sender,
          encodedMessages,
          messages,
        });

        onMessagesDecoded?.(signDoc.chainId, sender, messages);
      },
      [onMessagesDecoded],
    );

    const decodeAmino = useCallback(
      (sender: string, signDoc: StdSignDoc) => {
        const messages = signDoc.msgs.flatMap((msg) => {
          const amino = getAminoTypes().fromAmino(msg);
          const cosmos = decodedStargateMsgToCw(getChainForChainId(signDoc.chain_id), amino).msg;

          return {
            msg,
            amino,
            cosmos,
          };
        });

        console.log('APP AMINO DECODING', {
          chainId: signDoc.chain_id,
          sender,
          signDoc,
          messages,
        });

        onMessagesDecoded?.(
          signDoc.chain_id,
          sender,
          messages.map((m) => m.cosmos),
        );
      },
      [onMessagesDecoded],
    );

    const walletConnect = useCallback(
      async (_chainIds: string | string[]) => {
        if (!daoData) {
          return {
            type: 'error' as const,
            error: 'Wallet not connected.',
          };
        }

        return {
          type: 'success' as const,
        };
      },
      [daoData],
    );

    // Setup iframe wallet injection
    const { wallet: injectedWallet, iframeRef } = useIframe({
      metadata: {
        name: 'DAO GO',
        imageUrl: window.location.origin + '/logo.png',
      },
      walletClientOverrides: {
        signAmino: (_chainId: string, signer: string, signDoc: StdSignDoc) => {
          decodeAmino(signer, signDoc);
          return {
            type: 'error',
            error: 'Handled by DAO GO.',
          };
        },
        signDirect: (_chainId: string, signer: string, signDoc: SignDoc) => {
          decodeDirect(signer, signDoc);
          return {
            type: 'error',
            error: 'Handled by DAO GO.',
          };
        },
        enable: async (chainIds: string | string[]) => {
          if (!isConnected) {
            return {
              type: 'error',
              error: 'Wallet not connected',
            };
          }

          return {
            type: 'success',
          };
        },
        connect: walletConnect,
        sign: () => ({
          type: 'error',
          value: 'Unsupported.',
        }),
        signArbitrary: () => ({
          type: 'error',
          value: 'Unsupported.',
        }),
        suggestToken: () => ({
          type: 'success',
        }),
        addChain: () => ({
          type: 'success',
        }),
        getAccount: async (chainId: string) => {
          if (!daoData) {
            return {
              type: 'error',
              error: 'No account found',
            };
          }

          return {
            type: 'success',
            value: {
              address: daoData._computed.address,
              algo: 'secp256k1' as const,
              pubkey: EMPTY_PUB_KEY,
              username: daoData._computed.address,
              isNanoLedger: false,
              isSmartContract: false,
            } satisfies WalletAccount,
          };
        },
        getSimpleAccount: (chainId: string) => {
          if (!daoData) {
            return {
              type: 'error',
              error: 'No account found',
            };
          }
          return {
            type: 'success',
            value: {
              namespace: 'cosmos',
              chainId,
              address: daoData._computed.address,
              username: daoData._computed.address,
            } satisfies SimpleAccount,
          };
        },
        getKey: async (chainId: string) => {
          if (!daoData) {
            return {
              type: 'error',
              error: 'No account found',
            };
          }

          return {
            type: 'success',
            value: {
              name: daoData._computed.address,
              algo: 'secp256k1' as const,
              pubkey: EMPTY_PUB_KEY,
              pubKey: EMPTY_PUB_KEY,
              address: fromBech32(daoData._computed.address).data,
              bech32Address: daoData._computed.address,
              isNanoLedger: false,
              isSmartContract: false,
              isKeystone: false,
            },
          };
        },
      },
      signerOverrides: {
        signDirect: (signerAddress, signDoc) => {
          decodeDirect(signerAddress, signDoc);
          return {
            type: 'error',
            error: 'Handled by DAO GO.',
          };
        },
        signAmino: (signerAddress, signDoc) => {
          decodeAmino(signerAddress, signDoc);
          return {
            type: 'error',
            error: 'Handled by DAO GO.',
          };
        },
        getAccounts: async () => {
          if (!daoData) {
            return {
              type: 'error',
              error: 'No account found',
            };
          }

          return {
            type: 'success',
            value: [
              {
                address: daoData._computed.address,
                algo: 'secp256k1' as const,
                pubkey: EMPTY_PUB_KEY,
              } satisfies AccountData,
            ],
          };
        },
      },
    });

    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
    const myIframeRef: RefCallback<HTMLIFrameElement | null> = useCallback(
      (refValue) => {
        setIframe(refValue);
        iframeRef(refValue);
      },
      [iframeRef],
    );

    // Expose iframe element via ref
    useImperativeHandle(
      ref,
      () => ({
        iframe,
      }),
      [iframe],
    );

    // Message handler for iframe communication
    useEffect(() => {
      if (!iframe?.contentWindow) {
        return;
      }

      const listener = ({ data }: MessageEvent) => {
        if (data === 'isDaoDao') {
          iframe.contentWindow?.postMessage('amDaoDao');
        }
      };

      iframe.contentWindow.addEventListener('message', listener);

      return () => {
        iframe.contentWindow?.removeEventListener('message', listener);
      };
    }, [iframe]);

    return <iframe ref={myIframeRef} src={src} allow={allow} className={className} title={title} />;
  },
);

AppIframeInner.displayName = 'AppIframeInner';
