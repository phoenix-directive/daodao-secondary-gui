import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      {<Header />}
      <main className={cn('flex-1 min-h-screen', 'mb-16')}>{children}</main>
      {<Footer />}
    </div>
  );
}
