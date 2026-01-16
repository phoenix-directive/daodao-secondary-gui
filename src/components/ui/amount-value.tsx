import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const amountValueVariants = cva('', {
  variants: {
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    size: {
      sm: '[&_.amount]:text-xs [&_.value]:text-xs',
      md: '[&_.amount]:text-sm [&_.value]:text-xs',
      lg: '[&_.amount]:text-base [&_.value]:text-sm',
    },
  },
  defaultVariants: {
    align: 'center',
    size: 'md',
  },
});

export interface AmountValueProps extends VariantProps<typeof amountValueVariants> {
  amount: string | number;
  value?: string | number;
  className?: string;
  amountClassName?: string;
  valueClassName?: string;
}

export function AmountValue({
  amount,
  value,
  align,
  size,
  className,
  amountClassName,
  valueClassName,
}: AmountValueProps) {
  return (
    <div className={cn(amountValueVariants({ align, size }), className)}>
      <div className={cn('amount font-medium', amountClassName)}>{amount}</div>
      {value !== undefined && (
        <div className={cn('value text-muted-foreground', valueClassName)}>{value}</div>
      )}
    </div>
  );
}
