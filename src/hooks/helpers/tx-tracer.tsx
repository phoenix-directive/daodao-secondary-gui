import TxWatcher from '@/delphi-labs/shuttle/internals/transactions/TxWatcher';
import { Config } from '@/hooks/helpers/ChainService';
import { TxHashLink } from '@/hooks/helpers/TxHashLink';
import { triggerReload } from '@/hooks/useReload';
import { ReactNode } from 'react';
import { toast } from 'sonner';

const getErrorMessage = async (error: any): Promise<string> => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Unknown error occurred';
};

const reload = () => {
  triggerReload();
};

export const growlTx = async (
  network: Config,
  title: string | ReactNode,
  broadcast: () => Promise<string>,
) => {
  const toastId = toast.loading(
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">Sign transaction in wallet.</div>
    </div>,
    {
      closeButton: true,
    },
  );

  try {
    const txHash = await broadcast();
    toast.loading(
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">
          <TxHashLink txhash={txHash} />
        </div>
      </div>,
      { id: toastId },
    );

    const rpc = network.network?.rpc;
    if (!rpc) {
      throw new Error('No RPC endpoint found for network ' + network.network.chainId);
    }

    const tx = await TxWatcher.findTx(rpc, txHash);
    if (!tx) {
      throw new Error('Transaction not found in the network');
    }

    if (tx.code === 0) {
      toast.success(
        <div>
          <div className="font-medium">{title}</div>
          <div>
            <TxHashLink txhash={txHash} />
          </div>
        </div>,
        { id: toastId, duration: 5000 },
      );
      reload();
      return { tx, id: toastId };
    } else {
      // console.log("Failed tx:", tx);
      toast.error(
        <div>
          <div className="font-medium">{title} failed</div>
          <div className="text-sm text-muted-foreground">{tx.rawLog}</div>
        </div>,
        { id: toastId, duration: 5000 },
      );

      throw new Error('Transaction failed: ' + tx.rawLog);
    }
  } catch (error) {
    const message = await getErrorMessage(error);

    const isRejected = message === 'Request rejected';

    if (isRejected) {
      toast.warning(
        <div>
          <div className="font-medium">{title} denied</div>
          <div className="text-sm text-muted-foreground">You need to sign the transaction</div>
        </div>,
        { id: toastId, duration: 5000 },
      );
    } else {
      toast.error(
        <div>
          <div className="font-medium">{title} failed</div>
          <div className="text-sm text-muted-foreground">{message}</div>
        </div>,
        { id: toastId, duration: 5000 },
      );
    }

    throw error;
  }
};
