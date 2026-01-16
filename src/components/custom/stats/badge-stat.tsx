import { InfoTooltip } from '@/pages/components/info-tooltip';
import { StatType } from '@/pages/components/stats/hero-stat';
import { cva, VariantProps } from 'class-variance-authority';

const badgeVariant = cva('flex gap-1 py-0.5 rounded-sm items-center text-xs', {
  variants: {
    variant: {
      'no-border': 'px-0',
      pill: 'border px-2',
    },
  },
  defaultVariants: {
    variant: 'pill',
  },
});

export function BadgeStat({
  label,
  value,
  info,
  isLoading,
  valueClassName,
  variant,
}: StatType & VariantProps<typeof badgeVariant>) {
  //   if (isLoading) {
  //     return (
  //       <div className="flex gap-1">
  //         <Skeleton className="h-4 w-32 mb-1" />
  //         <Skeleton className="h-8 w-28" />
  //       </div>
  //     );
  //   }
  return (
    <div className={badgeVariant({ variant })}>
      {label && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 text-nowrap">{label}</p>
      )}
      <div className={`text-xs font-medium ${valueClassName}`}>{value ?? '-'}</div>
      {info && <InfoTooltip>{info}</InfoTooltip>}
    </div>
  );
}

export const BadgeStats = ({ stats, className }: { stats: StatType[]; className?: string }) => {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {stats.map((stat, index) => (
        <BadgeStat key={stat.label ?? 'empty-' + index} {...stat} />
      ))}
    </div>
  );
};

export default BadgeStat;
