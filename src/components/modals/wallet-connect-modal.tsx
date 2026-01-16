import {
  isAndroid,
  isIOS,
  isMobile,
  useShuttle,
  WalletExtensionProvider,
  WalletMobileProvider,
} from '@/delphi-labs/shuttle-react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Chain } from '@/hooks/helpers/assets';
import { useAddress } from '@/hooks/useWallet';
import { ReadonlyWalletProvider } from '@/wallet/ReadonlyWalletProvider';
import { orderBy } from 'lodash-es';
import { Link } from 'react-router-dom';

// Wallet configuration for display names and icons
const WALLET_CONFIG: Record<string, { prettyName: string; logo?: string }> = {
  keplr: {
    prettyName: 'Keplr Wallet',
    logo: '/keplr.svg',
  },
  'leap-cosmos': {
    prettyName: 'Leap Wallet',
    logo: '/leap.svg',
  },
  'mobile-keplr': {
    prettyName: 'WalletConnect',
    logo: '/walletconnect.svg',
  },
  xdefi: {
    prettyName: 'XDEFI Wallet',
    logo: '/xdefi.svg',
  },
  cosmostation: {
    prettyName: 'Cosmostation',
    logo: '/cosmostation.svg',
  },
  cosmiframe: {
    prettyName: 'DAODAO',
    logo: '/daodao.svg',
  },
  // Add more wallet configurations as needed
};

export interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const [shouldShowConnecting, setShouldShowConnecting] = useState(false);
  const [walletconnectUrl, setWalletconnectUrl] = useState('');
  const [loadingMobile, setLoadingMobile] = useState(false);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { connect, mobileConnect, extensionProviders, mobileProviders, wallets, disconnectWallet } =
    useShuttle();

  const address = useAddress(Chain.Terra);

  const [walletToConnect, setWalletToConnect] = useState<
    WalletExtensionProvider | WalletMobileProvider | null
  >(null);

  const [error, setError] = useState<string | null>(null);

  const connectedWallet = wallets[0];
  const hasWallets = wallets.length > 0;
  const isConnected = hasWallets && !!address;
  const isConnecting = shouldShowConnecting && !isConnected;

  // Manage delayed connecting state display (only show after 300ms)
  useEffect(() => {
    if (isConnecting) {
      // Start timeout to show connecting state after 300ms
      connectingTimeoutRef.current = setTimeout(() => {
        setShouldShowConnecting(true);
      }, 5);
    } else {
      // Clear timeout and reset state when no longer connecting
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      setShouldShowConnecting(false);
    }

    return () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    };
  }, [isConnecting]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state after animation completes
    setTimeout(() => {
      setWalletToConnect(null);
      setWalletconnectUrl('');
      setError(null);
    }, 200);
  }, [onOpenChange]);

  // Close modal when wallet connects successfully (only if user initiated connection)
  useEffect(() => {
    if (isConnected && walletToConnect) {
      // Modal was opened to connect, so close it after successful connection
      handleClose();
    }
  }, [isConnected, walletToConnect, handleClose]);

  const onConnect = useCallback(
    async (provider: WalletExtensionProvider) => {
      setWalletToConnect(provider);
      setShouldShowConnecting(true);

      try {
        const reversed = [...provider.networks].reverse();
        for (const network of reversed) {
          await connect({
            extensionProviderId: provider.id,
            chainId: network[1].chainId,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setError(message);
      }
    },
    [connect],
  );

  const onMobileConnect = useCallback(
    async (provider: WalletMobileProvider) => {
      setWalletToConnect(provider);
      setLoadingMobile(true);
      setShouldShowConnecting(true);

      const urls = await mobileConnect({
        mobileProviderId: provider.id,
        chainId: Chain.Terra,
        callback: (_connection: any) => {
          setWalletconnectUrl('');
          handleClose();
        },
      }).finally(() => {
        setLoadingMobile(false);
      });

      if (isMobile()) {
        if (isAndroid()) {
          window.location.href = urls.androidUrl;
        } else if (isIOS()) {
          window.location.href = urls.iosUrl;
        } else {
          window.location.href = urls.androidUrl;
        }
      } else {
        setWalletconnectUrl(urls.qrCodeUrl);
      }
    },
    [mobileConnect, handleClose],
  );

  const handleBack = useCallback(() => {
    setWalletToConnect(null);
    setWalletconnectUrl('');
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    for (const wallet of wallets) {
      disconnectWallet(wallet);
    }
    // Reset state to show wallet list instead of closing modal
    setWalletToConnect(null);
    setWalletconnectUrl('');
    setShouldShowConnecting(false);
  }, [wallets, disconnectWallet]);

  // Determine which view to show
  const modalContent = useMemo(() => {
    // Show error view if there's an error
    if (error && walletToConnect) {
      // Check if error is a rejection
      const isRejection =
        error.toLowerCase().includes('reject') ||
        error.toLowerCase().includes('denied') ||
        error.toLowerCase().includes('declined') ||
        error.toLowerCase().includes('user cancel');

      if (isRejection) {
        return (
          <RejectedView
            wallet={walletToConnect}
            onBack={handleBack}
            onClose={handleClose}
            onReconnect={() => {
              setError(null);
              if ('mobileProviderId' in walletToConnect) {
                onMobileConnect(walletToConnect as WalletMobileProvider);
              } else {
                onConnect(walletToConnect as WalletExtensionProvider);
              }
            }}
          />
        );
      }

      return (
        <ErrorView
          errorMessage={error}
          onBack={handleBack}
          onClose={handleClose}
          onReconnect={() => {
            setError(null);
            if ('mobileProviderId' in walletToConnect) {
              onMobileConnect(walletToConnect as WalletMobileProvider);
            } else {
              onConnect(walletToConnect as WalletExtensionProvider);
            }
          }}
        />
      );
    }

    // Show QR code for WalletConnect mobile
    if (walletconnectUrl) {
      return <QRCodeView qrCodeUri={walletconnectUrl} onBack={handleBack} onClose={handleClose} />;
    }

    // Show connected view (but not if user just initiated connection - let it close instead)
    if (isConnected && !walletToConnect) {
      return (
        <ConnectedView
          walletId={connectedWallet?.providerId}
          address={address}
          onClose={handleClose}
          onDisconnect={handleDisconnect}
        />
      );
    }

    // Show connecting view (only after delay) or keep showing it during close animation
    if (
      walletToConnect &&
      ((isConnecting && shouldShowConnecting) || (isConnected && walletToConnect))
    ) {
      return (
        <ConnectingView
          walletId={walletToConnect.id}
          walletName={walletToConnect.name}
          onBack={handleBack}
          onClose={handleClose}
        />
      );
    }

    // Show wallet list by default
    return (
      <WalletListView
        extensionProviders={extensionProviders}
        mobileProviders={mobileProviders}
        onSelectExtensionWallet={onConnect}
        onSelectMobileWallet={onMobileConnect}
        onClose={handleClose}
        loadingMobile={loadingMobile}
      />
    );
  }, [
    error,
    walletToConnect,
    walletconnectUrl,
    isConnected,
    isConnecting,
    shouldShowConnecting,
    extensionProviders,
    mobileProviders,
    onConnect,
    onMobileConnect,
    handleClose,
    loadingMobile,
    handleBack,
    connectedWallet?.providerId,
    address,
    handleDisconnect,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Wallet List View
// ============================================================================

interface WalletListViewProps {
  extensionProviders: WalletExtensionProvider[];
  mobileProviders: WalletMobileProvider[];
  onSelectExtensionWallet: (provider: WalletExtensionProvider) => void;
  onSelectMobileWallet: (provider: WalletMobileProvider) => void;
  onClose: () => void;
  loadingMobile: boolean;
}

function WalletListView({
  extensionProviders,
  mobileProviders,
  onSelectExtensionWallet,
  onSelectMobileWallet,
  onClose,
  loadingMobile,
}: WalletListViewProps) {
  const allWallets = orderBy(
    [
      ...extensionProviders
        .filter((a) => a.initialized)
        .map((p) => ({
          provider: p,
          type:
            p instanceof ReadonlyWalletProvider ? ('readonly' as const) : ('extension' as const),
        })),
      ...mobileProviders
        .filter((a) => a.initialized)
        .map((p) => ({ provider: p, type: 'mobile' as const })),
    ],
    (a) => (a.provider instanceof ReadonlyWalletProvider ? 1 : 0),
    'asc',
  );

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DialogDescription>Choose a wallet to connect to Creda Finance.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 pt-4">
        {allWallets.map((wallet, index) => (
          <motion.div
            key={wallet.provider.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-4 p-4 transition-all hover:bg-accent"
              disabled={wallet.type === 'mobile' && loadingMobile}
              onClick={() => {
                if (wallet.type === 'extension') {
                  onSelectExtensionWallet(wallet.provider);
                } else if (wallet.type === 'readonly') {
                  onSelectExtensionWallet(wallet.provider);
                } else if (wallet.type === 'mobile') {
                  onSelectMobileWallet(wallet.provider);
                }
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {WALLET_CONFIG[wallet.provider.id]?.logo ? (
                  <img
                    src={WALLET_CONFIG[wallet.provider.id].logo}
                    alt={WALLET_CONFIG[wallet.provider.id].prettyName}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
              </div>

              <div className="flex flex-1 flex-col items-start text-left">
                <span className="font-medium">
                  {WALLET_CONFIG[wallet.provider.id]?.prettyName || wallet.provider.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {wallet.type === 'mobile'
                    ? 'Mobile'
                    : wallet.type === 'readonly'
                    ? 'Readonly'
                    : 'Extension'}
                </span>
              </div>

              {wallet.type === 'mobile' && loadingMobile && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          </motion.div>
        ))}

        {allWallets.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 opacity-20" />
            <p className="text-sm">No wallets available</p>
            <p className="text-xs">Please install a compatible wallet extension</p>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: allWallets.length * 0.05 }}
      >
        <Alert className="border-orange-400/30">
          <AlertTitle>Legal Notice</AlertTitle>
          <AlertDescription>
            <span>
              By connecting your wallet you accept the Disclaimer, Terms of Service and Legal
              Notices (
              <Button className="p-0 h-auto" variant={'link'} asChild onClick={onClose}>
                <Link to="/legal">read</Link>
              </Button>
              ).
            </span>
          </AlertDescription>
        </Alert>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: allWallets.length * 0.05 + 0.05 }}
      >
        <Alert className="border-red-400/30">
          <AlertTitle>Protocol Risk Notice</AlertTitle>
          <AlertDescription>
            <span>
              Creda smart contracts are currently unaudited and closed source. While best efforts
              are made to ensure security, usage may result in partial or total, permanent loss of
              funds.
            </span>
          </AlertDescription>
        </Alert>
      </motion.div>
    </>
  );
}

// ============================================================================
// Connecting View
// ============================================================================

interface ConnectingViewProps {
  walletId: string;
  walletName: string;
  onBack: () => void;
  onClose: () => void;
}

function ConnectingView({ walletId, walletName, onBack, onClose }: ConnectingViewProps) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex-1 text-center">Connecting</DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {WALLET_CONFIG[walletId]?.logo ? (
            <img
              src={WALLET_CONFIG[walletId].logo}
              alt={WALLET_CONFIG[walletId].prettyName}
              className="h-12 w-12 rounded-md object-contain"
            />
          ) : (
            <Wallet className="h-10 w-10" />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">
              Connecting to {WALLET_CONFIG[walletId]?.prettyName || walletName}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Please approve the connection in your wallet
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Connected View
// ============================================================================

interface ConnectedViewProps {
  walletId: string;
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
}

function ConnectedView({ walletId, address, onClose, onDisconnect }: ConnectedViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const truncatedAddress = address ? `${address.slice(0, 10)}...${address.slice(-8)}` : '';

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 w-6"></div>
          <DialogTitle className="flex-1 text-center">Connected</DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              {/* <Wallet className="h-10 w-10" /> */}

              {WALLET_CONFIG[walletId]?.logo ? (
                <img
                  src={WALLET_CONFIG[walletId].logo}
                  alt={WALLET_CONFIG[walletId].prettyName}
                  className="h-12 w-12 rounded-md object-contain"
                />
              ) : (
                <Wallet className="h-10 w-10" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold">Wallet Connected</h3>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="truncate font-mono text-sm">{truncatedAddress}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        <Button variant="destructive" className="w-full" onClick={onDisconnect}>
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    </>
  );
}

// ============================================================================
// QR Code View
// ============================================================================

interface QRCodeViewProps {
  qrCodeUri: string;
  onBack: () => void;
  onClose: () => void;
}

function QRCodeView({ qrCodeUri, onBack, onClose }: QRCodeViewProps) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex-1 text-center">Scan QR Code</DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-6">
        {qrCodeUri ? (
          <>
            <div className="rounded-lg border-4 border-border p-4 bg-white">
              <QRCode value={qrCodeUri} size={200} />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan this QR code with your mobile wallet to connect
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-center text-sm text-muted-foreground">Failed to generate QR code</p>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Rejected View
// ============================================================================

interface RejectedViewProps {
  wallet: WalletExtensionProvider | WalletMobileProvider;
  onBack: () => void;
  onClose: () => void;
  onReconnect: () => void;
}

function RejectedView({ wallet, onBack, onClose, onReconnect }: RejectedViewProps) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex-1 text-center">Connection Rejected</DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-col items-center gap-6 py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
          <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Connection Rejected</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You rejected the connection request in{' '}
            {WALLET_CONFIG[wallet.id]?.prettyName || wallet.name}
          </p>
        </div>

        <Button className="w-full" onClick={onReconnect}>
          Try Again
        </Button>
      </div>
    </>
  );
}

// ============================================================================
// Error View
// ============================================================================

interface ErrorViewProps {
  errorMessage: string;
  onBack: () => void;
  onClose: () => void;
  onReconnect: () => void;
}

function ErrorView({ errorMessage, onBack, onClose, onReconnect }: ErrorViewProps) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex-1 text-center">Connection Error</DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-col items-center gap-6 py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Something Went Wrong</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage || 'Failed to connect to wallet'}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <Button className="w-full" variant="outline" onClick={onBack}>
            Try Another Wallet
          </Button>
          <Button className="w-full" onClick={onReconnect}>
            Try Again
          </Button>
        </div>
      </div>
    </>
  );
}
