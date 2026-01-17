import { ProposalStatusIcon } from '@/components/ui/proposal-status-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProposalResponse } from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { fromUnixNano } from '@/hooks/helpers/helpers';
import { useNavigate, useParams } from 'react-router-dom';

interface ProposalTableProps {
  proposals: ProposalResponse[];
  prefix: string;
}

export function ProposalTable({ proposals, prefix }: ProposalTableProps) {
  const { address: daoAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();

  const getExpirationDate = (expiration: any) => {
    if (!expiration) return 'Unknown';
    if ('at_time' in expiration) {
      try {
        const date = fromUnixNano(+expiration.at_time);
        const now = new Date();
        const isCurrentMonth =
          date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        if (isCurrentMonth) {
          // Show "9. Januar" for current month
          return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        } else {
          // Show "November 2025" for other months
          return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        }
      } catch {
        return 'Invalid';
      }
    }
    if ('at_height' in expiration) {
      return `Block ${expiration.at_height}`;
    }
    if ('never' in expiration) {
      return 'Never';
    }
    return 'Unknown';
  };

  return (
    <div className="overflow-hidden border-t rounded-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-24 font-semibold">ID</TableHead>
            <TableHead className="w-12 font-semibold"></TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="w-32 font-semibold text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => {
            return (
              <TableRow
                key={proposal.id}
                className="cursor-pointer transition-colors hover:bg-muted/70 border-b last:border-0"
                onClick={() => navigate(`/dao/${daoAddress}/proposals/${prefix}${proposal.id}`)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  {prefix}-{proposal.id.toString().padStart(5, '0')}
                </TableCell>
                <TableCell className="w-12">
                  <ProposalStatusIcon status={proposal.proposal.status} />
                </TableCell>
                <TableCell>
                  <span className="font-medium line-clamp-1">{proposal.proposal.title}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground text-right">
                  {getExpirationDate(proposal.proposal.expiration)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
