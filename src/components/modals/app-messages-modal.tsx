import { ProposalMessage } from '@/components/custom/proposal-message';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProposalAction } from '@/lib/proposal-drafts';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: ProposalAction[];
  onRemoveAction: (index: number) => void;
  onClearAll: () => void;
  daoAddress: string;
}

export function AppMessagesModal({
  open,
  onOpenChange,
  actions,
  onRemoveAction,
  onClearAll,
  daoAddress,
}: AppMessagesModalProps) {
  const navigate = useNavigate();
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const handleJumpToCreate = () => {
    navigate(`/dao/${daoAddress}/proposals/create`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[80vh] flex flex-col sm:max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>App Messages Added to Draft</DialogTitle>
          <DialogDescription>
            {actions.length} {actions.length === 1 ? 'message has' : 'messages have'} been added to
            your proposal draft
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No messages in draft yet</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedMessages(new Set(actions.map((_, i) => i)))}
                  >
                    Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setExpandedMessages(new Set())}>
                    Collapse All
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  disabled={actions.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
              {actions.map((action, index) => (
                <ProposalMessage
                  key={action.id}
                  message={action.data}
                  index={index}
                  expanded={expandedMessages.has(index)}
                  onToggleExpanded={(isExpanded) => {
                    const newExpanded = new Set(expandedMessages);
                    if (isExpanded) {
                      newExpanded.add(index);
                    } else {
                      newExpanded.delete(index);
                    }
                    setExpandedMessages(newExpanded);
                  }}
                  onRemove={() => onRemoveAction(index)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleJumpToCreate} className="gap-2">
            Jump to Create Proposal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
