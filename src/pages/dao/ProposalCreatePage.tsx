import { ActionEditor } from '@/components/custom/action-editor';
import { ActionLibraryModal } from '@/components/custom/action-library-modal';
import { ProposalPreview } from '@/components/custom/proposal-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionTemplate } from '@/lib/action-templates';
import {
  clearDraft,
  getEmptyDraft,
  loadDraft,
  ProposalAction,
  ProposalDraft,
  saveDraft,
} from '@/lib/proposal-drafts';
import { ProposalFormProvider } from '@/lib/proposal-form-context';
import { ArrowLeft, Eye, FileText, Library, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function ProposalCreatePage() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [draft, setDraft] = useState<ProposalDraft>(() => {
    if (daoAddress) {
      return loadDraft(daoAddress) || getEmptyDraft();
    }
    return getEmptyDraft();
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (daoAddress) {
      const timeoutId = setTimeout(() => {
        saveDraft(daoAddress, draft);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [daoAddress, draft]);

  const updateDraft = (updates: Partial<ProposalDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const addAction = (template?: ActionTemplate) => {
    const newAction: ProposalAction = {
      id: crypto.randomUUID(),
      data: template?.defaultData || {},
    };
    updateDraft({ actions: [...draft.actions, newAction] });
  };

  const updateAction = (index: number, action: ProposalAction) => {
    const newActions = [...draft.actions];
    newActions[index] = action;
    updateDraft({ actions: newActions });
  };

  const removeAction = (index: number) => {
    const newActions = draft.actions.filter((_, i) => i !== index);
    updateDraft({ actions: newActions });
  };

  const duplicateAction = (index: number) => {
    const actionToDuplicate = draft.actions[index];
    const newAction: ProposalAction = {
      ...JSON.parse(JSON.stringify(actionToDuplicate)),
      id: crypto.randomUUID(),
    };
    const newActions = [...draft.actions];
    newActions.splice(index + 1, 0, newAction);
    updateDraft({ actions: newActions });
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === draft.actions.length - 1)
    ) {
      return;
    }

    const newActions = [...draft.actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
    updateDraft({ actions: newActions });
  };

  const handlePublish = async () => {
    if (!draft.title.trim()) {
      toast.error('Please enter a proposal title');
      return;
    }

    setIsPublishing(true);
    try {
      // TODO: Implement actual proposal submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('Proposal published successfully!');
      if (daoAddress) {
        clearDraft(daoAddress);
      }
      navigate(`/dao/${daoAddress}/proposals`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish proposal');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear this draft? This cannot be undone.')) {
      setDraft(getEmptyDraft());
      if (daoAddress) {
        clearDraft(daoAddress);
      }
      toast.success('Draft cleared');
    }
  };

  return (
    <ProposalFormProvider daoAddress={daoAddress || ''}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="gap-2 mb-4"
            onClick={() => navigate(`/dao/${daoAddress}/proposals`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Proposals
          </Button>
          <h1 className="text-3xl font-bold">Create Proposal</h1>
          <p className="text-muted-foreground mt-2">Draft is automatically saved to your browser</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
          <TabsList size="sm">
            <TabsTrigger value="edit" className="gap-2" size="sm">
              <FileText className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2" size="sm">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-0 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  placeholder="Enter proposal title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <MarkdownEditor
                  value={draft.description}
                  onChange={(value) => updateDraft({ description: value })}
                  placeholder="Enter proposal description (supports Markdown)..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Proposal Type</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="single"
                      name="proposalType"
                      value="single"
                      checked={draft.proposalType === 'single'}
                      onChange={(e) =>
                        updateDraft({ proposalType: e.target.value as 'single' | 'multiple' })
                      }
                    />
                    <Label htmlFor="single" className="cursor-pointer font-normal">
                      Single Choice (A)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="multiple"
                      name="proposalType"
                      value="multiple"
                      checked={draft.proposalType === 'multiple'}
                      onChange={(e) =>
                        updateDraft({ proposalType: e.target.value as 'single' | 'multiple' })
                      }
                      disabled
                    />
                    <Label
                      htmlFor="multiple"
                      className="cursor-not-allowed font-normal text-muted-foreground"
                    >
                      Multiple Choice (B) - Coming Soon
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Actions ({draft.actions.length})</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsLibraryOpen(true)}
              >
                <Library className="h-4 w-4" />
                Action Library
              </Button>
            </div>

            {draft.actions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No actions added yet</p>
                  <Button variant="outline" onClick={() => setIsLibraryOpen(true)}>
                    Browse Action Library
                  </Button>
                </CardContent>
              </Card>
            ) : (
              draft.actions.map((action, index) => (
                <ActionEditor
                  key={action.id}
                  action={action}
                  index={index}
                  total={draft.actions.length}
                  onUpdate={(updated) => updateAction(index, updated)}
                  onRemove={() => removeAction(index)}
                  onDuplicate={() => duplicateAction(index)}
                  onMoveUp={() => moveAction(index, 'up')}
                  onMoveDown={() => moveAction(index, 'down')}
                />
              ))
            )}
          </div>

          {/* Publish Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleClearDraft}>
              Clear Draft
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Proposal'
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <ProposalPreview
            title={draft.title}
            description={draft.description}
            actions={draft.actions.map((a) => a.data)}
          />

          <div className="mt-6 flex justify-end">
            <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Proposal'
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <ActionLibraryModal
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onSelectTemplate={(template) => addAction(template)}
      />
      </div>
    </ProposalFormProvider>
  );
}
