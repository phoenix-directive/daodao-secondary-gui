/**
 * Cw4Interface - Simple membership display for CW4 voting modules
 * Shows if the connected wallet is a member by checking voting power
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryMsg as Cw4QueryMsg } from '@/daodao/types/contracts/DaoVotingCw4';
import { Chain } from '@/hooks/helpers/assets';
import { forkPromise } from '@/hooks/helpers/helpers';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { useAddress } from '@/hooks/useWallet';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface Cw4InterfaceProps {
  votingModuleAddress: string;
}

export function Cw4Interface({ votingModuleAddress }: Cw4InterfaceProps) {
  const chain = useChain(Chain.Terra);
  const userAddress = useAddress(Chain.Terra);

  // Query voting power and total power
  const membershipSignal = useAsyncSignal(async () => {
    if (!userAddress) {
      return null;
    }

    // Query voting power for the user
    const votingPowerMsg: Cw4QueryMsg = {
      voting_power_at_height: {
        address: userAddress,
      },
    };

    // const votingPowerResponse = await chain.read.query<{
    //   height: number;
    //   power: string;
    // }>(votingModuleAddress, votingPowerMsg);

    // Query total power
    const totalPowerMsg: Cw4QueryMsg = {
      total_power_at_height: {},
    };

    const { votingPowerResponse, totalPowerResponse } = await forkPromise({
      votingPowerResponse: chain.read.query<{
        height: number;
        power: string;
      }>(votingModuleAddress, votingPowerMsg),
      totalPowerResponse: chain.read.query<{
        height: number;
        power: string;
      }>(votingModuleAddress, totalPowerMsg),
    });

    return {
      votingPower: votingPowerResponse.power,
      totalPower: totalPowerResponse.power,
      height: votingPowerResponse.height,
      isMember: BigInt(votingPowerResponse.power) > 0n,
    };
  }, [votingModuleAddress, userAddress, globalReload.value]);

  const membership = membershipSignal.data.value;
  const isLoading = membershipSignal.loading.value;
  const error = membershipSignal.error.value;

  // Calculate voting power percentage
  const votingPowerPercentage =
    membership && BigInt(membership.totalPower) > 0n
      ? (BigInt(membership.votingPower) * 10000n) / BigInt(membership.totalPower) / 100n
      : 0n;
  const percentageDisplay = `${votingPowerPercentage.toString()}${
    Number(votingPowerPercentage) === 0 && membership?.votingPower !== '0' ? '<0.01' : ''
  }%`;

  // No wallet connected
  if (!userAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CW4 Membership</CardTitle>
          <CardDescription>Connect your wallet to check membership status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Please connect your wallet to continue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CW4 Membership</CardTitle>
          <CardDescription>Checking membership status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !membership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CW4 Membership</CardTitle>
          <CardDescription>Failed to load membership status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground">
              {error || 'Failed to query membership information'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CW4 Membership</CardTitle>
        <CardDescription>Your membership status in this DAO</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Membership Status */}
          <div className="flex items-center justify-center py-8">
            {membership.isMember ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-green-600">You are a member</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can participate in this DAO
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    You are not a member
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You cannot participate in this DAO
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Membership Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4 hover:bg-accent/5 transition-colors">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Your Voting Power
              </div>
              <div className="text-2xl font-bold">{membership.votingPower}</div>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:bg-accent/5 transition-colors">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Voting Share
              </div>
              <div className="text-2xl font-bold">{percentageDisplay}</div>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:bg-accent/5 transition-colors">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Total Voting Power
              </div>
              <div className="text-2xl font-bold">{membership.totalPower}</div>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:bg-accent/5 transition-colors">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Block Height
              </div>
              <div className="text-2xl font-bold">{membership.height.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
