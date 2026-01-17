import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vote } from 'lucide-react';
import { ActionType } from '../action-registry';

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
const isGovVote = (data: any): data is GovVoteMsg => {
  return data?.gov?.vote !== undefined;
};

// Form component
function GovVoteForm({
  data,
  onUpdate,
}: {
  data: GovVoteMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const voteData = data.gov.vote;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Proposal ID</Label>
        <Input
          type="number"
          value={voteData.proposal_id}
          onChange={(e) => onUpdate(['gov', 'vote', 'proposal_id'], parseInt(e.target.value) || 0)}
          placeholder="1"
        />
      </div>
      <div className="space-y-2">
        <Label>Vote Option</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={voteData.vote}
          onChange={(e) => onUpdate(['gov', 'vote', 'vote'], e.target.value)}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="abstain">Abstain</option>
          <option value="no_with_veto">No With Veto</option>
        </select>
      </div>
    </div>
  );
}

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
