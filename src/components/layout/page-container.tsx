import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto max-w-screen-2xl px-4 py-8 md:px-8 flex flex-col gap-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
