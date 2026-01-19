import { AddressLink } from '@/components/ui/address-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DaoAvatar } from '@/components/ui/dao-avatar';
import { DaoDaoIcon } from '@/components/ui/daodao-icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubDaos } from '@/hooks/useSubDaos';
import { AlertCircle, Loader2, Network } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function SubDaosTab() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const subDaosState = useSubDaos(daoAddress);

  const subDaos = subDaosState.data.value || [];
  const isLoading = subDaosState.loading.value;
  const error = subDaosState.error.value;

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading Sub DAOs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load Sub DAOs</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (subDaos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mb-2 text-lg font-semibold">No Sub DAOs</h3>
            <p className="text-sm text-muted-foreground">
              This DAO does not have any sub-DAOs registered.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display sub-DAOs
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subDaos.map((subDao) => (
          <Link key={subDao.addr} to={`/dao/${subDao.addr}`}>
            <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20 overflow-hidden h-full">
              <CardHeader className="gap-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <DaoAvatar
                      name={subDao.name}
                      imageUrl={subDao.imageUrl}
                      size="small"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base transition-colors truncate">
                        {subDao.name}
                      </CardTitle>
                      <div className="mt-1 min-w-0">
                        <AddressLink
                          address={subDao.addr}
                          className="text-xs text-muted-foreground hover:text-muted-foreground/80"
                          short={true}
                        />
                      </div>
                    </div>
                  </div>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `https://daodao.zone/dao/${subDao.addr}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                        asChild
                      >
                        <a
                          href={`https://daodao.zone/dao/${subDao.addr}`}
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
              </CardHeader>
              {subDao.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subDao.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
