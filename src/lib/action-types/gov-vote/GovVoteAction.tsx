import { Vote } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { GovVoteForm } from './GovVoteForm';

// Type definition for Gov Vote message
export type GovVoteMsg = {
  gov: {
    vote: {
      proposal_id: number;
      vote: 'yes' | 'no' | 'abstain' | 'no_with_veto';
    };
  };
};

// Type guard
export const isGovVote = (data: any): data is GovVoteMsg => {
  return data?.gov?.vote !== undefined;
};

// Export the action type configuration
export const GovVoteActionType: ActionType<GovVoteMsg> = {
  id: 'gov_vote',
  name: 'Vote on Governance',
  icon: Vote,
  guard: isGovVote,
  getTitle: () => 'Governance Vote',
  expandable: false,
  FormEditor: GovVoteForm,
};
