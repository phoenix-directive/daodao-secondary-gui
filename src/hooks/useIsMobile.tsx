import * as React from 'react';

export function useIsMobile(mobileBreakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [mobileBreakpoint]);

  return !!isMobile;
}

export function useIsTablet(mobileBreakpoint = 1024) {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const onChange = () => {
      setIsTablet(window.innerWidth < mobileBreakpoint);
    };
    mql.addEventListener('change', onChange);
    setIsTablet(window.innerWidth < mobileBreakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, [mobileBreakpoint]);

  return !!isTablet;
}

