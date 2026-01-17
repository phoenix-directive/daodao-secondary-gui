import { ProposalList } from '@/components/custom/proposals/ProposalList';
import { Card, CardContent } from '@/components/ui/card';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export function ProposalsTab() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value;

  const enabledProposalModules = useMemo(() => {
    return (daoData?.proposal_modules || []).filter((m) => m.status === 'enabled');
  }, [daoData]);

  if (!daoData || enabledProposalModules.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mb-2 text-lg font-semibold">No Proposal Module</h3>
            <p className="text-sm text-muted-foreground">
              This DAO does not have any enabled proposal modules.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getModuleTitle = (prefix: string) => {
    if (prefix === 'A') return 'Single Choice Proposals';
    if (prefix === 'B') return 'Multiple Choice Proposals';
    return `${prefix} Proposals`;
  };

  // Check if Module A exists
  const hasModuleA = enabledProposalModules.some((m) => m.prefix === 'A');

  return (
    <div className="space-y-6">
      {/* Render a ProposalList for each enabled proposal module */}
      {enabledProposalModules.map((module) => (
        <ProposalList
          key={module.address}
          proposalModuleAddress={module.address}
          prefix={module.prefix}
          title={getModuleTitle(module.prefix)}
          hideIfEmpty={module.prefix === 'B' && hasModuleA}
        />
      ))}
    </div>
  );
}
