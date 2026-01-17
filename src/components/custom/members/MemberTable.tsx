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
import { Member } from '@/lib/voting-modules/types';
import { maxBy } from 'lodash-es';

interface MemberTableProps {
  members: (Member & { percentage: number })[];
  decimals?: number;
}

export function MemberTable({ members, decimals = 6 }: MemberTableProps) {
  const formatVotingPower = (power: string) => {
    try {
      // Convert from Uint128 string to readable format
      const powerNum = BigInt(power);
      const divisor = BigInt(10 ** decimals);
      const wholePart = powerNum / divisor;
      const fractionalPart = powerNum % divisor;

      if (fractionalPart === BigInt(0)) {
        return wholePart.toLocaleString();
      }

      // Format with decimals
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');

      if (trimmedFractional.length === 0) {
        return wholePart.toLocaleString();
      }

      return `${wholePart.toLocaleString()}.${trimmedFractional}`;
    } catch (error) {
      console.error('Error formatting voting power:', error);
      return power;
    }
  };

  const max = maxBy(members, (a) => a.percentage)?.percentage || 100;

  const getPercentageColor = (percentage: number) => {
    // Normalize to 0-1 range, capping at 100%
    const normalized = Math.min(percentage / max, 1);
    // Use CSS custom property to blend between muted-foreground and primary
    // Higher values get more opacity/prominence
    return {
      opacity: 0.7 + normalized * 0.3, // Range from 0.7 to 1
      color: normalized > 0.3 ? 'var(--primary)' : 'var(--muted-foreground)',
      fontWeight: normalized > 0.5 ? 600 : 500,
    };
  };

  const formatPercentage = (percentage: number) => {
    return percentage < 0.001 && percentage > 0 ? '<0.001' : percentage.toFixed(3);
  };

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
                  <AddressLink address={member.address} />
                </TableCell>
                <TableCell className="py-1 text-right font-medium ">
                  {formatVotingPower(member.votingPower)}
                </TableCell>
                <TableCell
                  className="py-1 text-right"
                  style={getPercentageColor(member.percentage)}
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
