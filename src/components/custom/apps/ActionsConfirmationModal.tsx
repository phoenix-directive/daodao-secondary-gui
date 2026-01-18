import { ProposalMessage } from '@/components/custom/proposal-message';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProposalAction } from '@/lib/proposal-drafts';

interface ActionsConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: ProposalAction[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionsConfirmationModal({
  open,
  onOpenChange,
  actions,
  onConfirm,
  onCancel,
}: ActionsConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Actions to Proposal</DialogTitle>
          <DialogDescription>
            The app wants to add {actions.length} {actions.length === 1 ? 'action' : 'actions'} to
            your proposal. Review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {actions.map((action, index) => (
            <ProposalMessage
              key={action.id}
              message={action.data}
              expanded={true}
              onToggleExpanded={() => {}}
            />
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Add to Proposal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
