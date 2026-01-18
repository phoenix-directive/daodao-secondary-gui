import { AddressLink } from '@/components/ui/address-link';
import { fromBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { Send } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { CW20SendForm } from './CW20SendForm';
import { CW20SendView } from './CW20SendView';

// Type definition for CW20 Send message (send to contract with message)
export type CW20SendMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: string; // base64 encoded JSON
    };
  };
};

// Decoded send message structure
export type SendMessage = {
  send: {
    contract: string;
    amount: string;
    msg: string; // nested base64 encoded message
  };
};

// Type guard
export const isCW20Send = (data: any): data is CW20SendMsg => {
  if (typeof data?.wasm?.execute?.msg !== 'string') return false;
  try {
    const decoded = JSON.parse(atob(data.wasm.execute.msg));
    return decoded?.send !== undefined;
  } catch {
    return false;
  }
};

// Get subtitle for preview
function getSubtitle(data: CW20SendMsg): React.ReactNode {
  try {
    const decoded = JSON.parse(atob(data.wasm.execute.msg));
    if (!decoded?.send?.contract || !decoded?.send?.amount) {
      return undefined;
    }

    const { contract_addr } = data.wasm.execute;
    const { contract, amount, msg } = decoded.send;

    // Decode inner message to get action name
    let actionName = '';
    if (msg) {
      try {
        const innerMsg = JSON.parse(atob(msg));
        const firstKey = Object.keys(innerMsg)[0];
        if (firstKey) {
          actionName = firstKey
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      } catch {
        // Ignore if we can't decode
      }
    }

    // Use a simple hook wrapper component to access usePrices
    function SubtitleContent() {
      const { getPrice } = usePrices();
      const priceData = getPrice(contract_addr);
      const displayAmount = priceData ? fromBaseUnits(amount, priceData.decimals) : amount;
      const displayDenom = priceData?.display || contract_addr;

      return (
        <div className="flex gap-1">
          {actionName && <span>{actionName} -</span>} {displayAmount} {displayDenom} to{' '}
          <AddressLink address={contract} />
        </div>
      );
    }

    return <SubtitleContent />;
  } catch {
    return undefined;
  }
}

// Export the action type configuration
export const CW20SendActionType: ActionType<CW20SendMsg> = {
  id: 'cw20_send',
  name: 'Send CW20 to Contract',
  icon: Send,
  guard: isCW20Send,
  getTitle: () => 'CW20 Send',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: CW20SendForm,
  ViewComponent: CW20SendView,
};
