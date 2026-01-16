import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ACTION_TEMPLATES, ActionTemplate } from '@/lib/action-templates';
import { cn } from '@/lib/utils';

interface ActionLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ActionTemplate) => void;
}

export function ActionLibraryModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: ActionLibraryModalProps) {
  const categories = [
    { id: 'treasury', name: 'Treasury', description: 'Manage DAO funds' },
    { id: 'governance', name: 'Governance', description: 'Voting and delegation' },
    { id: 'custom', name: 'Custom', description: 'Smart contract execution' },
  ];

  const handleSelect = (template: ActionTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Action Library</DialogTitle>
          <DialogDescription>Select an action template to add to your proposal</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => {
            const templates = ACTION_TEMPLATES.filter((t) => t.category === category.id);
            if (templates.length === 0) return null;

            return (
              <div key={category.id}>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={template.id}
                        variant="outline"
                        className={cn(
                          'h-auto p-4 justify-start items-start text-left',
                          'hover:bg-accent hover:border-primary',
                        )}
                        onClick={() => handleSelect(template)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5 shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mb-1">{template.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
