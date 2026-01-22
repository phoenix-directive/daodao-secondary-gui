import { AddressLink } from '@/components/ui/address-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DaoAvatar } from '@/components/ui/dao-avatar';
import { DaoDaoIcon } from '@/components/ui/daodao-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { usePageMeta } from '@/hooks/usePageMeta';
import { addRecentDao, isFavorite, toggleFavorite } from '@/lib/signals-instances';
import { AppsTab } from '@/pages/dao/tabs/AppsTab';
import { MembersTab } from '@/pages/dao/tabs/MembersTab';
import { MembershipTab } from '@/pages/dao/tabs/MembershipTab';
import { ProposalsTab } from '@/pages/dao/tabs/ProposalsTab';
import { SubDaosTab } from '@/pages/dao/tabs/SubDaosTab';
import { TreasuryTab } from '@/pages/dao/tabs/TreasuryTab';
import { Landmark, Loader2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function DaoPage() {
  const { address, tab } = useParams<{ address: string; tab?: string }>();
  const navigate = useNavigate();
  const [isCurrentlyFavorite, setIsCurrentlyFavorite] = useState(false);

  // Fetch DAO data from chain
  const daoState = useDaoDaoState(address);
  const daoData = daoState.data.value;
  const isLoading = daoState.loading.value;
  const error = daoState.error.value;

  const daoName = daoData?.config.name || 'DAO';
  const daoDescription = daoData?.config.description || '';
  const daoImageUrl = daoData?.config.image_url;

  // Valid tabs
  const validTabs = ['proposals', 'membership', 'treasury', 'members', 'subdaos', 'apps'];
  const activeTab = validTabs.includes(tab || '') ? (tab ?? '') : 'proposals';

  // Set page title
  const tabTitle = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  const pageTitle = daoName ? `${daoName} - ${tabTitle}` : `DAO - ${tabTitle}`;
  usePageMeta('dao', pageTitle);

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    navigate(`/dao/${address}/${newTab}`, { replace: true });
  };

  useEffect(() => {
    if (address && daoName) {
      // Add to recent DAOs
      addRecentDao({
        address,
        name: daoName,
        imageUrl: daoImageUrl,
      });
    }
  }, [address, daoName, daoImageUrl]);

  useEffect(() => {
    if (address) {
      // Check if favorited
      setIsCurrentlyFavorite(isFavorite(address));
    }
  }, [address]);

  const handleToggleFavorite = () => {
    if (address) {
      const newState = toggleFavorite({
        address,
        name: daoName,
        imageUrl: daoImageUrl,
      });
      setIsCurrentlyFavorite(newState);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="container mx-auto px-4 py-4 md:py-12 flex flex-col flex-1">
        {/* Loading State */}
        {isLoading && (
          <Card className="mb-8 p-0 border-2">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-lg text-muted-foreground">Loading DAO...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State - DAO Not Found */}
        {!isLoading && (error || !daoData) && (
          <Card className="mb-8 p-0 border-2 border-destructive/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-destructive/10 p-4">
                  <Landmark className="h-12 w-12 text-destructive" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">DAO Not Found</h2>
                <p className="mb-4 text-muted-foreground max-w-md">
                  {error
                    ? `Unable to load DAO data: ${error}`
                    : 'The DAO at this address could not be found or may not exist on this network.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go Home
                  </Button>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
                {address && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <span className="font-mono">{address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DAO Header */}
        {!isLoading && !error && daoData && (
          <Card className="mb-8 p-0 border-2">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Avatar */}
                <div className="shrink-0">
                  <DaoAvatar name={daoName} imageUrl={daoImageUrl} size="big" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                        {daoName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <AddressLink address={address!} />
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                              <a
                                href={`https://daodao.zone/dao/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <DaoDaoIcon className="h-3 w-3" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View on DAO DAO</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFavorite}
                        className="h-9 w-9"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            isCurrentlyFavorite
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                  {daoDescription && (
                    <p className="text-muted-foreground leading-relaxed">{daoDescription}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section - Only show if DAO loaded successfully */}
        {!isLoading && !error && daoData && (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full flex flex-col flex-1"
          >
            <TabsList className="flex flex-wrap h-auto w-full lg:w-auto lg:inline-grid lg:grid-cols-6">
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="subdaos">Sub DAOs</TabsTrigger>
              <TabsTrigger value="treasury">Treasury</TabsTrigger>
              <TabsTrigger value="apps">Apps</TabsTrigger>
            </TabsList>

            <div className="flex-1 flex flex-col">
              <TabsContent value="proposals" className="mt-0 flex-1">
                <ProposalsTab />
              </TabsContent>
              <TabsContent value="membership" className="mt-0 flex-1">
                <MembershipTab />
              </TabsContent>

              <TabsContent value="members" className="mt-0 flex-1">
                <MembersTab />
              </TabsContent>

              <TabsContent value="subdaos" className="mt-0 flex-1">
                <SubDaosTab />
              </TabsContent>
              <TabsContent value="treasury" className="mt-0 flex-1 flex flex-col">
                <TreasuryTab daoAddress={address} daoName={daoName} />
              </TabsContent>

              <TabsContent value="apps" className="mt-0 flex-1 flex flex-col">
                <AppsTab />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
