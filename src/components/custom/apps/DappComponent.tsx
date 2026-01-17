import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import { DaoDaoStateResponse } from '@/hooks/useDaoDao';
import { cx } from 'class-variance-authority';
import { ExternalLink, Maximize2, Menu, Minimize2, X } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIframe, AppIframeRef } from './AppIframe';
import { AppPicker } from './AppPicker';

/**
 * DappComponent - A reusable component for displaying dApps in either card or fullscreen mode
 *
 * @example Card mode with custom height
 * ```tsx
 * <DappComponent
 *   src="https://app.example.com"
 *   name="Example App"
 *   daoData={daoData}
 *   cardHeight="500px"
 *   showCardHeader={true}
 * />
 * ```
 *
 * @example Fullscreen mode with menu button
 * ```tsx
 * <DappComponent
 *   src="https://app.example.com"
 *   name="Example App"
 *   fullScreen={true}
 *   onFullScreenChange={setFullScreen}
 *   showMenuButton={true}
 *   onMenuClick={() => setShowMenu(true)}
 *   daoData={daoData}
 * />
 * ```
 *
 * @example Filling to bottom of container
 * ```tsx
 * <div className="flex flex-col h-screen">
 *   <div>Header content</div>
 *   <DappComponent
 *     src="https://app.example.com"
 *     name="Example App"
 *     daoData={daoData}
 *     cardHeight="100%"
 *     className="flex-1"
 *     showCardHeader={false}
 *   />
 * </div>
 * ```
 */

export interface DappComponentProps {
  /** The URL to load */
  src: string;
  /** App name for display */
  name?: string;
  /** Whether to start in fullscreen mode */
  fullScreen?: boolean;
  /** Callback when fullscreen mode changes */
  onFullScreenChange?: (fullScreen: boolean) => void;
  /** Callback when messages are decoded from the app */
  onMessagesDecoded?: (chainId: string, sender: string, msgs: UnifiedCosmosMsg[]) => void;
  /** Callback when app URL changes */
  onUrlChange?: (url: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Error to display */
  error?: string;
  /** Callback when error changes */
  onErrorChange?: (error: string | undefined) => void;
  /** DAO data */
  daoData: DaoDaoStateResponse;
  /** Custom className for card mode */
  className?: string;
  /** Whether to show header in card mode */
  showCardHeader?: boolean;

  /** Whether to show the menu button in fullscreen mode (enables app picker dialog) */
  showMenuButton?: boolean;
  /** Dialog title for app picker */
  appPickerDialogTitle?: string;
}

export interface DappComponentRef {
  /** The underlying iframe element */
  iframe: HTMLIFrameElement | null;
}

export const DappComponent = forwardRef<DappComponentRef, DappComponentProps>(
  (
    {
      src,
      name,
      fullScreen = false,
      onFullScreenChange,
      onMessagesDecoded,
      onUrlChange,
      loading = false,
      error = '',
      onErrorChange,
      daoData,
      className,
      showCardHeader = true,
      showMenuButton = true,
      appPickerDialogTitle = 'Switch App',
    },
    ref,
  ) => {
    const iframeRef = useRef<AppIframeRef>(null);
    const [isFullscreenLocal, setIsFullscreenLocal] = useState(fullScreen);
    const [showAppPicker, setShowAppPicker] = useState(false);

    // Expose iframe to parent
    useImperativeHandle(ref, () => ({
      iframe: iframeRef.current?.iframe || null,
    }));

    const isFullscreenMode = onFullScreenChange ? fullScreen : isFullscreenLocal;

    const toggleFullscreen = useCallback(() => {
      const newFullscreen = !isFullscreenMode;
      if (onFullScreenChange) {
        onFullScreenChange(newFullscreen);
      } else {
        setIsFullscreenLocal(newFullscreen);
      }
    }, [isFullscreenMode, onFullScreenChange]);

    const handleClose = useCallback(() => {
      if (onFullScreenChange) {
        onFullScreenChange(false);
      } else {
        setIsFullscreenLocal(false);
      }
    }, [onFullScreenChange]);

    const handleOpenApp = useCallback(
      (newUrl: string) => {
        if (onUrlChange) {
          onUrlChange(newUrl);
        }
        if (iframeRef.current?.iframe) {
          iframeRef.current.iframe.src = newUrl;
        }
        setShowAppPicker(false);
      },
      [onUrlChange],
    );

    // Disable body scroll when in fullscreen mode
    useEffect(() => {
      if (isFullscreenMode) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }, [isFullscreenMode]);

    // Render fullscreen mode
    if (isFullscreenMode) {
      const fullScreenContent = (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground truncate">{name || src}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {showMenuButton && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowAppPicker(true)}
                  title="Open another app"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={handleClose} title="Close app">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Error</p>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <AppIframe
                ref={iframeRef}
                src={src}
                className="w-full h-full border-0"
                title={name || 'App'}
                onMessagesDecoded={onMessagesDecoded}
                daoData={daoData}
              />
            )}
          </div>
        </div>
      );

      return (
        <>
          {createPortal(fullScreenContent, document.body)}

          {/* App Picker Dialog */}
          {showMenuButton && (
            <Dialog open={showAppPicker} onOpenChange={setShowAppPicker}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{appPickerDialogTitle}</DialogTitle>
                </DialogHeader>
                <AppPicker
                  url={src}
                  onOpenApp={handleOpenApp}
                  loading={loading}
                  error={error}
                  onErrorChange={onErrorChange}
                  daoData={daoData}
                  fixedCols={3}
                />
              </DialogContent>
            </Dialog>
          )}
        </>
      );
    }

    // Render card mode
    return (
      <Card className={cx('p-0', className)}>
        <CardContent className="p-0 h-full flex flex-col flex-1">
          {/* Card header with fullscreen toggle */}
          {showCardHeader && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{name || src}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-7 px-2"
                title="Toggle fullscreen"
              >
                {isFullscreenMode ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Exit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Fullscreen</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Iframe container */}
          <div className="relative w-full flex-1">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="text-center p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            ) : (
              <AppIframe
                ref={iframeRef}
                src={src}
                className="absolute inset-0 w-full h-full border-0"
                title={name || 'App'}
                onMessagesDecoded={onMessagesDecoded}
                daoData={daoData}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);

DappComponent.displayName = 'DappComponent';
