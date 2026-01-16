import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ProposalAction } from '@/lib/proposal-drafts';
import { ArrowDown, ArrowUp, Copy, X } from 'lucide-react';
import { useState } from 'react';

interface ActionEditorProps {
  action: ProposalAction;
  index: number;
  total: number;
  onUpdate: (action: ProposalAction) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ActionEditor({
  action,
  index,
  total,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: ActionEditorProps) {
  const [jsonString, setJsonString] = useState(() => JSON.stringify(action.data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    setJsonString(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      onUpdate({
        ...action,
        data: parsed,
      });
    } catch (error) {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Action {index + 1}
            {action.type && (
              <span className="text-sm text-muted-foreground ml-2">({action.type})</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Message JSON</label>
          <Textarea
            value={jsonString}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="font-mono text-xs min-h-50"
            placeholder="Enter action message JSON..."
          />
          {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Move Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="gap-2"
          >
            <ArrowDown className="h-4 w-4" />
            Move Down
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
