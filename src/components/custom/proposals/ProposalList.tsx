import { ProposalTable } from '@/components/custom/proposals/ProposalTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ProposalResponse,
  Config as SingleConfig,
  ProposalListResponse as SingleProposalListResponse,
} from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { ChevronsLeft, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface ProposalData {
  proposals: ProposalResponse[];
  config: SingleConfig | null;
}

interface ProposalListProps {
  proposalModuleAddress: string;
  prefix: string;
  title: string;
  hideIfEmpty?: boolean;
}

export function ProposalList({
  proposalModuleAddress,
  prefix,
  title,
  hideIfEmpty = false,
}: ProposalListProps) {
  const { address: daoAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const chain = useChain(Chain.Terra);
  const [searchParams, setSearchParams] = useSearchParams();

  const [proposalData, setProposalData] = useState<ProposalData>({
    proposals: [],
    config: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use prefix-specific search params
  const paramKey = `${prefix.toLowerCase()}_start_after`;
  const startAfter = searchParams.get(paramKey)
    ? parseInt(searchParams.get(paramKey)!, 10)
    : undefined;
  const [hasMore, setHasMore] = useState(true);
  const [lowestId, setLowestId] = useState<number | null>(null);

  // Track navigation history - stack stores start_after values (undefined = first page)
  // Empty array means: user landed directly with params or hasn't navigated yet
  const [pageStack, setPageStack] = useState<(number | undefined)[]>([]);
  const hasNavigationHistory = pageStack.length > 0;

  const limit = 10;

  // Fetch proposals and config
  useEffect(() => {
    const fetchData = async () => {
      if (!proposalModuleAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch config and proposals in parallel
        const [configResult, proposalsResult] = await Promise.all([
          chain.read.queryCached<SingleConfig>(proposalModuleAddress, { config: {} }, 60 * 24),
          chain.read.query<SingleProposalListResponse>(proposalModuleAddress, {
            reverse_proposals: {
              limit,
              start_before: startAfter,
            },
          }),
        ]);

        setProposalData({
          config: configResult,
          proposals: proposalsResult.proposals,
        });

        // Track lowest ID for navigation
        if (proposalsResult.proposals.length > 0) {
          setLowestId(proposalsResult.proposals[proposalsResult.proposals.length - 1].id);
        }

        setHasMore(proposalsResult.proposals.length === limit);
      } catch (err: any) {
        console.error('Failed to fetch proposals:', err);
        setError(err.message || 'Failed to load proposals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [proposalModuleAddress, chain, startAfter]);

  if (isLoading && proposalData.proposals.length === 0) {
    // If hideIfEmpty is true, don't render anything during loading either
    if (hideIfEmpty) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/dao/${daoAddress}/proposals/create?type=${prefix}`)}
            >
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading proposals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/dao/${daoAddress}/proposals/create?type=${prefix}`)}
            >
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-destructive">Error Loading Proposals</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposalData.proposals.length === 0) {
    // If hideIfEmpty is true, don't render anything
    if (hideIfEmpty) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/dao/${daoAddress}/proposals/create?type=${prefix}`)}
            >
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Proposals</h3>
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updateSearchParams = (newStartAfter?: number) => {
    const params = new URLSearchParams(searchParams);
    if (newStartAfter) {
      params.set(paramKey, newStartAfter.toString());
    } else {
      params.delete(paramKey);
    }
    setSearchParams(params);
  };

  const goToNext = () => {
    if (lowestId !== null) {
      // Push current page onto stack before navigating forward
      setPageStack((prev) => [...prev, startAfter]);
      updateSearchParams(lowestId);
    }
  };

  const goToPrevious = () => {
    // Pop stack and navigate to previous page
    const newStack = [...pageStack];
    const previousPage = newStack.pop();
    setPageStack(newStack);
    updateSearchParams(previousPage);
  };

  const goToFirst = () => {
    // Clear stack and go to first page
    setPageStack([]);
    updateSearchParams();
  };

  // Show "First" button when: not on first page AND no navigation history
  // Show "Previous" button when: have navigation history
  const isOnFirstPage = startAfter === undefined;
  const canGoBack = hasNavigationHistory && pageStack.length > 0;

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => navigate(`/dao/${daoAddress}/proposals/create?type=${prefix}`)}
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ProposalTable proposals={proposalData.proposals} prefix={prefix} />

        {/* Pagination */}
        {(!isOnFirstPage || hasMore) && (
          <div className="flex items-center justify-between p-4 border-t">
            {!hasNavigationHistory && !isOnFirstPage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirst}
                disabled={isLoading}
                className="gap-2"
              >
                <ChevronsLeft className="h-4 w-4" />
                First
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={!canGoBack || isLoading}
              >
                Previous
              </Button>
            )}
            <span className="text-sm text-muted-foreground font-medium">
              {startAfter ? `After #${startAfter}` : 'Latest'}
            </span>
            <Button variant="outline" size="sm" onClick={goToNext} disabled={!hasMore || isLoading}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
