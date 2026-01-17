import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
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
import { isCw20 } from '@/hooks/helpers/helpers';
import { useChainByContractOptional } from '@/hooks/useChain';
import { usePrices } from '@/hooks/usePrices';
import { useProposalFormContext } from '@/lib/proposal-form-context';
import { ArrowRightLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActionType } from '../action-registry';

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
type TransferMessage = {
  transfer: {
    recipient: string;
    amount: string;
  };
};

// Type guard
const isCW20Transfer = (data: any): data is CW20TransferMsg => {
  if (typeof data?.wasm?.execute?.msg !== 'string') return false;
  try {
    const decoded = JSON.parse(atob(data.wasm.execute.msg));
    return decoded?.transfer !== undefined;
  } catch {
    return false;
  }
};

// Form component
function CW20TransferForm({
  data,
  onUpdate,
  onUpdateMulti,
}: {
  data: CW20TransferMsg;
  onUpdate: (path: string[], value: any) => void;
  onUpdateMulti?: (updates: Array<{ path: string[]; value: any }>) => void;
}) {
  const { daoAddress } = useProposalFormContext();
  const executeData = data.wasm.execute;
  const chain = useChainByContractOptional(daoAddress);
  const { prices, getPrice } = usePrices();

  // Decode the message
  const [decodedMsg, setDecodedMsg] = useState<TransferMessage>(() => {
    try {
      return JSON.parse(atob(executeData.msg));
    } catch {
      return { transfer: { recipient: '', amount: '' } };
    }
  });

  // Sync decodedMsg when executeData.msg changes externally
  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(executeData.msg));
      if (decoded?.transfer) {
        setDecodedMsg(decoded);
      }
    } catch {
      // Ignore invalid messages
    }
  }, [executeData.msg]);

  // Get all CW20 tokens from prices
  const cw20Tokens = Object.entries(prices)
    .filter(([denom]) => isCw20(denom))
    .map(([denom, data]) => ({
      denom,
      display: data.display,
      decimals: data.decimals,
      price_usd: data.price_usd,
    }));

  // Find the selected token from prices
  const selectedToken = getPrice(executeData.contract_addr);
  const decimals = selectedToken?.decimals || 6;

  // Query actual CW20 balance from contract
  const [cw20Balance, setCw20Balance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (!executeData.contract_addr || !chain || !daoAddress || !isCw20(executeData.contract_addr)) {
      setCw20Balance(null);
      return;
    }

    setLoadingBalance(true);
    chain.read
      .query<{ balance: string }>(executeData.contract_addr, {
        balance: { address: daoAddress },
      })
      .then((result) => {
        setCw20Balance(result.balance);
      })
      .catch((err) => {
        console.error('Failed to query CW20 balance:', err);
        setCw20Balance('0');
      })
      .finally(() => {
        setLoadingBalance(false);
      });
  }, [executeData.contract_addr, chain, daoAddress]);

  // Convert from base units for display
  const displayAmount = fromBaseUnits(decodedMsg.transfer.amount || '0', decimals);

  // Local state for input value
  const [inputValue, setInputValue] = useState(displayAmount);

  // Update input value when decoded message changes
  useEffect(() => {
    setInputValue(fromBaseUnits(decodedMsg.transfer.amount || '0', decimals));
  }, [decodedMsg.transfer.amount, decimals]);

  const handleTokenChange = (newDenom: string) => {
    const token = getPrice(newDenom);
    const newDecimals = token?.decimals || 6;

    // Keep the same display amount when changing token
    const baseAmount = toBaseUnits(inputValue, newDecimals);

    // Create new message with updated amount
    const newMsg = {
      transfer: {
        recipient: decodedMsg.transfer.recipient,
        amount: baseAmount,
      },
    };

    const encoded = btoa(JSON.stringify(newMsg));

    // Use onUpdateMulti if available to update both values atomically
    if (onUpdateMulti) {
      onUpdateMulti([
        { path: ['wasm', 'execute', 'contract_addr'], value: newDenom },
        { path: ['wasm', 'execute', 'msg'], value: encoded },
      ]);
    } else {
      // Fallback to individual updates
      onUpdate(['wasm', 'execute', 'contract_addr'], newDenom);
      onUpdate(['wasm', 'execute', 'msg'], encoded);
    }
  };

  const handleAmountBlur = () => {
    // Convert to base units for storage
    const baseAmount = inputValue === '' ? '0' : toBaseUnits(inputValue, decimals);

    const newMsg = {
      transfer: {
        ...decodedMsg.transfer,
        amount: baseAmount,
      },
    };
    setDecodedMsg(newMsg);
    const encoded = btoa(JSON.stringify(newMsg));
    onUpdate(['wasm', 'execute', 'msg'], encoded);
  };

  const updateRecipient = (value: string) => {
    const newMsg = {
      transfer: {
        ...decodedMsg.transfer,
        recipient: value,
      },
    };
    setDecodedMsg(newMsg);
    const encoded = btoa(JSON.stringify(newMsg));
    onUpdate(['wasm', 'execute', 'msg'], encoded);
  };

  const setMaxAmount = () => {
    if (!cw20Balance || !selectedToken) return;

    const maxAmount = fromBaseUnits(cw20Balance, decimals);
    setInputValue(maxAmount);

    // Update the form data immediately
    const newMsg = {
      transfer: {
        ...decodedMsg.transfer,
        amount: cw20Balance,
      },
    };
    setDecodedMsg(newMsg);
    const encoded = btoa(JSON.stringify(newMsg));
    onUpdate(['wasm', 'execute', 'msg'], encoded);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Token & Amount</Label>
        <div className="flex gap-2">
          <Select value={executeData.contract_addr} onValueChange={handleTokenChange}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Select CW20 token">
                {selectedToken?.display || executeData.contract_addr || 'Select token'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cw20Tokens.length > 0 ? (
                cw20Tokens.map((token) => (
                  <SelectItem key={token.denom} value={token.denom}>
                    {token.display}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_empty" disabled>
                  No CW20 tokens available
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
        {selectedToken && (
          <p className="text-xs text-muted-foreground">Contract: {executeData.contract_addr}</p>
        )}
        {selectedToken && (
          <p className="text-xs text-muted-foreground">
            {loadingBalance ? (
              'Loading balance...'
            ) : cw20Balance ? (
              <>
                Available:{' '}
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-primary hover:underline cursor-pointer font-medium"
                >
                  {fromBaseUnits(cw20Balance, decimals)}
                </button>{' '}
                {selectedToken.display}
              </>
            ) : (
              'Balance unavailable'
            )}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Recipient</Label>
        <Input
          value={decodedMsg.transfer.recipient || ''}
          onChange={(e) => updateRecipient(e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
    </div>
  );
}

// View component for expanded view
function CW20TransferView({ data }: { data: CW20TransferMsg }) {
  const { contract_addr, msg } = data.wasm.execute;
  const { getPrice } = usePrices();

  // Decode message
  let decodedMsg: TransferMessage | null = null;
  try {
    decodedMsg = JSON.parse(atob(msg));
  } catch (e) {
    console.error('Failed to decode message:', e);
  }

  const tokenInfo = getPrice(contract_addr);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Token Contract</div>
          {tokenInfo ? (
            <div className="flex items-center gap-2">
              <AddressLink address={contract_addr} short={false} />
              <span className="text-sm text-muted-foreground">({tokenInfo.display})</span>
            </div>
          ) : (
            <AddressLink address={contract_addr} short={false} />
          )}
        </div>

        {decodedMsg?.transfer?.amount && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Amount</div>
            <AmountDisplay amount={decodedMsg.transfer.amount} denom={contract_addr} />
          </div>
        )}

        {decodedMsg?.transfer?.recipient && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Recipient</div>
            <AddressLink address={decodedMsg.transfer.recipient} short={false} />
          </div>
        )}
      </div>
    </div>
  );
}

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
