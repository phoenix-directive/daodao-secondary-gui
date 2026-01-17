import { AddressLink } from '@/components/ui/address-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fromBaseUnits, toBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { useProposalFormContext } from '@/lib/proposal-form-context';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { ActionType } from '../action-registry';

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
const isBankSend = (data: any): data is BankSendMsg => {
  return data?.bank?.send !== undefined;
};

// Form component
function BankSendForm({
  data,
  onUpdate,
}: {
  data: BankSendMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const { balances } = useProposalFormContext();
  const sendData = data.bank.send;

  const currentDenom = sendData.amount?.[0]?.denom || '';
  const currentAmountBase = sendData.amount?.[0]?.amount || '0';

  // Find the selected balance to get decimals
  const selectedBalance = balances.data.value?.find((b: any) => b.denom === currentDenom);
  const decimals = selectedBalance?.decimals || 6;

  // Convert from base units for display
  const displayAmount = fromBaseUnits(currentAmountBase, decimals);

  // Local state for input value
  const [inputValue, setInputValue] = useState(displayAmount);

  const handleDenomChange = (newDenom: string) => {
    const balance = balances.data.value?.find((b: any) => b.denom === newDenom);
    const newDecimals = balance?.decimals || 6;

    // Keep the same display amount when changing denom
    const baseAmount = toBaseUnits(inputValue, newDecimals);

    onUpdate(['bank', 'send', 'amount'], [{ denom: newDenom, amount: baseAmount }]);
  };

  const handleAmountBlur = () => {
    // Convert to base units for storage
    const baseAmount = inputValue === '' ? '0' : toBaseUnits(inputValue, decimals);

    const amount = [...(sendData.amount || [{ denom: currentDenom || 'uluna', amount: '0' }])];
    amount[0].amount = baseAmount;
    onUpdate(['bank', 'send', 'amount'], amount);
  };

  const setMaxAmount = () => {
    if (!selectedBalance) return;

    const maxAmount = fromBaseUnits(selectedBalance.amount, selectedBalance.decimals);
    setInputValue(maxAmount);

    // Update the form data immediately
    const amount = [...(sendData.amount || [{ denom: currentDenom || 'uluna', amount: '0' }])];
    amount[0].amount = selectedBalance.amount;
    onUpdate(['bank', 'send', 'amount'], amount);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>To Address</Label>
        <Input
          value={sendData.to_address || ''}
          onChange={(e) => onUpdate(['bank', 'send', 'to_address'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="flex gap-2">
          <Select value={currentDenom} onValueChange={handleDenomChange}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Select token">
                {selectedBalance?.display || currentDenom || 'Select token'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {balances.loading.value ? (
                <SelectItem value="_loading" disabled>
                  Loading...
                </SelectItem>
              ) : balances.data.value && balances.data.value.length > 0 ? (
                balances.data.value.map((balance: any) => (
                  <SelectItem key={balance.denom} value={balance.denom}>
                    {balance.display}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_empty" disabled>
                  No tokens available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleAmountBlur}
            placeholder="0.00"
            className="flex-1"
          />
        </div>
        {selectedBalance && (
          <p className="text-xs text-muted-foreground">
            Available:{' '}
            <button
              type="button"
              onClick={setMaxAmount}
              className="text-primary hover:underline cursor-pointer font-medium"
            >
              {fromBaseUnits(selectedBalance.amount, selectedBalance.decimals)}
            </button>{' '}
            {selectedBalance.display}
          </p>
        )}
      </div>
    </div>
  );
}

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
