import { useEffect, useRef } from 'react';

// Injected at build time by Vite
declare const __BUILD_VERSION__: string;

const CHECK_INTERVAL = 60000; // Check every 60 seconds
const VERSION_FILE = '/version.json';
const COMPILED_VERSION = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : null;

interface VersionInfo {
  hash: string;
  timestamp: number;
}

let initialVersion: string | null = null;

/**
 * Hook to periodically check if a new version is available and force reload if detected.
 * Compares both the compiled build hash and the server's version.json file.
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
          console.log('[Version Check] Compiled version:', COMPILED_VERSION);
          console.log('[Version Check] Initial server version:', initialVersion);

          // If compiled version exists and differs from server, reload immediately
          if (COMPILED_VERSION && COMPILED_VERSION !== initialVersion) {
            console.log('[Version Check] Compiled version mismatch detected. Reloading...');
            window.location.reload();
          }
        }
      } catch (error) {
        console.warn('[Version Check] Failed to fetch initial version:', error);
      }
    };

    // Check for version updates
    const checkVersion = async () => {
      if (!initialVersion && !COMPILED_VERSION) return;

      try {
        const response = await fetch(VERSION_FILE + '?t=' + Date.now(), {
          cache: 'no-cache',
        });
        if (response.ok) {
          const data: VersionInfo = await response.json();

          // Check against both compiled version and initial fetched version
          const currentVersion = COMPILED_VERSION || initialVersion;
          if (currentVersion && data.hash !== currentVersion) {
            console.log(
              '[Version Check] New version detected:',
              data.hash,
              '(current:',
              currentVersion,
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
