/**
 * Component for displaying proposal votes in a paginated table
 */

import { AddressLink } from '@/components/ui/address-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ListVotesResponse } from '@/daodao/types/contracts/DaoProposalSingle.common';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface VotesListProps {
  proposalModuleAddress: string;
  proposalId: number;
  totalPower: string;
  decimals?: number;
}

const VOTES_PER_PAGE = 20;

export function VotesList({
  proposalModuleAddress,
  proposalId,
  totalPower,
  decimals = 0,
}: VotesListProps) {
  const chain = useChain(Chain.Terra);
  const [searchParams, setSearchParams] = useSearchParams();

  const startAfter = searchParams.get('votes_start_after') || undefined;

  const votesQuery = useAsyncSignal(async () => {
    if (!proposalModuleAddress) return null;

    const result = await chain.read.query<ListVotesResponse>(proposalModuleAddress, {
      list_votes: {
        proposal_id: proposalId,
        limit: VOTES_PER_PAGE,
        start_after: startAfter || undefined,
      },
    });

    return result;
  }, [proposalModuleAddress, proposalId, startAfter, globalReload.value]);

  const votes = votesQuery.data.value?.votes || [];
  const isLoading = votesQuery.loading.value;
  const hasMore = votes.length === VOTES_PER_PAGE;

  const goToNextPage = () => {
    if (votes.length === VOTES_PER_PAGE) {
      const lastVote = votes[votes.length - 1];
      const newParams = new URLSearchParams(searchParams);
      newParams.set('votes_start_after', lastVote.voter);
      setSearchParams(newParams);
    }
  };

  const goToPreviousPage = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('votes_start_after');
    setSearchParams(newParams);
  };

  const formatVote = (vote: string) => {
    const voteMap: Record<string, { label: string; className: string }> = {
      yes: { label: 'Yes', className: 'text-green-600 dark:text-green-400 font-semibold' },
      no: { label: 'No', className: 'text-red-600 dark:text-red-400 font-semibold' },
      abstain: {
        label: 'Abstain',
        className: 'text-yellow-600 dark:text-yellow-400 font-semibold',
      },
      veto: { label: 'Veto', className: 'text-orange-600 dark:text-orange-400 font-semibold' },
    };

    const voteInfo = voteMap[vote.toLowerCase()] || {
      label: vote,
      className: 'text-muted-foreground',
    };
    return <span className={voteInfo.className}>{voteInfo.label}</span>;
  };

  const formatNumber = (value: number, decimals: number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatPower = (power: string) => {
    try {
      if (!decimals) {
        return new Intl.NumberFormat().format(Number(BigInt(power)));
      } else {
        // Divide by 10^decimals for staked token DAOs
        return formatNumber(
          parseFloat((BigInt(power) / BigInt(10 ** decimals)).toString()),
          decimals,
        );
      }
    } catch (error) {
      console.error('Error formatting voting power:', error);
      return power;
    }
  };

  const calculatePercentage = (power: string) => {
    try {
      const votePower = BigInt(power);
      const total = BigInt(totalPower);
      if (total === BigInt(0)) return 0;
      const percentage = (Number(votePower) / Number(total)) * 100;
      return percentage;
    } catch {
      return 0;
    }
  };

  const formatPercentage = (percentage: number) => {
    return percentage < 0.001 && percentage > 0 ? '<0.001' : percentage.toFixed(3);
  };

  if (isLoading && votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading votes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="text-xl">Votes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {votes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No votes cast yet</div>
        ) : (
          <>
            <div className="overflow-hidden border-t rounded-none">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Voter</TableHead>
                    <TableHead className="w-32 font-semibold">Vote</TableHead>
                    <TableHead className="w-40 font-semibold text-right">Voting Power</TableHead>
                    <TableHead className="w-32 font-semibold text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votes.map((vote) => {
                    const percentage = calculatePercentage(vote.power);
                    return (
                      <TableRow
                        key={vote.voter}
                        className="transition-colors hover:bg-muted/70 border-b last:border-0"
                      >
                        <TableCell className="py-1">
                          <AddressLink address={vote.voter} allowTagging />
                        </TableCell>
                        <TableCell className="py-1">{formatVote(vote.vote)}</TableCell>
                        <TableCell className="py-1 text-right font-medium">
                          {formatPower(vote.power)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-muted-foreground">
                          {formatPercentage(percentage)}%
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
                  onClick={goToPreviousPage}
                  disabled={!startAfter || isLoading}
                >
                  Previous
                </Button>
                {startAfter ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">After:</span>
                    <AddressLink address={startAfter} />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">Page 1</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasMore || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
