import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { createContext } from 'react';

type TooltipTriggerContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const TooltipTriggerContext = createContext<TooltipTriggerContextType>({
  open: false,
  setOpen: () => {},
});

function TooltipProvider({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}
function useHasHover() {
  try {
    return matchMedia('(hover: hover)').matches;
  } catch {
    // Assume that if browser too old to support matchMedia it's likely not a touch device
    return true;
  }
}

function Tooltip({ children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [open, setOpen] = React.useState<boolean>(props.defaultOpen ?? false);
  const hasHover = useHasHover();

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        disableHoverableContent={false}
        delayDuration={!hasHover ? props.delayDuration : 0}
        {...props}
        onOpenChange={(e) => {
          setOpen(e);
          props.onOpenChange?.(e);
        }}
        open={open}
      >
        <TooltipTriggerContext.Provider value={{ open, setOpen }}>
          {children}
        </TooltipTriggerContext.Provider>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}

function TooltipTrigger({
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const hasHover = useHasHover();
  const { setOpen } = React.useContext(TooltipTriggerContext);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onClick={(e) => {
        // Allow tooltip to show on mobile touch/click
        onClick?.(e);
        if (hasHover) {
          // e.preventDefault();
        } else {
          setOpen(true);
        }
      }}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
