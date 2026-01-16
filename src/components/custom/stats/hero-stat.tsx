import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/pages/components/info-tooltip';
import StatsSkeleton from '@/pages/components/stats/stats-skeleton';
import { cva, type VariantProps } from 'class-variance-authority';
import { ReactElement } from 'react';

const heroStatContainerVariants = cva('flex flex-col', {
  variants: {
    size: {
      md: 'gap-1',
      sm: 'gap-0.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const heroStatLabelVariants = cva('text-muted-foreground flex items-center', {
  variants: {
    size: {
      md: 'text-sm gap-1',
      sm: 'text-sm gap-0.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const heroStatValueVariants = cva('font-bold', {
  variants: {
    size: {
      md: 'text-2xl',
      sm: 'text-md',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type HeroStatSize = VariantProps<typeof heroStatContainerVariants>['size'];

export type StatType = {
  label?: string;
  value?: string | ReactElement;
  valueClassName?: string;
  info?: string;
  isLoading?: boolean;
  size?: HeroStatSize;
};

export function HeroStat({ label, value, info, isLoading, valueClassName, size }: StatType) {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className={heroStatContainerVariants({ size })}>
      <p className={heroStatLabelVariants({ size })}>
        {label}
        {info && <InfoTooltip>{info}</InfoTooltip>}
      </p>
      <div className={cn(heroStatValueVariants({ size }), valueClassName)}>{value ?? '-'}</div>
    </div>
  );
}
