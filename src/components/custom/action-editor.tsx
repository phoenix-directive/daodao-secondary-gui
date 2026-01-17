import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { actionRegistry } from '@/lib/action-types';
import { ProposalAction } from '@/lib/proposal-drafts';
import { ArrowDown, ArrowUp, Code2, Copy, Eye, Plus, X } from 'lucide-react';
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
  onAddActionAfter: () => void;
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
  onAddActionAfter,
}: ActionEditorProps) {
  const [jsonString, setJsonString] = useState(() => JSON.stringify(action.data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');

  // Find the matching action type from the registry
  const actionType = actionRegistry.match(action.data);
  const messageInfo = actionRegistry.detectMessageType(action.data);

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

  const updateField = (path: string[], value: any) => {
    const updated = JSON.parse(JSON.stringify(action.data));
    let current = updated;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    console.log('🚀 ~ updateField ~ current:', current);
    onUpdate({ ...action, data: updated });
    const newJson = JSON.stringify(updated, null, 2);
    setJsonString(newJson);
    console.log('🚀 ~ updateField ~ current:', newJson);
  };

  const updateMultiField = (updates: Array<{ path: string[]; value: any }>) => {
    const updated = JSON.parse(JSON.stringify(action.data));

    // Apply all updates to the cloned object
    for (const { path, value } of updates) {
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }

    onUpdate({ ...action, data: updated });
    const newJson = JSON.stringify(updated, null, 2);
    setJsonString(newJson);
  };

  const renderFormEditor = () => {
    // If we found a matching action type, use its FormEditor
    if (actionType) {
      const FormEditor = actionType.FormEditor;
      return (
        <FormEditor data={action.data} onUpdate={updateField} onUpdateMulti={updateMultiField} />
      );
    }

    // Unknown message type - show notice to use JSON tab
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>This message type doesn't have a form editor yet.</p>
        <p className="text-sm mt-1">Use the JSON tab to edit this message.</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Action {index + 1}
            <span className="text-sm text-muted-foreground ml-2">({messageInfo.name})</span>
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
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'form' | 'json')}
          className="gap-3"
        >
          <TabsList size="sm">
            <TabsTrigger value="form" className="gap-2" size="sm">
              <Eye className="h-4 w-4" />
              Form
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2" size="sm">
              <Code2 className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">{renderFormEditor()}</TabsContent>

          <TabsContent value="json">
            <div className="space-y-2">
              <Textarea
                value={jsonString}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="font-mono text-xs min-h-[300px]"
                placeholder="Enter action message JSON..."
              />
              {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t">
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
        <Button variant="outline" size="sm" onClick={onAddActionAfter} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Action
        </Button>
      </CardFooter>
    </Card>
  );
}
