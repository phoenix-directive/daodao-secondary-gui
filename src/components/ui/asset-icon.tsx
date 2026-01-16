import type { AssetMeta } from '@/config/assets';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const assetIconVariants = cva('rounded-full', {
  variants: {
    size: {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const assetIconOffsetVariants = cva('', {
  variants: {
    size: {
      sm: '-ml-3',
      md: '-ml-4',
      lg: '-ml-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const assetIconDoubleIconSize = cva('', {
  variants: {
    size: {
      sm: 'w-9',
      md: 'w-12',
      lg: 'w-15',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface AssetIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof assetIconVariants> {
  asset: AssetMeta;
  useDoubleIconSize?: boolean;
}

export function AssetIcon({ useDoubleIconSize, asset, size, className, ...props }: AssetIconProps) {
  const hasDoubleIcon = !!(asset.icon && asset.icon2);

  if (hasDoubleIcon) {
    return (
      <div className={cn('flex items-center shrink-0', className)} {...props}>
        <img src={asset.icon} alt={asset.symbol} className={cn(assetIconVariants({ size }), '')} />
        <img
          src={asset.icon2}
          alt={asset.symbol}
          className={cn(assetIconVariants({ size }), assetIconOffsetVariants({ size }), '')}
        />
      </div>
    );
  }

  if (asset.icon) {
    return (
      <img
        src={asset.icon}
        alt={asset.symbol}
        className={cn(
          assetIconVariants({ size }),
          className,
          'shrink-0',
          useDoubleIconSize ? assetIconDoubleIconSize({ size }) : '',
        )}
        {...props}
      />
    );
  }

  // Fallback: show first letter of symbol
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground font-medium',
        assetIconVariants({ size }),
        className,
      )}
      {...props}
    >
      {asset.symbol.charAt(0)}
    </div>
  );
}
