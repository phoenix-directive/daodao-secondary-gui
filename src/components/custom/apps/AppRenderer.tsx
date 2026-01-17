import { isUrlValid } from '@/config/apps';
import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import { DaoDaoStateResponse } from '@/hooks/useDaoDao';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppPicker } from './AppPicker';
import { DappComponent, DappComponentRef } from './DappComponent';

interface AppRendererProps {
  /** Initial URL to load */
  initialUrl?: string;
  /** Whether the app starts in fullscreen mode */
  fullScreen: boolean;
  /** Callback when fullscreen mode changes */
  onFullScreenChange: (fullScreen: boolean) => void;
  /** Loading state */
  loading?: boolean;
  /** Error to display */
  error?: string;

  daoData: DaoDaoStateResponse;
}

export function AppRenderer({
  initialUrl = '',
  fullScreen,
  onFullScreenChange,
  loading,
  error: externalError,
  daoData,
}: AppRendererProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string>();
  const [finalMessages, setFinalMessages] = useState<UnifiedCosmosMsg[]>([]);
  const currentError = externalError || error;
  const dappRef = useRef<DappComponentRef>(null);

  // Handle decoded messages from the app iframe
  const handleMessagesDecoded = useCallback(
    (chainId: string, sender: string, msgs: UnifiedCosmosMsg[]) => {
      setFinalMessages(msgs);

      // Log the decoded messages for debugging
      console.log('DECODED MESSAGES:', {
        chainId,
        sender,
        msgs,
      });

      // TODO: Handle different execution types (authzExec, daoAdminExec)
      // TODO: Add cross-chain execute action support for DAOs
    },
    [],
  );

  // Handle opening an app
  const handleOpenApp = useCallback(
    (newUrl: string) => {
      const validity = isUrlValid(newUrl);
      if (validity === true) {
        setError(undefined);
        setUrl(newUrl);
        if (dappRef.current?.iframe) {
          dappRef.current.iframe.src = newUrl;
        }
        onFullScreenChange(true);
      } else {
        setError(validity);
      }
    },
    [onFullScreenChange],
  );

  // Auto-open if initial URL is valid
  useEffect(() => {
    if (initialUrl && isUrlValid(initialUrl) === true) {
      handleOpenApp(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If not in fullscreen, show the app picker
  if (!fullScreen) {
    return (
      <AppPicker
        url={url}
        onOpenApp={handleOpenApp}
        loading={loading}
        error={currentError}
        onErrorChange={setError}
        daoData={daoData}
      />
    );
  }

  // Fullscreen renderer using DappComponent
  return (
    <DappComponent
      ref={dappRef}
      src={url}
      name={url}
      fullScreen={fullScreen}
      onFullScreenChange={onFullScreenChange}
      onMessagesDecoded={handleMessagesDecoded}
      onUrlChange={setUrl}
      loading={loading}
      error={currentError}
      onErrorChange={setError}
      daoData={daoData}
      showMenuButton={true}
      appPickerDialogTitle="Switch App"
    />
  );
}
