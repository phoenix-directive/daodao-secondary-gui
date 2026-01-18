import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 60000; // Check every 60 seconds
const VERSION_FILE = '/version.json';

interface VersionInfo {
  hash: string;
  timestamp: number;
}

let initialVersion: string | null = null;

/**
 * Hook to periodically check if a new version is available and force reload if detected.
 * Compares the current build hash with the server's version.json file.
 */
export function useVersionCheck() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Fetch initial version on mount
    const fetchInitialVersion = async () => {
      try {
        const response = await fetch(VERSION_FILE + '?t=' + Date.now(), {
          cache: 'no-cache',
        });
        if (response.ok) {
          const data: VersionInfo = await response.json();
          initialVersion = data.hash;
          console.log('[Version Check] Initial version:', initialVersion);
        }
      } catch (error) {
        console.warn('[Version Check] Failed to fetch initial version:', error);
      }
    };

    // Check for version updates
    const checkVersion = async () => {
      if (!initialVersion) return;

      try {
        const response = await fetch(VERSION_FILE + '?t=' + Date.now(), {
          cache: 'no-cache',
        });
        if (response.ok) {
          const data: VersionInfo = await response.json();
          if (data.hash !== initialVersion) {
            console.log(
              '[Version Check] New version detected:',
              data.hash,
              '(current:',
              initialVersion,
              ')',
            );
            // Force a hard reload to get the new version
            window.location.reload();
          }
        }
      } catch (error) {
        console.warn('[Version Check] Failed to check version:', error);
      }
    };

    // Initialize
    fetchInitialVersion();

    // Set up periodic check
    intervalRef.current = window.setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
