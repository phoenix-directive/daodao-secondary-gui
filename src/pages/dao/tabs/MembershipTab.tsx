/**
 * MembershipTab - Extensible staking/unstaking interface for different voting module types
 * Each voting module type gets its own specific UI for managing membership
 */

import { Card, CardContent } from '@/components/ui/card';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { createVotingModuleAdapter } from '@/lib/voting-modules';
import { VotingModuleType } from '@/lib/voting-modules/constants';
import { Cw721StakingInterface } from '@/pages/dao/tabs/membership/Cw721StakingInterface';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Cw4Interface } from './membership/Cw4Interface';
import { StakingInterface } from './membership/StakingInterface';

export function MembershipTab() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const daoState = useDaoDaoState(daoAddress);
  const chain = useChain(Chain.Terra);
  const daoData = daoState.data.value;

  const [votingModuleType, setVotingModuleType] = useState<VotingModuleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine voting module type
  useEffect(() => {
    const determineType = async () => {
      if (!daoData?.voting_module) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const adapter = await createVotingModuleAdapter(daoData.voting_module, chain);

        if (!adapter) {
          setError('Unsupported voting module type');
          return;
        }

        setVotingModuleType(adapter.getType());
      } catch (err: any) {
        console.error('Failed to determine voting module type:', err);
        setError(err.message || 'Failed to load membership interface');
      } finally {
        setIsLoading(false);
      }
    };

    determineType();
  }, [daoData?.voting_module, chain]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading membership...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No voting module
  if (!daoData?.voting_module) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mb-2 text-lg font-semibold">No Voting Module</h3>
            <p className="text-sm text-muted-foreground">
              This DAO does not have a voting module configured.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render appropriate interface based on voting module type
  switch (votingModuleType) {
    case VotingModuleType.CW20_STAKED:
    case VotingModuleType.TOKEN_STAKED:
    case VotingModuleType.NATIVE_STAKED:
      return <StakingInterface votingModuleAddress={daoData.voting_module} />;

    case VotingModuleType.CW4:
      return <Cw4Interface votingModuleAddress={daoData.voting_module} />;

    // Future voting module types can be added here
    case VotingModuleType.CW721_STAKED:
      return <Cw721StakingInterface votingModuleAddress={daoData.voting_module} />;

    default:
      return (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="mb-2 text-lg font-semibold">Unsupported Voting Module</h3>
              <p className="text-sm text-muted-foreground">
                This voting module type is not supported for membership management.
              </p>
            </div>
          </CardContent>
        </Card>
      );
  }
}
