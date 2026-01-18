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
import { useEffect, useState } from 'react';
import type { CW20TransferMsg, TransferMessage } from './CW20TransferAction';

export function CW20TransferForm({
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
