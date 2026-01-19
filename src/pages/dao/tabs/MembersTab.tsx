import { MemberList } from '@/components/custom/members/MemberList';
import { MemberListAll } from '@/components/custom/members/MemberListAll';
import { Card, CardContent } from '@/components/ui/card';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

export function MembersTab() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value;

  if (!daoData || !daoData.voting_module) {
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

  return <MemberListAll votingModuleAddress={daoData.voting_module} />;
}

