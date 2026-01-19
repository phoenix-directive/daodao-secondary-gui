/**
 * Component for displaying ALL proposal votes with sortable table
 * Uses pagination with 1000 limit to load all votes at once
 */

import { AddressLink } from '@/components/ui/address-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SortableTableGrid from '@/components/ui/sortable-table-grid';
import { ListVotesResponse } from '@/daodao/types/contracts/DaoProposalSingle.common';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';

interface VotesListAllProps {
  proposalModuleAddress: string;
  proposalId: number;
  totalPower: string;
  decimals?: number;
}

interface Vote {
  voter: string;
  vote: string;
  power: string;
  rationale?: string | null;
  percentage: number;
}

const VOTES_LIMIT = 1000;

export function VotesListAll({
  proposalModuleAddress,
  proposalId,
  totalPower,
  decimals = 0,
}: VotesListAllProps) {
  const chain = useChain(Chain.Terra);

  // Sorting state - default to voting power descending
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'power',
      desc: true,
    },
  ]);

  // Fetch all votes with pagination
  const votesQuery = useAsyncSignal(async () => {
    if (!proposalModuleAddress) return [];

    const allVotes: any[] = [];
    let startAfter: string | undefined = undefined;

    // Paginate through all votes
    while (true) {
      const result: ListVotesResponse = await chain.read.query<ListVotesResponse>(
        proposalModuleAddress,
        {
          list_votes: {
            proposal_id: proposalId,
            limit: VOTES_LIMIT,
            start_after: startAfter,
          },
        },
      );

      allVotes.push(...result.votes);

      // If we got less than the limit, we've fetched all votes
      if (result.votes.length < VOTES_LIMIT) {
        break;
      }

      // Set start_after to the last vote for next page
      startAfter = result.votes[result.votes.length - 1].voter;
    }

    return allVotes;
  }, [proposalModuleAddress, proposalId, globalReload.value]);

  const isLoading = votesQuery.loading.value;
  const error = votesQuery.error.value;

  // Format functions
  const formatVote = useCallback((vote: string) => {
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
    return voteInfo.label;
  }, []);

  const formatVoteClass = useCallback((vote: string) => {
    const voteMap: Record<string, string> = {
      yes: 'text-green-600 dark:text-green-400 font-semibold',
      no: 'text-red-600 dark:text-red-400 font-semibold',
      abstain: 'text-yellow-600 dark:text-yellow-400 font-semibold',
      veto: 'text-orange-600 dark:text-orange-400 font-semibold',
    };
    return voteMap[vote.toLowerCase()] || 'text-muted-foreground';
  }, []);

  const formatNumber = useCallback(
    (value: number, decimalsArg: number) => {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimalsArg,
        maximumFractionDigits: decimalsArg,
      }).format(value);
    },
    [],
  );

  const formatPower = useCallback(
    (power: string) => {
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
    },
    [decimals, formatNumber],
  );

  const formatPercentage = useCallback((percentage: number) => {
    return percentage < 0.001 && percentage > 0 ? '<0.001' : percentage.toFixed(3);
  }, []);

  // Calculate percentages and format votes
  const votes = useMemo<Vote[]>(() => {
    const rawVotes = votesQuery.data.value || [];
    return rawVotes.map((vote) => {
      const votePower = BigInt(vote.power);
      const total = BigInt(totalPower);
      const percentage = total === BigInt(0) ? 0 : (Number(votePower) / Number(total)) * 100;

      return {
        voter: vote.voter,
        vote: vote.vote,
        power: vote.power,
        rationale: vote.rationale,
        percentage,
      };
    });
  }, [votesQuery.data.value, totalPower]);

  // Define columns for the sortable table
  const columns = useMemo<ColumnDef<Vote>[]>(
    () => [
      {
        id: 'voter',
        header: 'Voter',
        accessorKey: 'voter',
        cell: ({ row }) => <AddressLink address={row.original.voter} allowTagging />,
        enableSorting: true,
      },
      {
        id: 'vote',
        header: 'Vote',
        accessorKey: 'vote',
        cell: ({ row }) => (
          <span className={formatVoteClass(row.original.vote)}>
            {formatVote(row.original.vote)}
          </span>
        ),
        enableSorting: true,
        meta: {
          width: '120px',
        },
      },
      {
        id: 'power',
        header: 'Voting Power',
        accessorKey: 'power',
        cell: ({ row }) => <span className="font-medium">{formatPower(row.original.power)}</span>,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = BigInt(rowA.original.power);
          const b = BigInt(rowB.original.power);
          return a > b ? 1 : a < b ? -1 : 0;
        },
        meta: {
          align: 'right' as const,
          width: '180px',
        },
      },
      {
        id: 'percentage',
        header: '% of Total',
        accessorKey: 'percentage',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatPercentage(row.original.percentage)}%
          </span>
        ),
        enableSorting: true,
        meta: {
          align: 'right' as const,
          width: '130px',
        },
      },
    ],
    [formatVote, formatVoteClass, formatPower, formatPercentage],
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading all votes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-sm text-muted-foreground">No votes cast yet</div>
        </CardContent>
      </Card>
    );
  }

  // Display votes with sortable table
  return (
    <Card className="pb-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Votes</CardTitle>
          <span className="text-sm text-muted-foreground">
            {votes.length} {votes.length === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden border-t rounded-none">
          <SortableTableGrid
            columns={columns}
            data={votes}
            sorting={sorting}
            onSortingChange={setSorting}
            getRowId={(row) => row.voter}
          />
        </div>
      </CardContent>
    </Card>
  );
}
