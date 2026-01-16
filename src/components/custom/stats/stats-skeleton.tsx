import { Skeleton } from '@/components/ui/skeleton';

export function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

export default StatsSkeleton;
