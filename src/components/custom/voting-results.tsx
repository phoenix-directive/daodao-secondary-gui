import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Threshold } from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { getPercent, toNumb } from '@/hooks/helpers/helpers';
import { Check, X } from 'lucide-react';

interface VotingResultsProps {
  votes: {
    yes: string;
    no: string;
    abstain: string;
  };
  totalPower: string;
  threshold: Threshold;
}

interface ThresholdDisplayProps {
  threshold: Threshold;
  yesVotes: number;
  noVotes: number;
  turnoutVotes: number;
  totalPower: number;
}

// Absolute Percentage Threshold Component
function AbsolutePercentageThreshold({
  threshold,
  yesVotes,
  noVotes,
  turnoutVotes,
  totalPower,
}: {
  threshold: Threshold;
  yesVotes: number;
  noVotes: number;
  turnoutVotes: number;
  totalPower: number;
}) {
  if (!('absolute_percentage' in threshold)) return null;

  const pct = threshold.absolute_percentage.percentage;
  const totalVotes = yesVotes + noVotes;
  const yesPercent = totalVotes > 0 ? yesVotes / totalPower : 0;

  let displayValue: string;
  let isPassing: boolean;

  if ('percent' in pct) {
    const requiredPercent = +pct.percent;
    displayValue = `${(requiredPercent * 100).toFixed(0)}%`;
    isPassing = yesPercent >= requiredPercent;
  } else if ('majority' in pct) {
    displayValue = '>50%';
    isPassing = yesPercent > 0.5;
  } else {
    displayValue = 'Unknown';
    isPassing = false;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground mb-2">Passing threshold</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{displayValue}</span>
          {isPassing ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
}

// Threshold Quorum Component
function ThresholdQuorumThreshold({
  threshold,
  yesVotes,
  noVotes,
  turnoutVotes,
  totalPower,
}: {
  threshold: Threshold;
  yesVotes: number;
  noVotes: number;
  turnoutVotes: number;
  totalPower: number;
}) {
  if (!('threshold_quorum' in threshold)) return null;

  const quorum = threshold.threshold_quorum.quorum;
  const thresh = threshold.threshold_quorum.threshold;
  const totalVotes = yesVotes + noVotes;
  const yesPercent = totalVotes > 0 ? yesVotes / totalVotes : 0;
  const turnoutPercent = getPercent(turnoutVotes, totalPower);

  // Calculate threshold display and passing status
  let thresholdValue: string;
  let thresholdPassing: boolean;

  if ('percent' in thresh) {
    const requiredPercent = +thresh.percent;
    thresholdValue = `${(requiredPercent * 100).toFixed(0)}%`;
    thresholdPassing = yesPercent >= requiredPercent;
  } else if ('majority' in thresh) {
    thresholdValue = '>50%';
    thresholdPassing = yesPercent > 0.5;
  } else {
    thresholdValue = 'Unknown';
    thresholdPassing = false;
  }

  // Calculate quorum display and passing status
  let quorumValue: string;
  let quorumPassing: boolean;

  if ('percent' in quorum) {
    const requiredPercent = +quorum.percent;
    quorumValue = `${(requiredPercent * 100).toFixed(0)}%`;
    const actualTurnoutPercent = totalPower > 0 ? turnoutVotes / totalPower : 0;
    quorumPassing = actualTurnoutPercent >= requiredPercent;
  } else if ('majority' in quorum) {
    quorumValue = '>50%';
    const actualTurnoutPercent = totalPower > 0 ? turnoutVotes / totalPower : 0;
    quorumPassing = actualTurnoutPercent > 0.5;
  } else {
    quorumValue = 'Unknown';
    quorumPassing = false;
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground mb-2">Passing threshold</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{thresholdValue}</span>
            {thresholdPassing ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <hr />
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{turnoutPercent} turnout</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-foreground/20 transition-all"
            style={{ width: turnoutPercent }}
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground mb-2">Quorum</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{quorumValue}</span>
            {quorumPassing ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Absolute Count Threshold Component
function AbsoluteCountThreshold({
  threshold,
  yesVotes,
}: {
  threshold: Threshold;
  yesVotes: number;
}) {
  if (!('absolute_count' in threshold)) return null;

  const requiredVotes = +threshold.absolute_count.threshold;
  const isPassing = yesVotes >= requiredVotes;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground mb-2">Votes required</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{requiredVotes} votes</span>
          {isPassing ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
}

// Main Threshold Display Component
function ThresholdDisplay({
  threshold,
  yesVotes,
  noVotes,
  turnoutVotes,
  totalPower,
}: ThresholdDisplayProps) {
  if ('absolute_percentage' in threshold) {
    return (
      <AbsolutePercentageThreshold
        threshold={threshold}
        yesVotes={yesVotes}
        noVotes={noVotes}
        turnoutVotes={turnoutVotes}
        totalPower={totalPower}
      />
    );
  }

  if ('threshold_quorum' in threshold) {
    return (
      <ThresholdQuorumThreshold
        threshold={threshold}
        yesVotes={yesVotes}
        noVotes={noVotes}
        turnoutVotes={turnoutVotes}
        totalPower={totalPower}
      />
    );
  }

  if ('absolute_count' in threshold) {
    return <AbsoluteCountThreshold threshold={threshold} yesVotes={yesVotes} />;
  }

  return <div className="text-sm text-muted-foreground">Unknown threshold type</div>;
}

// Main Voting Results Component
export function VotingResults({ votes, totalPower, threshold }: VotingResultsProps) {
  const yes = toNumb(votes.yes);
  const no = toNumb(votes.no);
  const abstain = toNumb(votes.abstain);
  const total = toNumb(totalPower);
  const turnout = yes + no + abstain;

  let yesPercent = getPercent(yes, turnout);
  let noPercent = getPercent(no, turnout);

  let noPercentReal = getPercent(no, no + yes);
  let yesPercentReal = getPercent(yes, no + yes);
  let abstainPercent = getPercent(abstain, turnout);

  console.log('🚀 ~ VotingResults ~ threshold: xxxx', threshold);

  if ('absolute_percentage' in threshold || 'absolute_count' in threshold) {
    yesPercent = getPercent(yes, total);
    noPercent = getPercent(no, total);

    noPercentReal = getPercent(no, total);
    yesPercentReal = getPercent(yes, total);
    abstainPercent = getPercent(abstain, total);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ratio of votes */}
        <div>
          <div className="text-sm text-muted-foreground mb-3">Ratio of votes</div>
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-red-500 font-medium">{noPercent} No</span>
            <span className="text-green-500 font-medium">{yesPercent} Yes</span>
            <span className="text-muted-foreground font-medium">{abstainPercent} Abstain</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-red-500 transition-all" style={{ width: noPercentReal }} />
            <div className="h-full bg-green-500 transition-all" style={{ width: yesPercentReal }} />
          </div>
        </div>

        {/* Threshold Display */}
        <ThresholdDisplay
          threshold={threshold}
          yesVotes={yes}
          noVotes={no}
          turnoutVotes={turnout}
          totalPower={total}
        />
      </CardContent>
    </Card>
  );
}
