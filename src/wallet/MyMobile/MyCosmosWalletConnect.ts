import {
  Algo,
  Algos,
  AminoSigningClient,
  ArbitrarySigningClient,
  isAndroid,
  isIOS,
  isMobile,
  Network,
  NetworkCurrency,
  SigningResult,
  TransactionMsg,
  WalletConnection,
  WalletMobileProvider,
  WalletMobileSession,
} from '@/delphi-labs/shuttle-react';
import MobileProviderAdapter from '@/delphi-labs/shuttle/internals/adapters/mobile';
import { setupWalletConnect } from '@/delphi-labs/shuttle/internals/adapters/mobile/wallet-connect';
import { selectMany } from '@/hooks/helpers/helpers';
import { AminoSignResponse } from '@cosmjs/amino';
import SignClient from '@walletconnect/sign-client';

type CosmosWCAccount = {
  address: string;
  algo: string;
  pubkey: string;
};

export class MyCosmosWalletConnect implements MobileProviderAdapter {
  walletConnectPeerName: string;
  walletConnectProjectId?: string;
  walletConnect?: SignClient;
  networks: Network[];

  constructor({
    walletConnectPeerName,
    walletConnectProjectId,
    networks,
  }: {
    walletConnectPeerName: string;
    walletConnectProjectId?: string;
    networks: Network[];
  }) {
    this.walletConnectPeerName = walletConnectPeerName;
    this.walletConnectProjectId = walletConnectProjectId;
    this.networks = networks;
  }

  async init(
    provider: WalletMobileProvider,
    params: { walletConnectProjectId?: string },
  ): Promise<void> {
    this.walletConnectProjectId = params.walletConnectProjectId ?? this.walletConnectProjectId;

    this.walletConnect = await setupWalletConnect(this.walletConnectProjectId || '');

    this.walletConnect.on('session_update', () => {
      provider.onUpdate?.();
    });

    this.walletConnect.on('session_delete', () => {
      provider.onUpdate?.();
    });
  }

  isReady(): boolean {
    return !!this.walletConnect;
  }

  isSessionExpired(mobileSession: WalletMobileSession): boolean {
    if (!mobileSession.walletConnectSession) {
      return true;
    }

    return mobileSession.walletConnectSession.expiry < Date.now() / 1000;
  }

  private async getAccount({
    network,
    mobileSession,
  }: {
    network: Network;
    mobileSession: WalletMobileSession;
  }): Promise<CosmosWCAccount[] | null> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!mobileSession.walletConnectSession || this.isSessionExpired(mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }

