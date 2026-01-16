import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ACTION_TEMPLATES, ActionCategory, ActionTemplate } from '@/lib/action-templates';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ActionLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ActionTemplate) => void;
}

const CATEGORIES = [
  { id: ActionCategory.TREASURY, name: 'Treasury' },
  { id: ActionCategory.GOVERNANCE, name: 'Governance' },
  { id: ActionCategory.CUSTOM, name: 'Custom' },
] as const;

export function ActionLibraryModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: ActionLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (template: ActionTemplate) => {
    onSelectTemplate(template);
    setSearch('');
    setSelectedIndex(0);
    onOpenChange(false);
  };

  const filteredTemplates = search
    ? ACTION_TEMPLATES.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()),
      )
    : ACTION_TEMPLATES;

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedButtonRef.current) {
      selectedButtonRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredTemplates.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredTemplates.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredTemplates.length) % filteredTemplates.length,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTemplates[selectedIndex]) {
          handleSelect(filteredTemplates[selectedIndex]);
        }
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto !top-[10vh] !translate-y-0">
        <DialogHeader>
          <DialogTitle>Action Library</DialogTitle>
          <DialogDescription>Select an action template to add to your proposal</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="space-y-6">
          {(() => {
            let currentIndex = 0;
            return CATEGORIES.map((category) => {
              const templates = filteredTemplates.filter((t) => t.category === category.id);
              if (templates.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    {category.name}
                  </h3>
                  <div className="space-y-1">
                    {templates.map((template) => {
                      const Icon = template.icon;
                      const itemIndex = currentIndex++;
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <button
                          key={template.id}
                          ref={isSelected ? selectedButtonRef : null}
                          className={`w-full flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent hover:border-primary'
                          }`}
                          onClick={() => handleSelect(template)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{template.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
