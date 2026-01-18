import { cwMsgToEncodeObject, getTypesRegistry } from '@/daodao/protobuf';
import { createRPCQueryClient } from '@/daodao/protobuf/codegen/cosmos/rpc.query';
import { SignMode } from '@/daodao/protobuf/codegen/cosmos/tx/signing/v1beta1/signing';
import { SimulateRequest } from '@/daodao/protobuf/codegen/cosmos/tx/v1beta1/service';
import {
  AuthInfo,
  Fee as ProtoFee,
  Tx,
  TxBody,
} from '@/daodao/protobuf/codegen/cosmos/tx/v1beta1/tx';
import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import {
  DEFAULT_GAS_PRICE,
  FakeOfflineSigner,
  Fee,
  MsgExecuteContract,
  ShuttleContextType,
  TransactionMsg,
} from '@/delphi-labs/shuttle-react';
import { ExtendedError, getErrorMessageSync, getWallet, toArray } from '@/hooks/helpers/helpers';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { calculateFee, Coin, GasPrice, QueryClient, TxExtension } from '@cosmjs/stargate';
import { Chain } from './assets';
import { ChainEventsReader } from './events.reader';
import { ReadService } from './ReadService';

export interface SimulationResult {
  fee: Coin;
  gasLimit?: string;
  msgs: TransactionMsg<any>[];
  reader: ChainEventsReader;
}
export class WriteService {
  constructor(
    private chain: Chain,
    private _read: ReadService,
  ) {}

  async simulate(
    shuttle: ShuttleContextType,
    msg: TransactionMsg<any> | TransactionMsg<any>[],
  ): Promise<SimulationResult> {
    const msgs = toArray(msg ?? []);

    if (!msgs.length) {
      throw new Error('no messages provided');
    }

    const wallet = getWallet(shuttle, this.chain);

    msgs.forEach((msg) => {
      if (msg instanceof MsgExecuteContract) {
        msg.value.sender ||= wallet.account.address;
      }
    });

    const signer = new FakeOfflineSigner(wallet);
    const gasPrice = GasPrice.fromString(wallet.network.gasPrice!);
    const client = await SigningCosmWasmClient.connectWithSigner(wallet.network.rpc, signer, {
      gasPrice,
    });

    try {
      const queryClient = (client as any).forceGetQueryClient() as QueryClient & TxExtension;
      const processedMessages = msgs.map((message) => message.toCosmosMsg());
      const anyMsgs = processedMessages.map((m) => client.registry.encodeAsAny(m));
      const { sequence } = await client.getSequence(wallet.account.address);
      const pubkey = encodeSecp256k1Pubkey((await signer.getAccounts())[0].pubkey);
      const simulationResult = await queryClient.tx.simulate(anyMsgs, undefined, pubkey, sequence);

      if (simulationResult.result && simulationResult.gasInfo) {
        const gasEstimation = Number(simulationResult.gasInfo?.gasUsed ?? 0);

        const fee = calculateFee(
          Math.round(gasEstimation * 1.5),
          wallet.network.gasPrice ?? DEFAULT_GAS_PRICE,
        ) as Fee;
        const reader = ChainEventsReader.fromClearTxsLogs(simulationResult.result.events);
        reader.log('simulation');

        return {
          fee: fee?.amount[0],
          gasLimit: fee.gas,
          msgs,
          reader: reader,
        };
      } else {
        throw new ExtendedError('no simulation result', 'Error during simulation');
      }
    } catch (error: any) {
      const message = getErrorMessageSync(error.message);
      console.error(message);
      throw new ExtendedError(message, 'Error during simulation');
    }
  }

  /**
   * Simulate messages directly using the cosmos RPC client.
   * This is useful for simulating messages that will be executed by a different sender (e.g., DAO core).
   */
  async simulateMessages(
    rpcEndpoint: string,
    chainId: string,
    senderAddress: string,
    msgs: UnifiedCosmosMsg[],
  ): Promise<void> {
    try {
      const cosmosRpcClient = await createRPCQueryClient({ rpcEndpoint });

      const typesRegistry = getTypesRegistry();
      const encodedMsgs = msgs.map((msg) => {
        const encoded = cwMsgToEncodeObject(chainId, msg, senderAddress);
        return typesRegistry.encodeAsAny(encoded);
      });

      const tx = Tx.fromPartial({
        authInfo: AuthInfo.fromPartial({
          fee: ProtoFee.fromPartial({}),
          signerInfos: [
            {
              modeInfo: {
                single: {
                  mode: SignMode.SIGN_MODE_DIRECT,
                },
              },
            } as any,
          ],
        }),
        body: TxBody.fromPartial({
          messages: encodedMsgs,
          memo: '',
        }),
        signatures: [new Uint8Array()],
      });

      const request = SimulateRequest.fromPartial({
        txBytes: Tx.encode(tx).finish(),
      });

      await cosmosRpcClient.cosmos.tx.v1beta1.simulate(request);
    } catch (error: any) {
      const message = getErrorMessageSync(error.message || error);
      throw new ExtendedError(message, 'Error during simulation');
    }
  }

  // async execute(
  //   title: string,
  //   shuttle: ShuttleContextType,
  //   msg: TransactionMsg<any> | TransactionMsg<any>[],
  //   options?: {
  //     memo?: string;
  //     onSuccess?: (tx: GetTxResponse, notificationId: string) => void;
  //   }
  // ) {
  //   const id = initSimulationTx(title);
  //   try {
  //     const simulationValue = await this.simulate(shuttle, msg);
  //     updateBroadcastTx(id, title);
  //     let memo: string | undefined = options?.memo ?? "www.boostdao.io";
  //     const wallet = getWallet(shuttle, this.chain);
  //     if (wallet.account?.isLedger) {
  //       memo = undefined;
  //     }

  //     try {
  //       const result = await shuttle.broadcast({
  //         wallet,
  //         memo,
  //         messages: simulationValue.msgs,
  //         gasLimit: simulationValue.gasLimit,
  //         feeAmount: simulationValue.fee.amount,
  //       });

  //       watchTx(id, this.read, result, options?.onSuccess);
  //     } catch (e: any) {
  //       console.warn(e);
  //       cancelTx(id, "Error during broadcast", e.message);
  //     }
  //   } catch (e: any) {
  //     console.warn(e);
  //     cancelTx(id, "Error during simulation", e.message);
  //   }
  // }

  // public async broadcast(
  //   title: string,
  //   shuttle: ShuttleContextType,
  //   simulationValue: SimulationResult,
  //   options?: { memo?: string; onSuccess?: (tx: GetTxResponse) => void }
  // ) {
  //   const id = initBroadcastTx(title);
  //   try {
  //     const wallet = getWallet(shuttle, this.chain);
  //     const memo = wallet.account?.isLedger ? undefined : "www.boostdao.io";
  //     const result = await shuttle.broadcast({
  //       wallet,
  //       memo,
  //       messages: simulationValue.msgs,
  //       gasLimit: simulationValue.gasLimit,
  //       feeAmount: simulationValue.fee.amount,
  //     });

  //     watchTx(id, this.read, result, options?.onSuccess);
  //     return true;
  //   } catch (e: any) {
  //     console.warn(e);
  //     cancelTx(id, "Error during broadcast", e.message);
  //     return false;
  //   }
  // }
}
