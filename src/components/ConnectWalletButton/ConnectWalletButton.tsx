import { InfoTooltip } from '@/components/custom/info-tooltip';
import { WalletConnectModal } from '@/components/modals/wallet-connect-modal';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GradientHoverButton } from '@/components/ui/gradient-hover-button';
import { gradientText } from '@/components/ui/ui-helpers';
import { useShuttle } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { useAddress, useIsReadonly } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import { cx } from 'class-variance-authority';
import { Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export function ConnectWalletButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shuttle = useShuttle();
  const address = useAddress(Chain.Terra);
  const isReadonly = useIsReadonly(Chain.Terra);

  const isConnected = !!address;

  const truncatedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  }, [address]);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    shuttle.disconnect();
  }, [shuttle]);

  if (isConnected) {
    return (
      <>
        <ButtonGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn('border hover:text-transparent', isReadonly && 'border-orange-400')}
              >
                {/* <Wallet className="h-4 w-4 text-blue-600" /> */}
                <span
                  className={cx(
                    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm',
                    !isReadonly && gradientText,
                    isReadonly && 'text-orange-400',
                  )}
                >
                  {truncatedAddress}
                  {isReadonly && (
                    <InfoTooltip>
                      Wallet is in read-only mode. You will not be able to send transactions.
                    </InfoTooltip>
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Wallet</DropdownMenuLabel>
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/history`}>
                  <History className=" h-4 w-4" />
                  Transactions
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy Address'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                <Wallet className=" h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`https://chainsco.pe/terra2/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className=" h-4 w-4" />
                  Explorer
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect} className="text-destructive ">
                <LogOut className=" h-4 w-4 text-destructive" />
                <span className="text-destructive">Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>

        <WalletConnectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </>
    );
  }

  return (
    <>
      <GradientHoverButton
        logo={<Wallet className="h-4 w-4" />}
        onClick={() => setIsModalOpen(true)}
        className=""
      >
        <span className="hidden sm:inline-block">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </GradientHoverButton>

      <WalletConnectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

export default ConnectWalletButton;
