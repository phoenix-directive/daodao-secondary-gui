import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { useAddress } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import { Check, Copy, LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface AddressLinkProps {
  address: string;
  chain?: Chain;
  className?: string;
  short?: boolean;
  label?: string;
  additionalLink?: {
    tooltip: string;
    linkOrUrl: string;
    icon: LucideIcon;
  };
}

export function AddressLink({
  address,
  chain = Chain.Terra,
  className,
  short = true,
  label,
  additionalLink,
}: AddressLinkProps) {
  const chainService = useChain(chain);
  const connectedAddress = useAddress(chain);
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const isConnectedWallet = connectedAddress?.toLowerCase() === address.toLowerCase();

  const shortAddress = short
    ? address.length > 22
      ? `${address.slice(0, 14)}...${address.slice(-8)}`
      : address
    : address;
  const displayText = isConnectedWallet ? '[me]' : label || shortAddress;

  const link = useMemo(() => {
    return chainService.linkAddress(address);
  }, [address, chainService]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTooltipOpen(true);
    setTimeout(() => {
      setCopied(false);
      setTooltipOpen(false);
    }, 2000);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button asChild variant={'link-no-padding'}>
        <a
          href={link}
          target="_blank"
          className="font-mono text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {displayText}
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
            <p>{copied ? 'Copied!' : 'Copy address'}</p>
          </TooltipContent>
          {additionalLink && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link to={additionalLink.linkOrUrl} onClick={(e) => e.stopPropagation()}>
                    <additionalLink.icon className="h-3 w-3" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{additionalLink.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
