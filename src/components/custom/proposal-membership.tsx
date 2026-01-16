import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Config,
  ProposalResponse,
  ExecuteMsg as SingleExecuteMsg,
} from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { Chain } from '@/hooks/helpers/assets';
import { getPercent, toNumb } from '@/hooks/helpers/helpers';
import { useProposalMembership } from '@/hooks/useProposalMembership';
import { useTx } from '@/hooks/useTx';
import { useAddress } from '@/hooks/useWallet';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProposalMembershipProps {
  proposal: ProposalResponse;
  proposalModuleAddress: string;
  votingModuleAddress: string;
  config: Config | null;
  onVoteSuccess?: () => void;
}

export function ProposalMembership({
  proposal,
  proposalModuleAddress,
  votingModuleAddress,
  config,
  onVoteSuccess,
}: ProposalMembershipProps) {
  const address = useAddress(Chain.Terra);
  const [isProcessing, setIsProcessing] = useState(false);

  const membershipData = useProposalMembership(
    address,
    proposalModuleAddress,
    votingModuleAddress,
    proposal.id,
    proposal.proposal.start_height,
    config?.allow_revoting ?? false,
  );

  const status = proposal.proposal.status;
  const totalPower = toNumb(proposal.proposal.total_power);
  const votingPower = membershipData.data.value?.votingPower || '0';
  const userVote = membershipData.data.value?.userVote || null;
  const isLoading = membershipData.loading.value;

  // Memoized messages
  const voteYesMessages = useMemo(
    () =>
      address
        ? [
            new MsgExecuteContract({
              sender: address,
              contract: proposalModuleAddress,
              msg: {
                vote: {
                  proposal_id: proposal.id,
                  vote: 'yes',
                },
              } as SingleExecuteMsg,
            }),
          ]
        : [],
    [address, proposalModuleAddress, proposal.id],
  );

  const voteNoMessages = useMemo(
    () =>
      address
        ? [
            new MsgExecuteContract({
              sender: address,
              contract: proposalModuleAddress,
              msg: {
                vote: {
                  proposal_id: proposal.id,
                  vote: 'no',
                },
              } as SingleExecuteMsg,
            }),
          ]
        : [],
    [address, proposalModuleAddress, proposal.id],
  );

  const voteAbstainMessages = useMemo(
    () =>
      address
        ? [
            new MsgExecuteContract({
              sender: address,
              contract: proposalModuleAddress,
              msg: {
                vote: {
                  proposal_id: proposal.id,
                  vote: 'abstain',
                },
              } as SingleExecuteMsg,
            }),
          ]
        : [],
    [address, proposalModuleAddress, proposal.id],
  );

  const executeMessages = useMemo(
    () =>
      address
        ? [
            new MsgExecuteContract({
              sender: address,
              contract: proposalModuleAddress,
              msg: {
                execute: {
                  proposal_id: proposal.id,
                },
              } as SingleExecuteMsg,
            }),
          ]
        : [],
    [address, proposalModuleAddress, proposal.id],
  );

  // Transaction hooks
  const voteYesTx = useTx(voteYesMessages, {
    title: 'Vote Yes',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      setIsProcessing(false);
      onVoteSuccess?.();
    },
    onTxError: () => {
      setIsProcessing(false);
    },
  });

  const voteNoTx = useTx(voteNoMessages, {
    title: 'Vote No',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      setIsProcessing(false);
      onVoteSuccess?.();
    },
    onTxError: () => {
      setIsProcessing(false);
    },
  });

  const voteAbstainTx = useTx(voteAbstainMessages, {
    title: 'Vote Abstain',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      setIsProcessing(false);
      onVoteSuccess?.();
    },
    onTxError: () => {
      setIsProcessing(false);
    },
  });

  const executeTx = useTx(executeMessages, {
    title: 'Execute Proposal',
    chainId: Chain.Terra,
    onTxSuccess: () => {
      setIsProcessing(false);
      onVoteSuccess?.();
    },
    onTxError: () => {
      setIsProcessing(false);
    },
  });

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const power = toNumb(votingPower || '0');
  const powerPercent = getPercent(power, totalPower);
  const canVote = status === 'open' && power > 0;
  const hasVoted = userVote !== null;
  const canRevote = config?.allow_revoting ?? false;
  const canExecute =
    status === 'passed' && power > 0 && proposal.proposal.msgs && proposal.proposal.msgs.length > 0;

  const getVoteIcon = (vote: string) => {
    if (vote === 'yes') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (vote === 'no') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (vote === 'abstain') {
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
    return null;
  };

  const getVoteText = (vote: string) => {
    return vote.charAt(0).toUpperCase() + vote.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Membership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Voting Power */}
        {power > 0 && (
          <div className="flex justify-between">
            <div className="text-sm font-medium text-muted-foreground mb-1">Voting Power</div>
            <div className="text-sm">{powerPercent}</div>
          </div>
        )}

        {/* User Vote */}
        {hasVoted && userVote && (
          <div className="flex justify-between">
            <div className="text-sm font-medium text-muted-foreground mb-1">Your Vote</div>
            <div className="flex items-center gap-2 text-sm">
              <span>{getVoteText(userVote.vote)}</span>
              {getVoteIcon(userVote.vote)}
            </div>
          </div>
        )}

        {/* Voting Buttons */}
        {canVote && (!hasVoted || canRevote) && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Cast Your Vote</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                onClick={() => {
                  setIsProcessing(true);
                  voteYesTx.broadcast();
                }}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                onClick={() => {
                  setIsProcessing(true);
                  voteNoTx.broadcast();
                }}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'No'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsProcessing(true);
                  voteAbstainTx.broadcast();
                }}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abstain'}
              </Button>
            </div>
            {hasVoted && canRevote && (
              <p className="text-xs text-muted-foreground mt-2">Revoting is enabled</p>
            )}
          </div>
        )}

        {/* Execute Button */}
        {canExecute && (
          <div>
            <Button
              className="w-full"
              onClick={() => {
                setIsProcessing(true);
                executeTx.broadcast();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executing...
                </>
              ) : (
                'Execute Proposal'
              )}
            </Button>
          </div>
        )}

        {/* No power message */}
        {power === 0 && (
          <div className="text-sm text-muted-foreground">
            You don't have voting power for this proposal.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
