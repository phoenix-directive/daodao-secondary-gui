import { BroadcastResult, Fee, TransactionMsg, WalletConnection } from '@/delphi-labs/shuttle';
import { useShuttle } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { ChainService } from '@/hooks/helpers/ChainService';
import { ChainEventsReader } from '@/hooks/helpers/events.reader';
import {
  getErrorInformationMessage,
  getErrorMessageSync,
  getErrorType,
  reactNodeToText,
  tryGetJsonObjectEnd,
} from '@/hooks/helpers/helpers';
import { growlTx } from '@/hooks/helpers/tx-tracer';
import { useWhyDidYouUpdate } from '@/hooks/useWhyDidYouUpdate';
import { IndexedTx } from '@cosmjs/stargate';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export type SimulateResult<T = any> =
  | { loading: true }
  | {
      loading?: false;
      success: boolean;
      fee?: Fee;
      error?: string;
      originalError?: string;
      errorData?: any;
      timestamp?: Date;
      reader?: ChainEventsReader;
      info?: T;
      message?: string;
    };

export interface UseTxOptions<T> {
  title: string | ReactNode;
  chainId: Chain;

  debounceTime?: number;
  valid?: boolean;
  logTitle?: string;
  /** Called when the simulation fails. However, the `simulation` state of the `TxHook` return value will also be updated. */
  onSimulateError?(error: any): void;
  /** Called when the transaction has been broadcast. Does not mean it has been confirmed or even successful on-chain yet. */
  onBroadcast?(result: BroadcastResult): void;
  /** Called when the transaction has been confirmed on-chain. */
  onTxSuccess?(
    tx: IndexedTx,
    reader: ChainEventsReader,
    msgs: TransactionMsg<any>[],
    growlId: string | undefined,
  ): void | Promise<void>;
  /** Called when the transaction failed to execute. */
  onTxError?(error: any): void;

  beforeBroadcast?: (
    estimate: SimulateResult<T> & { loading: false },
    msgs: TransactionMsg<any>[],
  ) => TransactionMsg<any>[];

  prepareInfo?: (reader: ChainEventsReader) => T;
}

export interface TxHook<T = any> {
  /** Result of the simulation, has different sub-states. */
  simulation: SimulateResult<T>;
  /** Result of the broadcast, if it has been broadcasted yet. */
  result: TxResult;
  error: string | undefined;
  /** Props to pass to the `Button` component for a standard appearance.
   *
   * You can override the `onClick` callback with your own that calls the `broadcast` method.
   */
  buttonProps: {
    loading: boolean;
    disabled: boolean;
    onClick: () => void;
    error?: boolean;
    errorMessage?: string;
    errorData?: any;
    showTooltip?: boolean;
    tooltipContent?: string;
    errors?: string[] | undefined;
  };
  simulate: () => Promise<SimulateResult & { loading: false }>;
  broadcast: () => Promise<TxResult>;
  testTrack: (hash: string) => Promise<void>;
}

export interface TxResult {
  /** Whether the transaction is currently pending. */
  loading: boolean;
  /** Immediate result of the broadcast. Does not mean the transaction has been confirmed on-chain yet. */
  broadcast?: BroadcastResult;
  /** When present, the transaction has been confirmed on-chain. */
  tx?: IndexedTx;
  reader?: ChainEventsReader;
  /** When present, an error has occurred during the broadcast. */
  error?: any;

  success: boolean;
}

