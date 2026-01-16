import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type React from 'react';

interface GradientHoverButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode;
  logo?: React.ReactNode;
}

export function GradientHoverButtonReverse({
  children,
  className,
  ...props
}: GradientHoverButtonProps) {
  return (
    <button
      className={cn(
        'group bg-background relative w-auto cursor-pointer overflow-hidden rounded-md border p-2 px-5 text-center font-semibold',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span
          className={cn(
            'inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0',
            'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm',
          )}
        >
          {children}
        </span>
      </div>
      <div className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <div className={buttonVariants({})}>{children}</div>
        <ArrowRight className="mr-2 -ml-2" />
      </div>
    </button>
  );
}

export function GradientHoverButton({ children, className, ...props }: GradientHoverButtonProps) {
  return (
    <button
      className={cn(
        'group bg-linear-to-br from-[#E24A17] via-[#FF8A1E] to-[#FFC83D] hover:from-[#B32712] hover:via-[#E24A17] hover:to-[#FF9F2E] text-white border relative w-auto cursor-pointer overflow-hidden rounded-md p-2 py-[7px] px-4 text-center font-semibold',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="bg-white h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span
          className={cn(
            'inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0',
            'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm',
          )}
        >
          {props.logo}
          {children}
        </span>
      </div>
      <div
        className={cn(
          'absolute',
          'top-0',
          'z-10',
          'flex',
          'h-full',
          'w-full',
          'translate-x-12',
          'items-center',
          'justify-center',
          'gap-2',
          'opacity-0',
          'transition-all',
          'duration-300',
          'group-hover:-translate-x-4',
          'group-hover:opacity-100',
        )}
      >
        {props.logo && <div className="text-[#E24A17]">{props.logo}</div>}
        <div
          className={
            'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm bg-linear-to-br from-[#E24A17] via-[#FF8A1E] to-[#FFC83D] bg-clip-text text-transparent'
          }
        >
          {children}
        </div>
        <ArrowRight className="h-4 w-4 text-[#FF8A1E]" />
      </div>
    </button>
  );
}
