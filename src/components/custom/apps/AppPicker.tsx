import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isLocalhost } from '@/config/config';
import ecosystemProjects from '@/config/ecosystemProjects.json';
import { DaoDaoStateResponse } from '@/hooks/useDaoDao';
import { cx } from 'class-variance-authority';
import { AlertCircle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EcosystemProject {
  name: string;
  type: string;
  description: string;
  status: string;
  thumbnail: string;
  link: string;
  app: boolean;
  social?: {
    webSite?: string;
    twitter?: string;
    medium?: string;
    github?: string;
    docs?: string;
  };
}

interface AppPickerProps {
  /** Current URL value */
  url: string;
  /** Callback when URL changes or app is opened */
  onOpenApp: (url: string, name: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Callback to clear error */
  onErrorChange?: (error: string | undefined) => void;
  daoData: DaoDaoStateResponse;
  fixedCols?: number;
}

const ALLOWED_URL_REGEX = /^https?:\/\/.+[^.]$/;

function isUrlValid(url: string): true | string {
  try {
    if (!!url && !!new URL(url).href && ALLOWED_URL_REGEX.test(url)) {
      return true;
    } else {
      return 'Invalid URL.';
    }
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid URL format';
  }
}

// Extract Twitter username from URL and construct local banner path
function getTwitterBannerPath(twitterUrl?: string): string | null {
  if (!twitterUrl) return null;
  try {
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
    if (match && match[1]) {
      // Use local X banner from public/x folder
      return `/x/${match[1]}_banner.jpg`;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

export function AppPicker({
  url,
  onOpenApp,
  loading,
  error,
  onErrorChange,
  daoData,
  fixedCols,
}: AppPickerProps) {
  const [inputUrl, setInputUrl] = useState(url);

  // Filter apps where app = true and add custom option
  const availableApps = [
    ...(ecosystemProjects as EcosystemProject[])
      .filter((project) => project.app === true)
      .filter((a) => {
        if (isLocalhost) {
          return true;
        } else {
          return a.name.toLowerCase().includes('local') ? false : true;
        }
      }),
    {
      name: 'Custom',
      type: 'Custom',
      description: 'Enter a custom app URL',
      status: 'open',
      thumbnail: '',
      link: '',
      app: true,
    } as EcosystemProject,
  ];

  // Update input when URL prop changes
  useEffect(() => {
    if (url !== inputUrl) {
      setInputUrl(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Find selected app
  const selectedApp = availableApps.find(
    (app) =>
      app.link === inputUrl ||
      (!app.link && inputUrl && !availableApps.find((a) => a.link === inputUrl)),
  );
  const isCustomSelected = selectedApp?.name === 'Custom';

  const handleAppSelect = (app: EcosystemProject) => {
    setInputUrl(app.link);
    onOpenApp(app.link, app.name);
    onErrorChange?.(undefined);
  };

  const handleInputChange = (value: string) => {
    // Auto-add https:// if missing
    let processedValue = value.trim();
    if (processedValue && !processedValue.match(/^https?:\/\//i)) {
      processedValue = 'https://' + processedValue;
    }
    setInputUrl(processedValue);
    onErrorChange?.(undefined);
  };

  const handleOpen = () => {
    const validity = isUrlValid(inputUrl);
    if (validity === true) {
      onOpenApp(inputUrl, selectedApp?.name ?? '');
    } else {
      onErrorChange?.(validity);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* App Grid */}
      <div
        className={cx(
          'grid gap-3',
          fixedCols && `grid-cols-${fixedCols}`,
          !fixedCols && 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
        )}
      >
        {availableApps.map((app) => {
          const isSelected = selectedApp?.name === app.name;
          const isCustom = app.name === 'Custom';

          return (
            <button
              key={app.name}
              onClick={() => handleAppSelect(app)}
              className={`
                group relative flex flex-col items-center gap-2 p-0 rounded-lg border-2 transition-all
                hover:border-primary/50 hover:bg-accent/50 cursor-pointer
                ${isSelected ? 'border-primary bg-accent' : 'border-border'}
              `}
            >
              {/* Thumbnail with text overlay */}
              <div
                className="relative w-full rounded-md bg-muted overflow-hidden"
                style={{ aspectRatio: '4/2' }}
              >
                {isCustom ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center border-muted-foreground/30">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/90 to-transparent p-2">
                      <span className="text-xs font-medium text-center block">{app.name}</span>
                    </div>
                  </>
                ) : (
                  (() => {
                    const bannerPath = getTwitterBannerPath(app.social?.twitter);
                    return (
                      <>
                        {bannerPath ? (
                          <img
                            src={bannerPath}
                            alt={app.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to local thumbnail
                              const target = e.target as HTMLImageElement;
                              if (app.thumbnail) {
                                target.src = `/thumbnail/${app.thumbnail}.png`;
                                target.onerror = () => {
                                  target.src = `/thumbnail/${app.thumbnail}.svg`;
                                };
                              }
                            }}
                          />
                        ) : app.thumbnail ? (
                          <img
                            src={`/thumbnail/${app.thumbnail}.png`}
                            alt={app.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src.endsWith('.png')) {
                                target.src = `/thumbnail/${app.thumbnail}.svg`;
                              }
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-primary/10" />
                        )}

                        {/* Text overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2">
                          <span className="text-xs font-semibold text-white text-center block line-clamp-2">
                            {app.name}
                          </span>
                        </div>
                      </>
                    );
                  })()
                )}

                {/* Selected indicator */}
                {/* {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )} */}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom URL Input - Only show for custom apps */}
      {isCustomSelected && (
        <>
          {/* <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    Custom App Warning
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You are opening a custom app. Only use apps you trust, as they will have access
                    to request wallet signatures.
                  </p>
                  <a
                    href="https://github.com/DA0-DA0/dao-dao-ui/wiki/How-to-support-DAO-DAO's-Apps-interface"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                  >
                    Integration Guide
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <div className="space-y-2">
            <label htmlFor="app-url" className="text-sm font-medium">
              App URL
            </label>
            <div className="flex gap-2">
              <input
                id="app-url"
                type="url"
                value={inputUrl}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleOpen();
                  }
                }}
                placeholder="https://..."
                autoComplete="off"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button onClick={handleOpen} disabled={!inputUrl || !!error || loading} size="lg">
                {loading ? 'Opening...' : 'Open App'}
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Integrated Dapp Card - only show for non-custom selected apps */}
      {/* {!isCustomSelected && selectedApp && inputUrl && (
        <DappComponent
          src={inputUrl}
          name={selectedApp.name}
          daoData={daoData}
          cardHeight="70vh"
          showCardHeader={true}
          onFullScreenChange={(fullscreen) => {
            if (fullscreen) {
              onOpenApp(inputUrl);
            }
          }}
        />
      )} */}
    </div>
  );
}
