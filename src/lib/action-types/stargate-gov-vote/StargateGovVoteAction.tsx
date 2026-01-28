import { decodeStargateMessage } from '@/daodao/protobuf/utils';
import { Vote } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { StargateActionWithDecoded } from '../stargate-helpers';
import { StargateGovVoteForm } from './StargateGovVoteForm';

// Type definition for the decoded value
export type StargateGovVoteValue = {
  proposalId: string;
  voter: string;
  option: number;
};

// Type definition for Stargate Gov Vote message (use the base type for consistency)
export type StargateGovVoteMsg = StargateActionWithDecoded<StargateGovVoteValue>;

// Type guard with automatic base64 decoding for both v1beta1 and v1
export const isStargateGovVote = (data: any): data is StargateGovVoteMsg => {
  if (!data?.stargate) {
    return false;
  }

  const stargate = data.stargate;
  const typeUrl = stargate.type_url || stargate.typeUrl;

  // Check if it's one of the gov vote types
  if (typeUrl !== '/cosmos.gov.v1beta1.MsgVote' && typeUrl !== '/cosmos.gov.v1.MsgVote') {
    return false;
  }

  // Decode base64 value if needed and not already decoded
  if (typeof stargate.value === 'string' && !stargate._decoded) {
    try {
      const temp = {
        stargate: {
          type_url: typeUrl,
          value: stargate.value,
        },
      };
      const decoded = decodeStargateMessage(temp);
      stargate._decoded = decoded.stargate.value;
    } catch (error) {
      console.error('Failed to decode stargate gov vote message:', error);
      return false;
    }
  }

  // Get the value to validate
  const valueToValidate = stargate._decoded || stargate.value;

  // Validate value structure
  return (
    typeof valueToValidate === 'object' &&
    valueToValidate !== null &&
    'proposalId' in valueToValidate &&
    'option' in valueToValidate
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
