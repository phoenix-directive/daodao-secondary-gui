import { VoteInfo, VoteResponse } from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';

interface ProposalMembershipData {
  votingPower: string;
  userVote: VoteInfo | null;
}

export const useProposalMembership = (
  address: string | undefined,
  proposalModuleAddress: string,
  votingModuleAddress: string,
  proposalId: number,
  proposalHeight: number,
  allowRevoting: boolean = false,
) => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async (): Promise<ProposalMembershipData | null> => {
    if (!address || !proposalModuleAddress || !votingModuleAddress) {
      return null;
    }

    try {
      // Fetch both voting power and user vote in parallel
      // voting_power_at_height is cached for 1 day (1440 minutes) since it doesn't change at a specific height
      // get_vote is cached for 1 day only if revoting is not enabled
      const [powerResult, voteResult] = await Promise.allSettled([
        chain.read.queryCached<{ power: string; height: number }>(
          votingModuleAddress,
          {
            voting_power_at_height: {
              address,
              height: proposalHeight,
            },
          },
          1440,
        ),
        allowRevoting
          ? chain.read.query<VoteResponse>(proposalModuleAddress, {
              get_vote: {
                proposal_id: proposalId,
                voter: address,
              },
            })
          : chain.read.queryCached<VoteResponse>(
              proposalModuleAddress,
              {
                get_vote: {
                  proposal_id: proposalId,
                  voter: address,
                },
              },
              1440,
            ),
      ]);

      const votingPower = powerResult.status === 'fulfilled' ? powerResult.value.power : '0';
      const userVote = voteResult.status === 'fulfilled' ? voteResult.value.vote || null : null;

      return {
        votingPower,
        userVote,
      };
    } catch (err) {
      console.error('Failed to fetch membership data:', err);
      return null;
    }
  }, [
    address,
    proposalModuleAddress,
    votingModuleAddress,
    proposalId,
    proposalHeight,
    allowRevoting,
    globalReload.value,
  ]);
};
