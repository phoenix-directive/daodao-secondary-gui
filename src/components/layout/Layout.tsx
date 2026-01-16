import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isReferralGate = location.pathname === '/referral-gate';

  return (
    <div className="relative flex min-h-screen flex-col">
      {!isReferralGate && <Header />}
      <main className={cn('flex-1 min-h-screen', !isReferralGate && 'mb-16')}>{children}</main>
      {!isReferralGate && <Footer />}
    </div>
  );
}

