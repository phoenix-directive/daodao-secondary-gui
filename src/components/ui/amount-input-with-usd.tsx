import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import React from 'react';

interface AmountInputWithUsdProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxClick: () => void;
  symbol: string;
  price?: string | null;
  isValid?: boolean;
  placeholder?: string;
  className?: string;
}

export function AmountInputWithUsd({
  value,
  onChange,
  onMaxClick,
  symbol,
  price,
  isValid = true,
  placeholder = '0.00',
  className,
}: AmountInputWithUsdProps) {
  return (
    <ButtonGroup className={cn('w-full', className)}>
      <InputGroup className={cn('h-14', !isValid && value && 'border-destructive')}>
        <div className="relative flex-1">
          <InputGroupInput
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={cn('pr-1 h-full border-0 pt-2 pb-6')}
          />
          <div className="absolute bottom-1.5 left-3 text-xs text-muted-foreground">
            {price ? (
              <>
                $
                {value && parseFloat(value) > 0
                  ? (parseFloat(value) * parseFloat(price)).toFixed(2)
                  : '0.00'}
              </>
            ) : (
              <span className="opacity-0">-</span>
            )}
          </div>
        </div>
        <InputGroupAddon align="inline-end" className="h-full">
          <InputGroupText>{symbol}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <Button type="button" variant="outline" onClick={onMaxClick} className="h-14">
        MAX
      </Button>
    </ButtonGroup>
  );
}
