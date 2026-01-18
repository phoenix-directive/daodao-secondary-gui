import { AddressLink } from '@/components/ui/address-link';
import { fromBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { ArrowRightLeft } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { CW20TransferForm } from './CW20TransferForm';
import { CW20TransferView } from './CW20TransferView';

// Type definition for CW20 Transfer message
export type CW20TransferMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: string; // base64 encoded JSON
    };
  };
};

// Decoded transfer message structure
export type TransferMessage = {
  transfer: {
    recipient: string;
    amount: string;
  };
};

// Type guard
export const isCW20Transfer = (data: any): data is CW20TransferMsg => {
  if (typeof data?.wasm?.execute?.msg !== 'string') return false;
  try {
    const decoded = JSON.parse(atob(data.wasm.execute.msg));
    return decoded?.transfer !== undefined;
  } catch {
    return false;
  }
};

// Get subtitle for preview
function getSubtitle(data: CW20TransferMsg): React.ReactNode {
  try {
    const decoded = JSON.parse(atob(data.wasm.execute.msg));
    if (!decoded?.transfer?.recipient || !decoded?.transfer?.amount) {
      return undefined;
    }

    const { contract_addr } = data.wasm.execute;
    const { recipient, amount } = decoded.transfer;

    // Use a simple hook wrapper component to access usePrices
    function SubtitleContent() {
      const { getPrice } = usePrices();
      const priceData = getPrice(contract_addr);
      const displayAmount = priceData ? fromBaseUnits(amount, priceData.decimals) : amount;
      const displayDenom = priceData?.display || contract_addr;

      return (
        <div className="flex gap-1">
          {displayAmount} {displayDenom} to <AddressLink address={recipient} />
        </div>
      );
    }

    return <SubtitleContent />;
  } catch {
    return undefined;
  }
}

// Export the action type configuration
export const CW20TransferActionType: ActionType<CW20TransferMsg> = {
  id: 'cw20_transfer',
  name: 'Transfer CW20 Tokens',
  icon: ArrowRightLeft,
  guard: isCW20Transfer,
  getTitle: () => 'CW20 Transfer',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: CW20TransferForm,
  ViewComponent: CW20TransferView,
};
