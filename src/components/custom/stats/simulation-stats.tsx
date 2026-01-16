/**
 * Simulation Stats Component
 *
 * A reusable component for displaying transaction simulation statistics with per-stat loading states.
 * Prevents layout shift by using skeleton placeholders during loading.
 *
 * Features:
 * - Consistent key-value display format
 * - Per-stat loading states (some stats can be ready while others load)
 * - Skeleton placeholders during loading (no layout shift)
 * - Responsive design
 * - Composable with any transaction simulation data
 *
 * Usage:
 * ```tsx
 * <SimulationStats
 *   stats={[
 *     { label: "Asset", value: "USDC", loading: false },
 *     { label: "Amount", value: "100.00", loading: false },
 *     { label: "Fee", value: "0.5%", loading: true }
 *   ]}
 * />
 * ```
 */

import { Skeleton } from '@/components/ui/skeleton';
import { AddressPortfolioPriced } from '@/generated/chain/creda-portfolio/response_to_metrics';
import { notFalsy, toNumb } from '@/hooks/helpers/helpers';
import { TxHook } from '@/hooks/useTx';
import { signalIncludeAssetApy } from '@/lib/signals';
import { cn } from '@/lib/utils';
import { Apy } from '@/pages/components/apy';
import { InfoTooltip } from '@/pages/components/info-tooltip';
import { HealthBadge } from '@/pages/dashboard/components/health-badge';
import { cva, VariantProps } from 'class-variance-authority';

export interface SimulationStat {
  label: string;
  value: string | React.ReactNode;
  loading?: boolean;
  info?: string | React.ReactNode;
}

export interface SimulationStatsProps {
  stats: SimulationStat[];
  className?: string;
}
export function LthfStatSimple(lthf: number) {
  return {
    label: 'LT Health Factor',
    value: lthf.toFixed(2) ?? 'N/A',
    loading: false, // Status is known immediately
    info: Tooltips.lthf,
  };
}

export function SupplyAprStat(
  tx: TxHook<{
    supply_apr: string;
    take_apr: string;
  }>,
  apyAsset?: number,
) {
  const info = !tx.simulation.loading && tx.simulation.info;
  if (!info) {
    return {
      label: 'Supply APY',
      value: 'N/A',
      loading: tx.simulation.loading,
    };
  }

  const apySupply = toNumb(info.supply_apr);
  const apyTake = toNumb(info.take_apr);
  const apyAssetValue = apyAsset || 0;
  const amount = apySupply - apyTake + (signalIncludeAssetApy.value ? apyAssetValue : 0);
  return {
    label: 'Supply APY',
    value: (
      <Apy
        amount={amount}
        infos={[
          !!apyAssetValue && {
            label: 'Asset APY',
            value: apyAssetValue,
          },
          !!apySupply && {
            label: 'Supply APY',
            value: apySupply,
          },
          !!apyTake && {
            label: 'Take Rate',
            value: apyTake,
          },
        ].filter(notFalsy)}
      ></Apy>
    ),
    loading: false,
  };
}

export function BorrowAprStat(
  tx: TxHook<{
    borrow_apr: string;
  }>,
) {
  const info = !tx.simulation.loading && tx.simulation.info;
  if (!info) {
    return {
      label: 'Borrow APY',
      value: 'N/A',
      loading: tx.simulation.loading,
    };
  }

  const apyBorrow = toNumb(info.borrow_apr);
  return {
    label: 'Borrow APY',
    value: <Apy amount={apyBorrow}></Apy>,
    loading: false,
  };
}

export type LthfStatTxHookProps = {
  lthf: string;
  borrowed_value: string;
  collateral_value: string;
  lt_value: string;
  ltv_value: string;
};

export function LthfStat(
  tx: TxHook<LthfStatTxHookProps>,
  current_lthf: number,
  currentPortfolio?: {
    borrowed_value: string;
    collateral_value: string;
  },
) {
  const info = !tx.simulation.loading && tx.simulation.info;

  if (!tx.simulation.loading && tx.simulation.errorData) {
    const info = tx.simulation.errorData as AddressPortfolioPriced;
    return LthfStatUnhealthy(info, current_lthf, currentPortfolio);
  }

  return {
    label: 'New health',
    value:
      (info && (
        <HealthBadge
          lthf={+info?.lthf}
          current_lthf={current_lthf}
          borrowed_value={info.borrowed_value}
          collateral_value={info.collateral_value}
          lt_value={info.lt_value}
          ltv_value={info.ltv_value}
          current_borrowed_value={currentPortfolio?.borrowed_value}
          current_collateral_value={currentPortfolio?.collateral_value}
          text="Expected"
        ></HealthBadge>
      )) ??
      'N/A',
    loading: tx.simulation.loading,
  };
}
export function LthfStatUnhealthy(
  tx: AddressPortfolioPriced,
  current_lthf: number,
  currentPortfolio?: {
    borrowed_value: string;
    collateral_value: string;
  },
) {
  return {
    label: 'New health',
    value: (
      <HealthBadge
        lthf={+tx.lt_health_factor}
        current_lthf={current_lthf}
        borrowed_value={tx.total_borrowed_value}
        collateral_value={tx.total_collateral_value}
        lt_value={tx.total_lt_value}
        ltv_value={tx.total_ltv_value}
        current_borrowed_value={currentPortfolio?.borrowed_value}
        current_collateral_value={currentPortfolio?.collateral_value}
        text="Expected"
      ></HealthBadge>
    ),
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const Tooltips = {
  lthf: (
    <>
      Liquidation Threshold Health Factor (LTHF) indicates how close your account is to liquidation.
      A higher LTHF means a safer position. <br />
      If LTHF falls below 1, your account may be liquidated.
    </>
  ),
};

const variants = cva('text-sm', {
  variants: {
    variant: {
      tooltip: '',
      default: 'rounded-lg border p-4 space-y-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const variantsLabel = cva(' flex items-center gap-1', {
  variants: {
    variant: {
      tooltip: 'font-bold',
      default: 'text-muted-foreground ',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function SimulationStats({
  stats,
  className,
  variant,
}: SimulationStatsProps & VariantProps<typeof variants>) {
  return (
    <div className={cn(variants({ variant }), className)}>
      {stats.filter(notFalsy).map((stat, index) => (
        <div key={index} className="flex items-center gap-2 justify-between">
          <div className={cn(variantsLabel({ variant }))}>
            {stat.label} {stat.info && <InfoTooltip>{stat.info}</InfoTooltip>}
          </div>
          {stat.loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <span
              className={cn(
                'font-medium',
                stat.value === null ||
                  stat.value === undefined ||
                  stat.value === '' ||
                  stat.value === 'N/A'
                  ? 'text-muted-foreground opacity-50'
                  : '',
              )}
            >
              {stat.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
