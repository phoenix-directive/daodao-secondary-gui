import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const tabsListVariants = cva(
  [
    'bg-muted',
    'text-muted-foreground',
    'inline-flex',
    'w-fit',
    'items-center',
    'justify-center',
    'rounded-lg',
    'p-[3px]',
  ],
  {
    variants: {
      size: {
        default: ['h-12'],
        sm: ['h-9'],
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const tabsTriggerVariants = cva(
  [
    'data-[state=active]:bg-background',
    'dark:data-[state=active]:text-foreground',
    'focus-visible:border-ring',
    'focus-visible:ring-ring/50',
    'focus-visible:outline-ring',
    'dark:data-[state=active]:border-input',
    'dark:data-[state=active]:bg-input/30',
    'text-foreground',
    'dark:text-muted-foreground',
    'inline-flex',
    'h-[calc(100%-1px)]',
    'flex-1',
    'items-center',
    'justify-center',
    'gap-1.5',
    'rounded-md',
    'border',
    'border-transparent',
    'font-medium',
    'whitespace-nowrap',
    'transition-[color,box-shadow]',
    'focus-visible:ring-[3px]',
    'focus-visible:outline-1',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'data-[state=active]:shadow-sm',
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    'cursor-pointer',
  ],
  {
    variants: {
      size: {
        default: ['px-4', 'py-2', "[&_svg:not([class*='size-'])]:size-4"],
        sm: ['px-3', 'py-1.5', 'text-sm', "[&_svg:not([class*='size-'])]:size-3.5"],
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  );
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  size?: 'default' | 'sm';
};

function TabsList({ className, size, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ size }), className)}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  size?: 'default' | 'sm';
};

function TabsTrigger({ className, size, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ size }), className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 flex flex-col outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
