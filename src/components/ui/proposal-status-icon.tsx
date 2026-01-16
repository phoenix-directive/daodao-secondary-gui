import { Status } from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface ProposalStatusIconProps {
  status: Status;
  showLabel?: boolean;
  className?: string;
}

export function ProposalStatusIcon({
  status,
  showLabel = false,
  className = '',
}: ProposalStatusIconProps) {
  const getStatusInfo = (status: Status) => {
    if (status === 'open') {
      return { icon: <Clock className="h-4 w-4 text-blue-600" />, label: 'Open' };
    }
    if (status === 'executed') {
      return { icon: <CheckCircle className="h-4 w-4 text-green-600" />, label: 'Executed' };
    }
    if (status === 'passed') {
      return { icon: <CheckCircle className="h-4 w-4 text-blue-600" />, label: 'Passed' };
    }
    if (status === 'rejected') {
      return { icon: <XCircle className="h-4 w-4 text-red-600" />, label: 'Rejected' };
    }
    if (status === 'closed') {
      return { icon: <XCircle className="h-4 w-4 text-gray-500" />, label: 'Closed' };
    }
    if (status === 'execution_failed') {
      return { icon: <AlertCircle className="h-4 w-4 text-red-600" />, label: 'Execution Failed' };
    }
    if (status === 'vetoed') {
      return { icon: <XCircle className="h-4 w-4 text-red-600" />, label: 'Vetoed' };
    }
    if (typeof status === 'object' && 'veto_timelock' in status) {
      return { icon: <Clock className="h-4 w-4 text-gray-500" />, label: 'Veto Timelock' };
    }
    return { icon: <AlertCircle className="h-4 w-4 text-gray-500" />, label: String(status) };
  };

  const statusInfo = getStatusInfo(status);

  if (showLabel) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>{statusInfo.icon}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
