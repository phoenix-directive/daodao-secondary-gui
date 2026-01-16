import { notFalsy } from '@/hooks/helpers/helpers';
import type { LucideIcon } from 'lucide-react';
import { CircleHelp, ShieldCheck, Users, Wallet, Zap } from 'lucide-react';
import { globalConfig } from './config';

export interface NavLinkItem {
  type: 'link';
  label: string;
  href: string;
  external?: boolean;
}

export interface NavDropdownItem {
  type: 'dropdown';
  label: string;
  items: {
    label: string;
    description?: string;
    href: string;
    icon?: LucideIcon;
    external?: boolean;
  }[];
}

export type NavItem = NavLinkItem | NavDropdownItem;

export const navigationConfig = (address: string) => {
  const result: NavItem[] = [
    {
      type: 'link' as const,
      label: 'Dashboard',
      href: '/',
    } as NavLinkItem,

    {
      type: 'link' as const,
      label: 'Markets',
      href: '/markets',
    },
    {
      type: 'dropdown' as const,
      label: 'More',
      items: [
        {
          label: 'Docs',
          description: 'Learn about Creda protocols',
          href: 'https://docs.creda.finance/',
          external: true,
          icon: CircleHelp,
        },
        // {
        //   label: 'Governance',
        //   description: 'Vote on protocol changes',
        //   href: '/governance',
        //   icon: Vote,
        // },
        // {
        //   label: 'Analytics',
        //   description: 'View protocol metrics',
        //   href: '/analytics',
        //   icon: BarChart3,
        // },
        {
          label: 'Community',
          description: 'Join our Telegram',
          href: 'https://t.me/creda_finance',
          icon: Users,
          external: true,
        },

        {
          label: 'Health',
          description: 'Check Creda Health',
          href: '/health',
          icon: ShieldCheck,
        },
        {
          label: 'Liquidations',
          description: 'View all liquidations',
          href: '/liquidations',
          icon: Zap,
        },
        {
          label: 'Credits Leaderboard',
          description: 'View credits rankings',
          href: '/credits-leaderboard',
          icon: Wallet,
        },
      ],
    },
    !!address &&
      globalConfig.adminAddresses.includes(address) &&
      ({
        type: 'dropdown',
        label: 'Admin',
        items: [
          {
            label: 'Portfolios',
            description: 'View all user portfolios',
            href: '/admin/portfolios',
            icon: Wallet,
          },
          // {
          //   label: 'Tokens',
          //   description: 'Manage protocol tokens',
          //   href: '/admin/tokens',
          //   icon: Shield,
          // },
          // {
          //   label: 'Config',
          //   description: 'Protocol configuration',
          //   href: '/admin/config',
          //   icon: Settings,
          // },
        ],
      } as NavItem),
  ].filter(notFalsy);

  return result;
};
