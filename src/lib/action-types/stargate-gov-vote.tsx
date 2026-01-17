import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vote } from 'lucide-react';
import { ActionType } from '../action-registry';

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
const isStargateGovVote = (data: any): data is StargateGovVoteMsg => {
  return (
    data?.stargate?.typeUrl === '/cosmos.gov.v1beta1.MsgVote' ||
    data?.stargate?.typeUrl === '/cosmos.gov.v1.MsgVote'
  );
};

// Form component
function StargateGovVoteForm({
  data,
  onUpdate,
}: {
  data: StargateGovVoteMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const value = data.stargate.value;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voter</Label>
        <Input
          value={value.voter || ''}
          onChange={(e) => onUpdate(['stargate', 'value', 'voter'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Proposal ID</Label>
        <Input
          value={value.proposalId || ''}
          onChange={(e) => onUpdate(['stargate', 'value', 'proposalId'], e.target.value)}
          placeholder="1"
        />
      </div>
      <div className="space-y-2">
        <Label>Vote Option</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value.option || 1}
          onChange={(e) => onUpdate(['stargate', 'value', 'option'], parseInt(e.target.value))}
        >
          <option value={1}>Yes</option>
          <option value={2}>Abstain</option>
          <option value={3}>No</option>
          <option value={4}>No With Veto</option>
        </select>
      </div>
    </div>
  );
}

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
