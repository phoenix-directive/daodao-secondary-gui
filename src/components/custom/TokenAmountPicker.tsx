import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fromBaseUnits, toBaseUnits } from '@/hooks';
import { Eye, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

export type CoinData = {
  denom: string;
  display: string;
  decimals: number;
  amount: string;
  formattedAmount: string;
  formattedUsdValue: string;
};

export type TokenAmount = {
  denom: string;
  amount: string; // Always in base units
};

type TokenAmountPickerProps = {
  value: TokenAmount;
  availableCoins: CoinData[];
  mode?: 'standard' | 'custom';
  onChange: (value: TokenAmount) => void;
  onModeChange?: (mode: 'standard' | 'custom') => void;
  onRemove?: () => void;
  placeholder?: string;
  showMaxButton?: boolean;
};

export function TokenAmountPicker({
  value,
  availableCoins,
  mode: propMode,
  onChange,
  onModeChange,
  onRemove,
  placeholder = '0.00',
  showMaxButton = true,
}: TokenAmountPickerProps) {
  const selectedCoin = availableCoins.find((c) => c.denom === value.denom);
  const decimals = selectedCoin?.decimals || 6;

  // Auto-detect mode: if coin not in availableCoins, default to custom
  const autoMode = propMode || (selectedCoin ? 'standard' : 'custom');
  const mode = autoMode;

  // Local state for display value
  const [inputValue, setInputValue] = useState(() => {
    if (mode === 'custom') {
      return value.amount;
    }
    return fromBaseUnits(value.amount || '0', decimals);
  });

  const handleDenomChange = (newDenom: string) => {
    if (mode === 'custom') {
      onChange({ denom: newDenom, amount: inputValue });
    } else {
      const newCoin = availableCoins.find((c) => c.denom === newDenom);
      const newDecimals = newCoin?.decimals || 6;
      const baseAmount = toBaseUnits(inputValue, newDecimals);
      onChange({ denom: newDenom, amount: baseAmount });
    }
  };

  const handleAmountChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const handleAmountBlur = () => {
    if (mode === 'custom') {
      onChange({ ...value, amount: inputValue });
    } else {
      const baseAmount = inputValue === '' ? '0' : toBaseUnits(inputValue, decimals);
      onChange({ ...value, amount: baseAmount });
    }
  };

  const handleMax = () => {
    if (!selectedCoin || mode === 'custom') return;
    const maxAmount = fromBaseUnits(selectedCoin.amount, selectedCoin.decimals);
    setInputValue(maxAmount);
    onChange({ denom: value.denom, amount: selectedCoin.amount });
  };

  const toggleMode = () => {
    const newMode = mode === 'standard' ? 'custom' : 'standard';
    if (onModeChange) {
      onModeChange(newMode);
    }
    // Update input value based on new mode
    if (newMode === 'custom') {
      setInputValue(value.amount);
    } else {
      setInputValue(fromBaseUnits(value.amount || '0', decimals));
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <Button
        type="button"
        onClick={toggleMode}
        variant="outline"
        size="icon"
        className="shrink-0"
        title={mode === 'standard' ? 'Switch to custom mode' : 'Switch to standard mode'}
      >
        {mode === 'standard' ? <Eye className="size-4" /> : <Pencil className="size-4" />}
        {/* <Settings2 className="size-4" /> */}
      </Button>
      {mode === 'standard' ? (
        <Select value={value.denom} onValueChange={handleDenomChange}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select coin">
              {selectedCoin ? (
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium">{selectedCoin.display}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedCoin.formattedAmount} ({selectedCoin.formattedUsdValue})
                  </span>
                </div>
              ) : (
                'Select coin'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableCoins.length === 0 ? (
              <SelectItem value="_empty" disabled>
                No coins available
              </SelectItem>
            ) : (
              availableCoins.map((c) => (
                <SelectItem key={c.denom} value={c.denom}>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.display}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.formattedAmount} ({c.formattedUsdValue})
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value.denom}
          onChange={(e) => handleDenomChange(e.target.value)}
          placeholder="udenom"
          className="w-60"
        />
      )}

      <InputGroup className="flex-1">
        <InputGroupInput
          type="text"
          value={inputValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={handleAmountBlur}
          placeholder={placeholder}
        />
        {mode === 'standard' && showMaxButton && selectedCoin && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="xs" onClick={handleMax} title="Set to maximum available">
              Max
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {onRemove && (
        <Button
          type="button"
          onClick={onRemove}
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Remove coin"
          title="Remove coin"
        >
          <Trash className="size-4" />
        </Button>
      )}
    </div>
  );
}

export type TokenAmountWithMode = TokenAmount & {
  mode?: 'standard' | 'custom';
};

type MultiTokenAmountPickerProps = {
  values: TokenAmountWithMode[];
  availableCoins: CoinData[];
  onChange: (values: TokenAmountWithMode[]) => void;
  addButtonLabel?: string;
  showMaxButton?: boolean;
};

export function MultiTokenAmountPicker({
  values,
  availableCoins,
  onChange,
  addButtonLabel = '+ Add another coin',
  showMaxButton = true,
}: MultiTokenAmountPickerProps) {
  const handleAdd = () => {
    const usedDenoms = values.map((v) => v.denom);
    const unusedCoins = availableCoins.filter((c) => !usedDenoms.includes(c.denom));
    if (unusedCoins.length > 0) {
      onChange([...values, { denom: unusedCoins[0].denom, amount: '0', mode: 'standard' }]);
    } else {
      onChange([...values, { denom: '', amount: '0', mode: 'custom' }]);
    }
  };

  const handleChange = (idx: number, newValue: TokenAmount) => {
    const newValues = [...values];
    newValues[idx] = { ...newValue, mode: values[idx].mode };
    onChange(newValues);
  };

  const handleModeChange = (idx: number, newMode: 'standard' | 'custom') => {
    const newValues = [...values];
    newValues[idx] = { ...values[idx], mode: newMode };
    onChange(newValues);
  };

  const handleRemove = (idx: number) => {
    const newValues = [...values];
    newValues.splice(idx, 1);
    onChange(newValues);
  };

  const getAvailableCoinsForIndex = (idx: number) => {
    const itemMode = values[idx].mode || 'standard';
    if (itemMode === 'custom') return availableCoins;
    const usedDenoms = values
      .map((v, i) => (i !== idx ? v.denom : null))
      .filter(Boolean) as string[];
    return availableCoins.filter(
      (c) => !usedDenoms.includes(c.denom) || c.denom === values[idx].denom,
    );
  };

  const canAddMore = () => {
    // Can always add more (will auto-switch to custom if no coins left)
    return true;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        {values.map((value, idx) => (
          <TokenAmountPicker
            key={idx}
            value={value}
            availableCoins={getAvailableCoinsForIndex(idx)}
            mode={value.mode}
            onChange={(newValue) => handleChange(idx, newValue)}
            onModeChange={(newMode) => handleModeChange(idx, newMode)}
            onRemove={() => handleRemove(idx)}
            showMaxButton={showMaxButton}
          />
        ))}
      </div>
      <Button
        type="button"
        onClick={handleAdd}
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs font-medium"
        disabled={!canAddMore()}
      >
        {addButtonLabel}
      </Button>
    </div>
  );
}
