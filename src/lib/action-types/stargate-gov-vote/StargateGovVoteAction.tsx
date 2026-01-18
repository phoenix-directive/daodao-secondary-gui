import { Vote } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { StargateGovVoteForm } from './StargateGovVoteForm';

// Type definition for Stargate Gov Vote message
export type StargateGovVoteMsg = {
  stargate: {
    typeUrl: '/cosmos.gov.v1beta1.MsgVote' | '/cosmos.gov.v1.MsgVote';
    value: {
      proposalId: string;
      voter: string;
      option: number;
    };
  };
};

// Type guard
export const isStargateGovVote = (data: any): data is StargateGovVoteMsg => {
  return (
    data?.stargate?.typeUrl === '/cosmos.gov.v1beta1.MsgVote' ||
    data?.stargate?.typeUrl === '/cosmos.gov.v1.MsgVote'
  );
};

// Export the action type configuration
export const StargateGovVoteActionType: ActionType<StargateGovVoteMsg> = {
  id: 'gov_vote_stargate',
  name: 'Vote on Governance (Stargate)',
  icon: Vote,
  guard: isStargateGovVote,
  getTitle: () => 'Governance Vote (Stargate)',
  expandable: false,
  FormEditor: StargateGovVoteForm,
};
