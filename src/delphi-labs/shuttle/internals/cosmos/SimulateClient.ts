import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { calculateFee, GasPrice, QueryClient, TxExtension } from '@cosmjs/stargate';
import { Fee } from '../../internals/cosmos';
import {
  DEFAULT_GAS_MULTIPLIER,
  DEFAULT_GAS_PRICE,
  Network,
  NetworkCurrency,
} from '../../internals/network';
import { SimulateResult, TransactionMsg } from '../../internals/transactions';
import { WalletConnection } from '../../internals/wallet';
import { extendedRegistryTypes } from '../registry';
import FakeOfflineSigner from './FakeOfflineSigner';

export class SimulateClient {
  static async run({
    network,
    wallet,
    messages,
    overrides,
  }: {
    network: Network;
    wallet: WalletConnection;
    messages: TransactionMsg[];
    overrides?: {
      rpc?: string;
      rest?: string;
      gasAdjustment?: number;
      gasPrice?: string;
      feeCurrency?: NetworkCurrency;
    };
  }): Promise<SimulateResult> {
    // if (isInjectiveNetwork(network.chainId)) {
    //   return await this.injective({ network, wallet, messages, overrides });
    // }

    return await this.cosmos({ network, wallet, messages, overrides });
  }

  static async cosmos({
    network,
    wallet,
    messages,
    overrides,
  }: {
    network: Network;
    wallet: WalletConnection;
    messages: TransactionMsg[];
    overrides?: {
      rpc?: string;
      rest?: string;
      gasAdjustment?: number;
      gasPrice?: string;
      feeCurrency?: NetworkCurrency;
    };
  }): Promise<SimulateResult> {
    const signer = new FakeOfflineSigner(wallet);
    const gasPrice = GasPrice.fromString(
      overrides?.gasPrice ?? network.gasPrice ?? DEFAULT_GAS_PRICE,
    );
    const client = await SigningCosmWasmClient.connectWithSigner(
      overrides?.rpc ?? network.rpc,
      signer,
      {
        gasPrice,
      },
    );
    for (const [typeUrl, type] of extendedRegistryTypes) {
      client.registry.register(typeUrl, type);
    }

    const processedMessages = messages.map((message) => message.toCosmosMsg());

    try {
      const queryClient = (client as any).forceGetQueryClient() as QueryClient & TxExtension;
      const anyMsgs = processedMessages.map((m) => client.registry.encodeAsAny(m));
      const { sequence } = await client.getSequence(wallet.account.address);
      const pubkey = encodeSecp256k1Pubkey((await signer.getAccounts())[0].pubkey);
      const simulationResult = await queryClient.tx.simulate(anyMsgs, undefined, pubkey, sequence);

      if (simulationResult.result && simulationResult.gasInfo) {
        const gasEstimation = Number(simulationResult.gasInfo?.gasUsed ?? 0);

        const fee = calculateFee(
          Math.round(gasEstimation * (overrides?.gasAdjustment ?? DEFAULT_GAS_MULTIPLIER)),
          overrides?.gasPrice ?? network.gasPrice ?? DEFAULT_GAS_PRICE,
        ) as Fee;

        return {
          success: true,
          fee,
          simulationResult,
        };
      }

      return {
        success: false,
        error: 'Failed to simulate transaction',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }
}

export default SimulateClient;
