import { AddressLink } from '@/components/ui/address-link';
import { fromBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { Send } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { BankSendForm } from './BankSendForm';

// Type definition for Bank Send message
export type BankSendMsg = {
  bank: {
    send: {
      to_address: string;
      amount: Array<{ denom: string; amount: string }>;
    };
  };
};

// Type guard
export const isBankSend = (data: any): data is BankSendMsg => {
  return data?.bank?.send !== undefined;
};

// Get subtitle for preview
function getSubtitle(data: BankSendMsg) {
  const { to_address, amount } = data.bank.send;
  const coin = amount[0];
  if (!coin) {
    return undefined;
  }

  // Use a simple hook wrapper component to access usePrices
  function SubtitleContent() {
    const { getPrice } = usePrices();
    const priceData = getPrice(coin.denom);
    const displayAmount = priceData ? fromBaseUnits(coin.amount, priceData.decimals) : coin.amount;
    const displayDenom = priceData?.display || coin.denom;

    return (
      <div className="flex gap-1">
        {displayAmount} {displayDenom} to <AddressLink address={to_address} />
      </div>
    );
  }

  return <SubtitleContent />;
}

// Export the action type configuration
export const BankSendActionType: ActionType<BankSendMsg> = {
  id: 'bank_send',
  name: 'Send Tokens',
  icon: Send,
  guard: isBankSend,
  getTitle: () => 'Bank Send',
  getSubtitle: getSubtitle,
  expandable: false,
  FormEditor: BankSendForm,
};
