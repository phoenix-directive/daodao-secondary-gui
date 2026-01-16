import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { isCw20 } from '@/hooks/helpers/helpers';
import { getAssetMeta } from '@/config/assets';

interface AssetLinkProps {
  denom: string;
  chain?: Chain;
  className?: string;
}

export function AssetLink({ denom, chain = Chain.Terra, className }: AssetLinkProps) {
  const chainService = useChain(chain);
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const meta = getAssetMeta(denom);
  const display = meta.symbol ?? denom;

  const link = useMemo(() => {
    if (isCw20(denom)) {
      return chainService.linkAddress(denom);
    }
    return chainService.linkToken(denom);
  }, [denom, chainService]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(denom);
    setCopied(true);
    setTooltipOpen(true);

    setTimeout(() => {
      setCopied(false);
      setTooltipOpen(false);
    }, 2000);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button asChild variant="link-no-padding">
        <a
          href={link}
          target="_blank"
          className="font-mono text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {display}
        </a>
      </Button>

      <div className="flex items-center gap-1">
        <Tooltip delayDuration={0} open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy denom'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

