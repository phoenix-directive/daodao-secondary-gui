import { cn } from '@/lib/utils';

/**
 * App Logo Component
 *
 * Usage: <Logo className="h-8 w-8" />
 */
export function Logo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src="/logo-512.png" alt="Logo" className={cn('h-10 w-10', className)} {...props} />;
}

export default Logo;