    return await this.walletConnect.request({
      topic: mobileSession.walletConnectSession?.topic,
      chainId: `cosmos:${network.chainId}`,
      request: {
        method: 'cosmos_getAccounts',
        params: {},
      },
    });
  }

  private async getAccounts({
    networks,
    mobileSession,
  }: {
    networks: Network[];
    mobileSession: WalletMobileSession;
  }): Promise<CosmosWCAccount[] | null> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!mobileSession.walletConnectSession || this.isSessionExpired(mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }
    // const chains = this.getWcChains(networks);

    const all = await Promise.all(
      networks.map(
        async (network) =>
          await this.walletConnect!.request<CosmosWCAccount[]>({
            topic: mobileSession.walletConnectSession!.topic,
            chainId: `cosmos:${network.chainId}`,

            request: {
              method: 'cosmos_getAccounts',
              params: {},
            },
          }),
      ),
    );

    return selectMany(all, (a) => a);
  }

  async getWalletConnections(
    provider: WalletMobileProvider,
    { network, mobileSession }: { network: Network; mobileSession: WalletMobileSession },
  ): Promise<WalletConnection[]> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!mobileSession.walletConnectSession || this.isSessionExpired(mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }

    const accounts = await this.getAccounts({
      networks: this.networks,
      mobileSession,
    });

    if (!accounts || accounts.length === 0) {
      throw new Error(`No wallet connected to chain: ${network.chainId}`);
    }

    return accounts.map((account, index) => {
      const network = this.networks[index];
      return {
        id: `provider:${provider.id}:network:${network.chainId}:address:${account.address}`,
        providerId: provider.id,
        account: {
          address: account.address,
          pubkey: account.pubkey,
          algo: account.algo as Algo,
        },
        network,
        mobileSession: mobileSession,
      };
    });
  }

  async getWalletConnection(
    provider: WalletMobileProvider,
    { network, mobileSession }: { network: Network; mobileSession: WalletMobileSession },
  ): Promise<WalletConnection> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!mobileSession.walletConnectSession || this.isSessionExpired(mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }

    const accounts = await this.getAccount({ network, mobileSession });

    if (!accounts || accounts.length === 0) {
      throw new Error(`No wallet connected to chain: ${network.chainId}`);
    }

    const account = accounts[0];
    return {
      id: `provider:${provider.id}:network:${network.chainId}:address:${account.address}`,
      providerId: provider.id,
      account: {
        address: account.address,
        pubkey: account.pubkey,
        algo: account.algo as Algo,
      },
      network,
      mobileSession: mobileSession,
    };
  }

  async connect(
    provider: WalletMobileProvider,
    {
      network,
      callback,
    }: {
      network: Network;
      callback?: ((walletConnection: WalletConnection, first?: boolean) => void) | undefined;
    },
  ): Promise<string> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    const chains = this.getWcChains(this.networks);

    const { uri, approval } = await this.walletConnect.connect({
      requiredNamespaces: {
        cosmos: {
          methods: ['cosmos_getAccounts', 'cosmos_signAmino', 'cosmos_signDirect'],
          chains: chains, //[`cosmos:${network.chainId}`],
          events: [
            // 'chainChanged',
            'accountsChanged',
          ],
        },
      },
    });

    approval().then(async (session) => {
      const peerMetaName = session.peer.metadata.name;
      if (peerMetaName !== this.walletConnectPeerName) {
        throw new Error(
          `Invalid provider, peerMetaName: ${peerMetaName} doesn't match the expected peerMetaName: ${this.walletConnectPeerName}`,
        );
      }

      const walletConnections = await this.getWalletConnections(provider, {
        network,
        mobileSession: {
          walletConnectSession: {
            topic: session.topic,
            expiry: session.expiry,
          },
        },
      });

      let first = true;
      for (const connection of walletConnections) {
        callback?.(connection, first);
        first = false;
      }
    });

    return uri || '';
  }

  private getWcChains(networks: Network[]) {
    return networks.map((network) => `cosmos:${network.chainId}`);
  }

  async disconnect(
    _provider: WalletMobileProvider,
    { wallet }: { network: Network; wallet: WalletConnection },
  ): Promise<void> {
    if (this.walletConnect && wallet.mobileSession.walletConnectSession) {
      try {
        await this.walletConnect.disconnect({
          topic: wallet.mobileSession.walletConnectSession.topic,
          reason: {
            code: -1,
            message: 'Disconnected by user',
          },
        });
      } catch {
        /* empty */
      }
    }
  }

  async sign(
    _provider: WalletMobileProvider,
    {
      network,
      messages,
      wallet,
      feeAmount,
      gasLimit,
      memo,
      overrides,
      intents,
    }: {
      network: Network;
      messages: TransactionMsg<any>[];
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
      intents: { androidUrl: string; iosUrl: string };
    },
  ): Promise<SigningResult> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!wallet.mobileSession.walletConnectSession || this.isSessionExpired(wallet.mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }

    const signDoc = await AminoSigningClient.prepare({
      network,
      wallet,
      messages,
      feeAmount,
      gasLimit,
      memo,
      overrides,
    });

    if (isMobile()) {
      if (isIOS()) {
        window.location.href = intents.iosUrl;
      } else if (isAndroid()) {
        window.location.href = intents.androidUrl;
      } else {
        window.location.href = intents.androidUrl;
      }
    }

    const signResponse = (await this.walletConnect.request({
      topic: wallet.mobileSession.walletConnectSession.topic,
      chainId: `cosmos:${network.chainId}`,
      request: {
        method: 'cosmos_signAmino',
        params: {
          signerAddress: wallet.account.address,
          signDoc,
        },
      },
    })) as AminoSignResponse;

    return await AminoSigningClient.finish({
      network,
      messages,
      signResponse,
    });
  }

  async signArbitrary(
    _provider: WalletMobileProvider,
    {
      network,
      wallet,
      data,
      intents,
    }: {
      network: Network;
      wallet: WalletConnection;
      data: Uint8Array;
      intents: { androidUrl: string; iosUrl: string };
    },
  ): Promise<SigningResult> {
    if (!this.walletConnect) {
      throw new Error('Wallet Connect is not available');
    }

    if (!wallet.mobileSession.walletConnectSession || this.isSessionExpired(wallet.mobileSession)) {
      throw new Error('Wallet Connect session is not available');
    }

    const signDoc = ArbitrarySigningClient.prepareSigningWithMemo({
      network,
      data,
    });

    if (isMobile()) {
      if (isIOS()) {
        window.location.href = intents.iosUrl;
      } else if (isAndroid()) {
        window.location.href = intents.androidUrl;
      } else {
        window.location.href = intents.androidUrl;
      }
    }

    const signResponse = (await this.walletConnect.request({
      topic: wallet.mobileSession.walletConnectSession.topic,
      chainId: `cosmos:${network.chainId}`,
      request: {
        method: 'cosmos_signAmino',
        params: {
          signerAddress: wallet.account.address,
          signDoc,
        },
      },
    })) as AminoSignResponse;

    return {
      signatures: [Buffer.from(signResponse.signature.signature, 'base64')],
      response: signResponse,
    };
  }

  async verifyArbitrary(
    _provider: WalletMobileProvider,
    {
      network,
      wallet,
      data,
      signResult,
    }: {
      network: Network;
      wallet: WalletConnection;
      data: Uint8Array;
      signResult: SigningResult;
    },
  ): Promise<boolean> {
    if (wallet.account.algo !== Algos.secp256k1) {
      throw new Error(`Unsupported algorithm: ${wallet.account.algo}`);
    }

    return await ArbitrarySigningClient.verifyMemoSignature({
      network,
      wallet,
      data,
      signature: signResult.signatures[0],
    });
  }
}
