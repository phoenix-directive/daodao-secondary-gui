import { fromBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { Flame } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { BankBurnForm } from './BankBurnForm';

// Type definition for Bank Burn message
export type BankBurnMsg = {
  bank: {
    burn: {
      amount: Array<{ denom: string; amount: string }>;
    };
  };
};

// Type guard
export const isBankBurn = (data: any): data is BankBurnMsg => {
  return data?.bank?.burn !== undefined;
};

// Get subtitle for preview
function getSubtitle(data: BankBurnMsg) {
  const { amount } = data.bank.burn;
  const coin = amount[0];
  if (!coin) {
    return undefined;
  }

  function SubtitleContent() {
    const { getPrice } = usePrices();
    const priceData = getPrice(coin.denom);
    const displayAmount = priceData ? fromBaseUnits(coin.amount, priceData.decimals) : coin.amount;
    const displayDenom = priceData?.display || coin.denom;

    return (
      <div className="flex gap-1">
        Burn {displayAmount} {displayDenom}
      </div>
    );
  }

  return <SubtitleContent />;
}

// Export the action type configuration
export const BankBurnActionType: ActionType<BankBurnMsg> = {
  id: 'bank_burn',
  name: 'Burn Tokens',
  icon: Flame,
  guard: isBankBurn,
  getTitle: () => 'Bank Burn',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: BankBurnForm,
};
