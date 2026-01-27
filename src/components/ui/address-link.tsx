import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { useContractInfo } from '@/hooks/useContractInfo';
import { useAddress } from '@/hooks/useWallet';
import { addressTags, removeAddressTag, setAddressTag } from '@/lib/signals-instances';
import { cn } from '@/lib/utils';
import { Check, Copy, LucideIcon, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './button';
import { Input } from './input';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface AddressLinkProps {
  address: string;
  chain?: Chain;
  className?: string;
  short?: boolean;
  label?: string;
  allowTagging?: boolean;
  isSmartContract?: boolean;
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
  allowTagging = false,
  isSmartContract = false,
  additionalLink,
}: AddressLinkProps) {
  const chainService = useChain(chain);
  const connectedAddress = useAddress(chain);
  const contractInfo = useContractInfo(isSmartContract ? address : undefined, chain);
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isConnectedWallet = connectedAddress?.toLowerCase() === address.toLowerCase();
  const tag = addressTags.value[address.toLowerCase()];
  const canTag = allowTagging && !isConnectedWallet;

  const shortAddress = short
    ? address.length > 22
      ? `${address.slice(0, 14)}...${address.slice(-8)}`
      : address
    : address;

  const displayText = isConnectedWallet ? '[me]' : label || shortAddress;

  const link = useMemo(() => {
    return chainService.linkAddress(address);
  }, [address, chainService]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(tag || '');
    setIsEditing(true);
  };

  const handleSaveTag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editValue.trim()) {
      setAddressTag(address, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleClearTag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeAddressTag(address);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editValue.trim()) {
        setAddressTag(address, editValue.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-7 font-mono text-sm w-40"
            placeholder="Enter tag..."
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSaveTag}
            disabled={!editValue.trim()}
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearTag}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      ) : (
        <>
          <Button asChild variant={'link-no-padding'}>
            <a
              href={link}
              target="_blank"
              className="font-mono text-sm font-medium text-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              {displayText}
              {contractInfo.data.value?.label && (
                <span className="text-primary ml-1.5 text-xs font-normal px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  {contractInfo.data.value.label}
                </span>
              )}
              {tag && <span className="text-muted-foreground">({tag})</span>}
            </a>
          </Button>
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={0} open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? 'Copied!' : 'Copy address'}</p>
              </TooltipContent>
            </Tooltip>
            {canTag && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEditClick}>
                    <Tag className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tag ? 'Edit tag' : 'Add tag'}</p>
                </TooltipContent>
              </Tooltip>
            )}
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
          </div>
        </>
      )}
    </div>
  );
}
