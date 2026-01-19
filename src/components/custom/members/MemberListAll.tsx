/**
 * Component for displaying ALL DAO members with sortable table
 * Uses fetchMembersAll to load all members at once
 * Auto-sorted by voting power descending
 */

import { AddressLink } from '@/components/ui/address-link';
import SortableTableGrid from '@/components/ui/sortable-table-grid';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import {
  calculateMemberPercentages,
  formatPercentage,
  formatVotingPower,
  getPercentageStyle,
  type MemberWithPercentage,
} from '@/lib/member-helpers';
import { createVotingModuleAdapter } from '@/lib/voting-modules/adapter-factory';
import { VotingModuleType } from '@/lib/voting-modules/constants';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  MemberListCard,
  MemberListEmpty,
  MemberListError,
  MemberListLoading,
  MemberListUnsupported,
} from './member-utils';

interface MemberListAllProps {
  votingModuleAddress: string;
  title?: string;
}

function MemberListAllComponent({ votingModuleAddress, title = 'Members' }: MemberListAllProps) {
  const chain = useChain(Chain.Terra);

  const [members, setMembers] = useState<MemberWithPercentage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [total, setTotal] = useState<string | null>(null);
  const [votingModuleType, setVotingModuleType] = useState<VotingModuleType | null>(null);
  const [decimals, setDecimals] = useState<number>(6);

  // Sorting state - default to voting power descending
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'votingPower',
      desc: true,
    },
  ]);

  // // 🐛 DEBUG: Track what causes rerenders
  // useWhyDidYouUpdate('MemberListAll', {
  //   votingModuleAddress,
  //   title,
  //   chain,
  //   members,
  //   isLoading,
  //   error,
  //   isSupported,
  //   total,
  //   votingModuleType,
  //   decimals,
  //   sorting,
  // });

  // Fetch all members
  useEffect(() => {
    const fetchAllMembers = async () => {
      if (!votingModuleAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        // Create adapter for this voting module
        const adapter = await createVotingModuleAdapter(votingModuleAddress, chain);

        if (!adapter) {
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        // Store voting module type
        setVotingModuleType(adapter.getType());

        // Fetch total and all members in parallel
        const [currentTotal, response] = await Promise.all([
          adapter.fetchTotal(),
          adapter.fetchMembersAll(), // Use 30 per page for fetching
        ]);

        setTotal(currentTotal);
        setDecimals(response.decimals);

        // Calculate percentages using shared utility
        const membersWithPercentage = calculateMemberPercentages(response.members, currentTotal);

        setMembers(membersWithPercentage.filter((a) => a.percentage > 0));
      } catch (err: any) {
        console.error('Failed to fetch members:', err);
        setError(err.message || 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMembers();
  }, [votingModuleAddress, chain]);

  // Find max percentage for coloring
  const maxPercentage = useMemo(() => {
    return Math.max(...members.map((m) => m.percentage), 100);
  }, [members]);

  // Define columns for the sortable table
  const columns = useMemo<ColumnDef<MemberWithPercentage>[]>(
    () => [
      {
        id: 'address',
        header: 'Address',
        accessorKey: 'address',
        cell: ({ row }) => <AddressLink address={row.original.address} allowTagging />,
        enableSorting: true,
      },
      {
        id: 'votingPower',
        header: 'Voting Power',
        accessorKey: 'votingPower',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatVotingPower(row.original.votingPower, decimals)}
          </span>
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = BigInt(rowA.original.votingPower);
          const b = BigInt(rowB.original.votingPower);
          return a > b ? 1 : a < b ? -1 : 0;
        },
        meta: {
          align: 'right' as const,
          width: '200px',
        },
      },
      {
        id: 'percentage',
        header: '% of DAO',
        accessorKey: 'percentage',
        cell: ({ row }) => (
          <span style={getPercentageStyle(row.original.percentage, maxPercentage)}>
            {formatPercentage(row.original.percentage)}%
          </span>
        ),
        enableSorting: true,
        meta: {
          align: 'right' as const,
          width: '150px',
        },
      },
    ],
    [decimals, maxPercentage],
  );

  if (!isSupported) return <MemberListUnsupported title={title} />;
  if (isLoading) return <MemberListLoading title={title} message="Loading all members..." />;
  if (error) return <MemberListError title={title} error={error} />;
  if (members.length === 0) return <MemberListEmpty title={title} />;

  return (
    <MemberListCard title={title} memberCount={members.length}>
      <div className="overflow-hidden">
        <SortableTableGrid
          columns={columns}
          data={members}
          sorting={sorting}
          onSortingChange={setSorting}
          getRowId={(row) => row.address}
          // rowClassName="transition-colors hover:bg-muted/70 border-b last:border-0"
          // headerClassName="hover:bg-muted/50"
        />
      </div>
    </MemberListCard>
  );
}

export const MemberListAll = memo(MemberListAllComponent);
