import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalStatusIcon } from '@/components/ui/proposal-status-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ProposalResponse,
  Config as SingleConfig,
  ProposalListResponse as SingleProposalListResponse,
  Threshold,
} from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { Chain } from '@/hooks/helpers/assets';
import { fromUnixNano } from '@/hooks/helpers/helpers';
import { useChain } from '@/hooks/useChain';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface ProposalData {
  proposals: ProposalResponse[];
  config: SingleConfig | null;
}

export function ProposalsTab() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chain = useChain(Chain.Terra);
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value;

  const [proposalData, setProposalData] = useState<ProposalData>({
    proposals: [],
    config: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startAfter = searchParams.get('start_after')
    ? parseInt(searchParams.get('start_after')!, 10)
    : undefined;
  const [hasMore, setHasMore] = useState(true);
  const [highestId, setHighestId] = useState<number | null>(null);
  const [lowestId, setLowestId] = useState<number | null>(null);

  const proposalModuleAddress = useMemo(() => {
    return daoData?.proposal_modules?.[0]?.address;
  }, [daoData]);

  const limit = 20;

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

        // Track highest and lowest IDs for navigation
        if (proposalsResult.proposals.length > 0) {
          setHighestId(proposalsResult.proposals[0].id);
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

  const getExpirationDate = (expiration: any) => {
    if (!expiration) return 'Unknown';
    if ('at_time' in expiration) {
      try {
        const date = fromUnixNano(+expiration.at_time);
        const now = new Date();
        const isCurrentMonth =
          date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        if (isCurrentMonth) {
          // Show "9. Januar" for current month
          return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        } else {
          // Show "November 2025" for other months
          return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        }
      } catch {
        return 'Invalid';
      }
    }
    if ('at_height' in expiration) {
      return `Block ${expiration.at_height}`;
    }
    if ('never' in expiration) {
      return 'Never';
    }
    return 'Unknown';
  };

  const getThresholdText = (threshold: Threshold) => {
    if ('absolute_percentage' in threshold) {
      const pct = threshold.absolute_percentage.percentage;
      if ('percent' in pct) {
        return `${(+pct.percent * 100).toFixed(0)}%`;
      }
      if ('majority' in pct) {
        return 'Majority (>50%)';
      }
    }
    if ('threshold_quorum' in threshold) {
      const quorum = threshold.threshold_quorum.quorum;
      const thresh = threshold.threshold_quorum.threshold;
      let quorumText = '';
      let threshText = '';

      if ('percent' in quorum) {
        quorumText = `${(+quorum.percent * 100).toFixed(0)}%`;
      } else if ('majority' in quorum) {
        quorumText = '>50%';
      }

      if ('percent' in thresh) {
        threshText = `${(+thresh.percent * 100).toFixed(0)}%`;
      } else if ('majority' in thresh) {
        threshText = '>50%';
      }

      return `Q: ${quorumText}, T: ${threshText}`;
    }
    if ('absolute_count' in threshold) {
      return `${threshold.absolute_count.threshold} votes`;
    }
    return 'Unknown';
  };

  if (!daoData || !proposalModuleAddress) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mb-2 text-lg font-semibold">No Proposal Module</h3>
            <p className="text-sm text-muted-foreground">
              This DAO does not have a proposal module configured.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && proposalData.proposals.length === 0) {
    return (
      <Card>
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
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="mb-2 text-lg font-semibold">Error Loading Proposals</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposalData.proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Proposals</span>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/dao/${daoAddress}/proposals/create`)}
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
            <p className="text-sm text-muted-foreground">
              This DAO doesn't have any proposals yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Proposals</span>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => navigate(`/dao/${daoAddress}/proposals/create`)}
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden border-t rounded-none">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-24 font-semibold">ID</TableHead>
                <TableHead className="w-12 font-semibold"></TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="w-32 font-semibold text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposalData.proposals.map((proposal) => {
                return (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer transition-colors hover:bg-muted/70 border-b last:border-0"
                    onClick={() => navigate(`/dao/${daoAddress}/proposals/${proposal.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      A-{proposal.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="w-12">
                      <ProposalStatusIcon status={proposal.proposal.status} />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium line-clamp-1">{proposal.proposal.title}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">
                      {getExpirationDate(proposal.proposal.expiration)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {(startAfter || hasMore) && (
          <div className="flex items-center justify-between p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchParams({});
              }}
              disabled={!startAfter || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              {startAfter ? `After #${startAfter}` : 'Latest'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (lowestId !== null) {
                  setSearchParams({ start_after: lowestId.toString() });
                }
              }}
              disabled={!hasMore || isLoading}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
