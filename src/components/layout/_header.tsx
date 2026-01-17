import { Link, useLocation } from 'react-router-dom';

import ConnectWalletButton from '@/components/ConnectWalletButton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { ButtonGroup } from '@/components/ui/button-group';
import { Logo } from '@/components/ui/custom/creda-logo';

export function Header() {
  const location = useLocation();

  // Check if we're on a DAO page (either viewing DAO or a proposal)
  const isOnDaoPage = location.pathname.includes('/dao/');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background ">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        {/* Logo and Breadcrumbs */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to={'/'} className="flex items-center space-x-2 cursor-pointer">
            <Logo className="h-9 w-9" />
            <span className="font-bold sm:inline-block text-xl">DAO</span>
          </Link>

          {/* Breadcrumbs - shown on mobile and desktop */}
          {isOnDaoPage && (
            <div>
              <Breadcrumbs />
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ButtonGroup className="hidden md:flex">
            <AnimatedThemeToggler></AnimatedThemeToggler>
          </ButtonGroup>

          <ConnectWalletButton></ConnectWalletButton>
        </div>
      </div>
    </header>
  );
}
