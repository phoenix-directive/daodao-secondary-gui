import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DetailIconButtonProps {
  to: string;
  tooltip?: string;
}

export function DetailIconButton({ to, tooltip }: DetailIconButtonProps) {
  const location = useLocation();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={'outline'} size={'icon'} asChild>
            <Link
              to={to}
              className="flex items-center gap-2 z-10"
              onClick={(e) => e.stopPropagation()}
              state={{ from: location.pathname }}
            >
              <ArrowUpRight />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip || 'Go to market details'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

