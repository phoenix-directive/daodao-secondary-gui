import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';

import ConnectWalletButton from '@/components/ConnectWalletButton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Logo } from '@/components/ui/custom/creda-logo';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { navigationConfig } from '@/config/navigation';
import { Chain } from '@/hooks/helpers/assets';
import { useAddress } from '@/hooks/useWallet';

export function Header() {
  const [open, setOpen] = useState(false);
  const address = useAddress(Chain.Terra);
  const location = useLocation();
  const params = useParams();

  const navItems = navigationConfig(address);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background ">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            to={address ? '/' : '/markets'}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Logo className="h-9 w-9" />
            <span className="font-bold sm:inline-block text-xl">DAO GO</span>
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="border-b">
                <SheetTitle>
                  <Link
                    to="/"
                    className="flex items-center space-x-2"
                    onClick={() => setOpen(false)}
                  >
                    <Logo className="h-8 w-8" />
                    <span className="font-bold text-lg">Dao</span>
                  </Link>
                </SheetTitle>
                <SheetDescription className="sr-only">Navigation menu</SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-0 px-4">
                {navItems.map((item, index) => {
                  if (item.type === 'link') {
                    return item.external ? (
                      <a
                        key={index}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center rounded-lg px-3 py-2 text-base font-medium hover:bg-accent cursor-pointer"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={index}
                        to={item.href}
                        className="flex items-center rounded-lg px-3 py-2 text-base font-medium hover:bg-accent cursor-pointer"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <>
                      <div className="border-t mt-4 -mx-4"></div>
                      <div key={index} className="flex flex-col gap-1 mt-8 ">
                        <div className="px-3 text-xs font-semibold text-muted-foreground">
                          {item.label}
                        </div>
                        {item.items.map((subItem, subIndex) =>
                          subItem.external ? (
                            <a
                              key={subIndex}
                              href={subItem.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                              onClick={() => setOpen(false)}
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              {subItem.label}
                            </a>
                          ) : (
                            <Link
                              key={subIndex}
                              to={subItem.href}
                              className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                              onClick={() => setOpen(false)}
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              {subItem.label}
                            </Link>
                          ),
                        )}
                      </div>
                    </>
                  );
                })}

                <div className="border-t mt-4 -mx-4"></div>
                <div className="flex flex-col gap-2 mt-4">
                  <ButtonGroup>
                    <AnimatedThemeToggler></AnimatedThemeToggler>
                  </ButtonGroup>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <ButtonGroup className="hidden md:flex">
            <AnimatedThemeToggler></AnimatedThemeToggler>
          </ButtonGroup>

          <ConnectWalletButton></ConnectWalletButton>
        </div>
      </div>
    </header>
  );
}
