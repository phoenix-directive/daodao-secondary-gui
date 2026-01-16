import { getIpfsLink } from '@/hooks/helpers/helpers';
import { getDaoGradient, getDaoInitials } from '@/hooks/useDaoDao';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { useState } from 'react';

const avatarVariants = cva(
  'flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-lg',
  {
    variants: {
      size: {
        small: 'h-12 w-12 text-lg',
        big: 'h-24 w-24 text-3xl md:h-32 md:w-32 md:text-4xl',
      },
    },
    defaultVariants: {
      size: 'big',
    },
  },
);

export interface DaoAvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  imageUrl?: string | null;
  className?: string;
}

export function DaoAvatar({ name, imageUrl, size, className }: DaoAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getDaoInitials(name);
  const gradient = getDaoGradient(name);

  // Get IPFS link with appropriate size
  const ipfsSize = size === 'small' ? 160 : 440;
  const { src, fallbackSrc } = imageUrl
    ? getIpfsLink(imageUrl, ipfsSize)
    : { src: undefined, fallbackSrc: undefined };

  // Show gradient avatar if no image or image failed to load
  if (!src || imageError) {
    return <div className={cn(avatarVariants({ size }), gradient, className)}>{initials}</div>;
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn(avatarVariants({ size }), 'object-cover', className)}
      onError={(e) => {
        // Try fallback if available
        if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
        } else {
          setImageError(true);
        }
      }}
    />
  );
}
