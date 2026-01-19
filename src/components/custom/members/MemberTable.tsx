/**
 * Table component for displaying DAO members with their voting power
 */

import { AddressLink } from '@/components/ui/address-link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatPercentage,
  formatVotingPower,
  getPercentageStyle,
  type MemberWithPercentage,
} from '@/lib/member-helpers';
import { maxBy } from 'lodash-es';

interface MemberTableProps {
  members: MemberWithPercentage[];
  decimals?: number;
}

export function MemberTable({ members, decimals = 6 }: MemberTableProps) {
  const max = maxBy(members, (a) => a.percentage)?.percentage || 100;

  return (
    <div className="overflow-hidden border-t rounded-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Address</TableHead>
            <TableHead className="w-48 font-semibold text-right">Voting Power</TableHead>
            <TableHead className="w-32 font-semibold text-right">% of DAO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            return (
              <TableRow
                key={member.address}
                className="transition-colors hover:bg-muted/70 border-b last:border-0"
              >
                <TableCell className="py-1">
                  <AddressLink address={member.address} allowTagging />
                </TableCell>
                <TableCell className="py-1 text-right font-medium ">
                  {formatVotingPower(member.votingPower, decimals)}
                </TableCell>
                <TableCell
                  className="py-1 text-right"
                  style={getPercentageStyle(member.percentage, max)}
                >
                  {formatPercentage(member.percentage)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