export function useTx<T>(messages: TransactionMsg[], options: UseTxOptions<T>) {
  useWhyDidYouUpdate('useTx', options);

  const shuttle = useShuttle();
  const [retry, setRetry] = useState(0);
  const [simulation, setSimulation] = useState<SimulateResult>({
    loading: false,
    success: false,
    error: undefined,
    errorData: undefined,
  });
  const [result, setResult] = useState<TxResult>({
    loading: false,
    error: 'Not broadcasted yet',
    success: false,
  });

  const isValid = useMemo(() => {
    return (options.valid ?? true) && messages.length > 0;
  }, [options.valid, messages]);

  const simulate = useCallback(async (): Promise<SimulateResult & { loading: false }> => {
    if (
      !shuttle.availableExtensionProviders.length &&
      shuttle.extensionProviders.length &&
      !shuttle.availableMobileProviders.length
    ) {
      setTimeout(() => {
        setRetry((prev) => prev + 1);
      }, 500);
      const errorResult = {
        success: false,
        loading: false,
        error: undefined,
        errorData: undefined,
        message: 'No available extension providers',
      } as const;
      setSimulation(errorResult);
      return errorResult;
    }

    if (!isValid) {
      const invalidResult = {
        success: false,
        loading: false,
        error: undefined,
        errorData: undefined,
      } as const;
      setSimulation(invalidResult);
      return invalidResult;
    }

    try {
      setSimulation({
        loading: true,
      });

      console.log('simulating', messages);

      const res = await shuttle.simulate({
        messages: messages,
        wallet: getWalletByChainId(options.chainId, shuttle.wallets),
      });
      console.log('simulated', res);

      if (!res.success) {
        console.error('Simulation error', res);
        const errorResult = {
          loading: false,
          success: false,
          error: getErrorMessageSync(res.error),
          errorData: tryGetJsonObjectEnd(res.error),
        } as const;
        setSimulation(errorResult);
        return errorResult;
      }

      let reader: ChainEventsReader | undefined;
      if (res.success && res.simulationResult.result?.events) {
        reader = ChainEventsReader.fromClearTxsLogs(res.simulationResult.result.events);
        reader.log(options.logTitle ?? reactNodeToText(options.title));
      }

      const successResult = {
        ...res,
        reader,
        loading: false,
        info: options.prepareInfo ? options.prepareInfo(reader!) : undefined,
      } as const;

      setSimulation(successResult);
      return successResult;
    } catch (err) {
      console.error('Simulation error', err);
      const errorResult = {
        loading: false,
        success: false,
        error: getErrorMessageSync(err),
        errorData: tryGetJsonObjectEnd((err as any).message),
      } as const;
      console.log('setting simulation error', errorResult);
      setSimulation(errorResult);
      return errorResult;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuttle, messages, isValid]);

  const error = useMemo(() => {
    if (simulation.loading) {
      return undefined;
    }
    return simulation.error;
  }, [simulation]);

  const testToast = useCallback(async (hash: string) => {
    const usedNetwork = ChainService.getByChain(options.chainId);
    const { tx, id } = await growlTx(
      usedNetwork.config,
      options.title ?? 'Transaction',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        options.onBroadcast?.({
          events: [],
          hash,
          response: {} as any,
          rawLogs: '',
        });
        return hash;
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const broadcast = useCallback(async (): Promise<TxResult> => {
    if (simulation.loading || !simulation.fee || !messages.length) {
      toast.error('Transaction not ready', {
        description: 'Gas estimation is still pending',
      });
      return {
        loading: false,
        error: 'Gas estimation is still pending',
        success: false,
      };
    }

    const { fee } = simulation;

    const [feeCoin] = fee.amount ?? [];
    if (!feeCoin) {
      toast.error('Unexpected error', {
        description: "No gas fee coin found. This shouldn't happen.",
      });
    }

    setResult({ loading: true, success: false });

    let broadcastMessages = messages;
    if (options.beforeBroadcast) {
      broadcastMessages = options.beforeBroadcast(simulation as any, messages);
    }

    try {
      const wallet = getWalletByChainId(options.chainId, shuttle.wallets);
      const usedNetwork = ChainService.getByChain(options.chainId);
      const { tx, id } = await growlTx(
        usedNetwork.config,
        options.title ?? 'Transaction',
        async () => {
          const res = await shuttle.broadcast({
            wallet: wallet,
            messages: broadcastMessages,
            memo: getMemo(wallet!),
            feeAmount: feeCoin.amount,
            gasLimit: fee.gas,
          });
          options.onBroadcast?.(res);
          setResult((prev) => ({
            ...prev,
            broadcast: res,
            reader: ChainEventsReader.fromClearTxsLogs(res.events as any[]),
          }));
          return res.hash;
        },
      );
      console.log('broadcast done: ', result);
      const reader = ChainEventsReader.fromClearTxsLogs(tx.events as any[]);
      const onTxSuccessResult = options.onTxSuccess?.(
        tx,
        reader,
        broadcastMessages,
        id?.toString(),
      );

      if (onTxSuccessResult instanceof Promise) {
        await onTxSuccessResult;
      }

      const finalResult = {
        ...result,
        reader,
        loading: false,
        tx,
        success: true,
      };
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const errorResult = {
        loading: false,
        error: err,
        success: false,
      };
      setResult(errorResult);
      return errorResult;
    }
  }, [simulation, messages, options, shuttle, result]);

  const buttonProps = useMemo(() => {
    const originalError =
      !simulation.loading && simulation.originalError && simulation.originalError;
    const errorMessage =
      !simulation.loading && simulation.error && getErrorMessageSync(simulation.error);

    const errorData = !simulation.loading && simulation.errorData && simulation.errorData;

    const simulationErrorMessage =
      !simulation.loading && simulation.error ? getErrorType(simulation.error) : undefined;

    const simulationInformationErrorMessage =
      !simulation.loading && simulation.error
        ? getErrorInformationMessage(errorMessage as string)
        : undefined;

    const errorMsg =
      simulationErrorMessage === 'Unknown'
        ? simulationInformationErrorMessage || 'Unknown error'
        : errorMessage;

    return {
      loading: result.loading || (simulation.loading ?? false),
      disabled:
        result.loading || simulation.loading || !simulation.success || !isValid || !messages.length,
      onClick: broadcast,
      error: !simulation.loading && simulation.error !== undefined,
      errorMessage: simulationErrorMessage,
      errorData,
      showTooltip: !simulation.loading && simulation.error !== undefined,
      tooltipContent: simulationInformationErrorMessage,
      errors: errorMsg ? [errorMsg] : undefined,
    };
  }, [simulation, result, messages, broadcast, isValid]);

  const ret = useMemo<TxHook<T>>(() => {
    return {
      simulation,
      result,
      simulate,
      broadcast,
      buttonProps,
      error,
      testTrack: testToast,
    };
  }, [simulation, result, simulate, broadcast, buttonProps, error, testToast]);

  useEffect(() => {
    if (retry > 0) {
      // ignore
    }

    if (!messages.length) {
      setSimulation({
        loading: false,
        success: false,
      });
      return;
    }

    if (!options.debounceTime) {
      simulate();
      return;
    }

    setSimulation({
      loading: true,
    });

    const handler = setTimeout(() => {
      simulate();
    }, options.debounceTime);

    return () => clearTimeout(handler);
  }, [messages, isValid, retry, simulate, options.debounceTime]);

  return ret;
}

export function getMemo(wallet: WalletConnection): string | null | undefined {
  if (wallet.account.isLedger || wallet.mobileSession.walletConnectSession) {
    return undefined;
  }
  return 'creda.finance';
}

function getWalletByChainId(chainId: Chain, wallets: WalletConnection[]) {
  const result = wallets.find((a) => a.network.chainId === chainId);
  return result;
}
