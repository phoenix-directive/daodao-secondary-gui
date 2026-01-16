import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import { InfoIcon } from 'lucide-react';
import { ReactNode } from 'react';

const variants = cva('', {
  variants: {
    variant: {
      default: 'text-inherit hover:opacity-80 cursor-help',
    },
    size: {
      default: 'h-[1em] w-[1em]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export const InfoTooltip = ({
  children,
  size,
  variant,
}: { children: string | ReactNode } & VariantProps<typeof variants>) => {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger>
        <InfoIcon className={cn(variants({ size }))} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs cursor-help">{children}</TooltipContent>
    </Tooltip>
  );
};
