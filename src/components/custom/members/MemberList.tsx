/**
 * Component for displaying DAO members with pagination
 * Adapts to different voting module types automatically
 */

import { MemberTable } from '@/components/custom/members/MemberTable';
import { AddressLink } from '@/components/ui/address-link';
import { Button } from '@/components/ui/button';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { calculateMemberPercentages, type MemberWithPercentage } from '@/lib/member-helpers';
import { createVotingModuleAdapter } from '@/lib/voting-modules/adapter-factory';
import { VotingModuleType } from '@/lib/voting-modules/constants';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MemberListCard,
  MemberListEmpty,
  MemberListError,
  MemberListLoading,
  MemberListUnsupported,
} from './member-utils';

interface MemberListProps {
  votingModuleAddress: string;
  title?: string;
}

export function MemberList({ votingModuleAddress, title = 'Members' }: MemberListProps) {
  const chain = useChain(Chain.Terra);
  const [searchParams, setSearchParams] = useSearchParams();

  const [members, setMembers] = useState<MemberWithPercentage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [total, setTotal] = useState<string | null>(null);
  const [votingModuleType, setVotingModuleType] = useState<VotingModuleType | null>(null);
  const [decimals, setDecimals] = useState<number>(6);

  const startAfter = searchParams.get('members_start_after') || undefined;
  const [hasMore, setHasMore] = useState(false);
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [lastAddress, setLastAddress] = useState<string | null>(null);

  // Pagination history - track keys for proper back navigation
  const [paginationHistory, setPaginationHistory] = useState<string[]>([]);
  // Flag to track if we loaded with a deep-linked startAfter param
  const [isDeepLinked, setIsDeepLinked] = useState(false);

  const limit = 30;

  // Detect deep link on mount
  useEffect(() => {
    const initialStartAfter = new URLSearchParams(window.location.search).get(
      'members_start_after',
    );
    if (initialStartAfter) {
      setIsDeepLinked(true);
    }
  }, []);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
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

        // Fetch total and members in parallel
        const [currentTotal, response] = await Promise.all([
          total || adapter.fetchTotal(),
          adapter.fetchMembers(limit, startAfter),
        ]);

        // Memoize total on first load
        if (!total) {
          setTotal(currentTotal);
        }

        // Store decimals from adapter
        setDecimals(response.decimals);

        // Calculate percentages using shared utility
        const membersWithPercentage = calculateMemberPercentages(response.members, currentTotal);

        setMembers(membersWithPercentage);
        setHasMore(response.hasMore);

        // Track next key for pagination (preferred) or last address (fallback)
        if (response.nextKey) {
          setNextKey(response.nextKey);
        } else {
          setNextKey(null);
        }

        // Track last address as fallback for adapters without nextKey support
        if (response.members.length > 0) {
          setLastAddress(response.members[response.members.length - 1].address);
        } else {
          setLastAddress(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch members:', err);
        setError(err.message || 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [votingModuleAddress, chain, startAfter]);

  const goToNextPage = () => {
    // Use nextKey if available, otherwise fallback to lastAddress
    const paginationValue = nextKey || lastAddress;
    if (!paginationValue) return;

    // Add current startAfter to history before moving forward
    if (startAfter && !isDeepLinked) {
      setPaginationHistory((prev) => [...prev, startAfter]);
    }

    const params = new URLSearchParams(searchParams);
    params.set('members_start_after', paginationValue);
    setSearchParams(params);
  };

  const goToPreviousPage = () => {
    const params = new URLSearchParams(searchParams);

    if (paginationHistory.length > 0) {
      // Pop the last address from history
      const newHistory = [...paginationHistory];
      const previousAddress = newHistory.pop();
      setPaginationHistory(newHistory);

      if (previousAddress) {
        params.set('members_start_after', previousAddress);
      } else {
        params.delete('members_start_after');
      }
    } else {
      // No history - go to first page
      params.delete('members_start_after');
      setPaginationHistory([]);
      setIsDeepLinked(false);
    }

    setSearchParams(params);
  };

  const goToFirstPage = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('members_start_after');
    setSearchParams(params);
    setPaginationHistory([]);
    setIsDeepLinked(false);
  };

  if (!isSupported) return <MemberListUnsupported title={title} />;

  if (isLoading && members.length === 0) {
    return <MemberListLoading title={title} />;
  }

  if (error) return <MemberListError title={title} error={error} />;
  if (members.length === 0) return <MemberListEmpty title={title} />;

  return (
    <MemberListCard title={title}>
      <MemberTable members={members} decimals={decimals} />

      {/* Pagination */}
      {(startAfter || hasMore) && (
        <div className="flex items-center justify-between p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={
              isDeepLinked && paginationHistory.length === 0 ? goToFirstPage : goToPreviousPage
            }
            disabled={!startAfter || isLoading}
          >
            {isDeepLinked && paginationHistory.length === 0 ? 'First Page' : 'Previous'}
          </Button>
          {startAfter ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">After:</span>
              {startAfter.startsWith('terra1') ? (
                <AddressLink address={startAfter} />
              ) : (
                <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                  {startAfter}
                </span>
              )}
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
    </MemberListCard>
  );
}
