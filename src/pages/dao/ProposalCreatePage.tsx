import { ActionEditor } from '@/components/custom/action-editor';
import { ActionLibraryModal } from '@/components/custom/action-library-modal';
import { DappComponent } from '@/components/custom/apps';
import { ProposalPreview } from '@/components/custom/proposal-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { ActionCategory, ActionTemplate } from '@/lib/action-templates';
import {
  clearDraft,
  getEmptyDraft,
  loadDraft,
  ProposalAction,
  ProposalChoice,
  ProposalDraft,
  saveDraft,
} from '@/lib/proposal-drafts';
import { ProposalFormProvider } from '@/lib/proposal-form-context';
import { ArrowLeft, Eye, FileText, Library, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export function ProposalCreatePage() {
  const { address: daoAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [activeChoiceIndex, setActiveChoiceIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProposalDraft>(() => {
    if (daoAddress) {
      const loadedDraft = loadDraft(daoAddress) || getEmptyDraft();
      // Override proposal type from query param if present
      const typeParam = new URLSearchParams(window.location.search).get('type');
      if (typeParam === 'A' || typeParam === 'single') {
        loadedDraft.proposalType = 'single';
      } else if (typeParam === 'B' || typeParam === 'multiple') {
        loadedDraft.proposalType = 'multiple';
      }
      return loadedDraft;
    }
    return getEmptyDraft();
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // App fullscreen state
  const [appFullscreen, setAppFullscreen] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [pendingAppInsertIndex, setPendingAppInsertIndex] = useState<number | null>(null);
  const [pendingAppChoiceIndex, setPendingAppChoiceIndex] = useState<number | null>(null);

  // Fetch DAO state to check available proposal modules
  const daoState = useDaoDaoState(daoAddress);

  // Handle messages from DappComponent
  const handleAppMessages = (_chainId: string, _sender: string, msgs: UnifiedCosmosMsg[]) => {
    // Convert messages to actions
    const newActions: ProposalAction[] = msgs.map((msg) => ({
      id: crypto.randomUUID(),
      data: msg,
    }));

    // Insert actions based on context
    if (draft.proposalType === 'single') {
      if (pendingAppInsertIndex !== null) {
        // Insert after specific index
        const updatedActions = [...draft.actions];
        updatedActions.splice(pendingAppInsertIndex + 1, 0, ...newActions);
        updateDraft({ actions: updatedActions });
      } else {
        // Append to end
        updateDraft({ actions: [...draft.actions, ...newActions] });
      }
    } else if (pendingAppChoiceIndex !== null) {
      // Add to specific choice
      const newChoices = [...draft.choices];
      newChoices[pendingAppChoiceIndex].actions = [
        ...newChoices[pendingAppChoiceIndex].actions,
        ...newActions,
      ];
      updateDraft({ choices: newChoices });
    }

    // Close fullscreen and clear state
    setAppFullscreen(false);
    setPendingAppInsertIndex(null);
    setPendingAppChoiceIndex(null);
    toast.success(`Added ${newActions.length} action${newActions.length > 1 ? 's' : ''} from ${appName}`);
  };

  // Handle closing app without messages
  const handleAppClose = () => {
    setAppFullscreen(false);
    setPendingAppInsertIndex(null);
    setPendingAppChoiceIndex(null);
  };

  // Get available proposal types from computed data
  const availableProposalTypes = daoState.data.value?._computed.availableProposalTypes || {
    single: false,
    multiple: false,
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    if (daoAddress) {
      const timeoutId = setTimeout(() => {
        saveDraft(daoAddress, draft);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [daoAddress, draft]);

  // Handle duplicate query param
  useEffect(() => {
    const duplicateParam = searchParams.get('duplicate');
    if (duplicateParam && daoAddress) {
      try {
        const duplicateData = JSON.parse(decodeURIComponent(duplicateParam));
        setDraft({
          title: `Copy of ${duplicateData.title}`,
          description: duplicateData.description,
          proposalType: duplicateData.proposalType,
          actions: duplicateData.actions,
          choices: duplicateData.choices,
          lastModified: Date.now(),
        });
        toast.success('Proposal duplicated successfully');
      } catch (error) {
        console.error('Failed to parse duplicate data:', error);
        toast.error('Failed to duplicate proposal');
      }
      // Remove the query param after applying
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('duplicate');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, daoAddress, setSearchParams]);

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

  const insertActionAfter = (index: number, template?: ActionTemplate) => {
    const newAction: ProposalAction = {
      id: crypto.randomUUID(),
      data: template?.defaultData || {},
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

  // Choice management functions for multiple choice proposals
  const addChoice = () => {
    const newChoice: ProposalChoice = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      actions: [],
    };
    updateDraft({ choices: [...draft.choices, newChoice] });
  };

  const updateChoice = (index: number, updates: Partial<ProposalChoice>) => {
    const newChoices = [...draft.choices];
    newChoices[index] = { ...newChoices[index], ...updates };
    updateDraft({ choices: newChoices });
  };

  const removeChoice = (index: number) => {
    const newChoices = draft.choices.filter((_, i) => i !== index);
    updateDraft({ choices: newChoices });
  };

  const addChoiceAction = (choiceIndex: number, template?: ActionTemplate) => {
    const newAction: ProposalAction = {
      id: crypto.randomUUID(),
      data: template?.defaultData || {},
    };
    const newChoices = [...draft.choices];
    newChoices[choiceIndex].actions = [...newChoices[choiceIndex].actions, newAction];
    updateDraft({ choices: newChoices });
  };

  const updateChoiceAction = (choiceIndex: number, actionIndex: number, action: ProposalAction) => {
    const newChoices = [...draft.choices];
    newChoices[choiceIndex].actions[actionIndex] = action;
    updateDraft({ choices: newChoices });
  };

  const removeChoiceAction = (choiceIndex: number, actionIndex: number) => {
    const newChoices = [...draft.choices];
    newChoices[choiceIndex].actions = newChoices[choiceIndex].actions.filter(
      (_, i) => i !== actionIndex,
    );
    updateDraft({ choices: newChoices });
  };

  const duplicateChoiceAction = (choiceIndex: number, actionIndex: number) => {
    const newChoices = [...draft.choices];
    const actionToDuplicate = newChoices[choiceIndex].actions[actionIndex];
    const newAction: ProposalAction = {
      ...JSON.parse(JSON.stringify(actionToDuplicate)),
      id: crypto.randomUUID(),
    };
    newChoices[choiceIndex].actions.splice(actionIndex + 1, 0, newAction);
    updateDraft({ choices: newChoices });
  };

  const moveChoiceAction = (choiceIndex: number, actionIndex: number, direction: 'up' | 'down') => {
    const newChoices = [...draft.choices];
    const actions = newChoices[choiceIndex].actions;
    if (
      (direction === 'up' && actionIndex === 0) ||
      (direction === 'down' && actionIndex === actions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? actionIndex - 1 : actionIndex + 1;
    [actions[actionIndex], actions[targetIndex]] = [actions[targetIndex], actions[actionIndex]];
    updateDraft({ choices: newChoices });
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
                        onChange={(e) => {
                          updateDraft({ proposalType: e.target.value as 'single' | 'multiple' });
                          setSearchParams({ type: 'A' });
                        }}
                        disabled={!availableProposalTypes.single}
                      />
                      <Label
                        htmlFor="single"
                        className={
                          availableProposalTypes.single
                            ? 'cursor-pointer font-normal'
                            : 'cursor-not-allowed font-normal text-muted-foreground'
                        }
                      >
                        Single Choice (A){!availableProposalTypes.single && ' - Not Available'}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="multiple"
                        name="proposalType"
                        value="multiple"
                        checked={draft.proposalType === 'multiple'}
                        onChange={(e) => {
                          updateDraft({ proposalType: e.target.value as 'single' | 'multiple' });
                          setSearchParams({ type: 'B' });
                        }}
                        disabled={!availableProposalTypes.multiple}
                      />
                      <Label
                        htmlFor="multiple"
                        className={
                          availableProposalTypes.multiple
                            ? 'cursor-pointer font-normal'
                            : 'cursor-not-allowed font-normal text-muted-foreground'
                        }
                      >
                        Multiple Choice (B){!availableProposalTypes.multiple && ' - Not Available'}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions or Choices based on proposal type */}
            {draft.proposalType === 'single' ? (
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
                      onAddActionAfter={() => {
                        setInsertAfterIndex(index);
                        setIsLibraryOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Options ({draft.choices.length})</h2>
                  <Button variant="outline" size="sm" className="gap-2" onClick={addChoice}>
                    Add Option
                  </Button>
                </div>

                {draft.choices.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">No options added yet</p>
                      <Button variant="outline" onClick={addChoice}>
                        Add Option
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  draft.choices.map((choice, choiceIndex) => (
                    <Card key={choice.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Option {choiceIndex + 1} Title *</Label>
                            </div>
                            <Input
                              value={choice.title}
                              onChange={(e) => updateChoice(choiceIndex, { title: e.target.value })}
                              placeholder="Enter option title..."
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChoice(choiceIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <MarkdownEditor
                            value={choice.description}
                            onChange={(value) => updateChoice(choiceIndex, { description: value })}
                            placeholder="Enter option description..."
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Actions ({choice.actions.length})</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setActiveChoiceIndex(choiceIndex);
                                setIsLibraryOpen(true);
                              }}
                            >
                              <Library className="h-4 w-4" />
                              Add Action
                            </Button>
                          </div>

                          {choice.actions.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                              No actions for this option
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {choice.actions.map((action, actionIndex) => (
                                <ActionEditor
                                  key={action.id}
                                  action={action}
                                  index={actionIndex}
                                  total={choice.actions.length}
                                  onUpdate={(updated) =>
                                    updateChoiceAction(choiceIndex, actionIndex, updated)
                                  }
                                  onRemove={() => removeChoiceAction(choiceIndex, actionIndex)}
                                  onDuplicate={() =>
                                    duplicateChoiceAction(choiceIndex, actionIndex)
                                  }
                                  onMoveUp={() => moveChoiceAction(choiceIndex, actionIndex, 'up')}
                                  onMoveDown={() =>
                                    moveChoiceAction(choiceIndex, actionIndex, 'down')
                                  }
                                  onAddActionAfter={() => {
                                    setActiveChoiceIndex(choiceIndex);
                                    setInsertAfterIndex(actionIndex);
                                    setIsLibraryOpen(true);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

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
              proposalType={draft.proposalType}
              actions={draft.actions.map((a) => a.data)}
              choices={draft.choices}
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
          onOpenChange={(open) => {
            setIsLibraryOpen(open);
            if (!open) {
              setInsertAfterIndex(null);
              setActiveChoiceIndex(null);
            }
          }}
          onSelectTemplate={(template) => {
            // Check if this is an app template
            if (template.category === ActionCategory.APPS && template.defaultData?.app) {
              // Open app in fullscreen
              setAppUrl(template.defaultData.app.url);
              setAppName(template.defaultData.app.name);
              setPendingAppInsertIndex(insertAfterIndex);
              setPendingAppChoiceIndex(activeChoiceIndex);
              setAppFullscreen(true);
              setIsLibraryOpen(false);
              setInsertAfterIndex(null);
              setActiveChoiceIndex(null);
            } else {
              // Regular action template
              if (draft.proposalType === 'single') {
                if (insertAfterIndex !== null) {
                  insertActionAfter(insertAfterIndex, template);
                  setInsertAfterIndex(null);
                } else {
                  addAction(template);
                }
              } else if (activeChoiceIndex !== null) {
                addChoiceAction(activeChoiceIndex, template);
                setActiveChoiceIndex(null);
                setInsertAfterIndex(null);
              }
            }
          }}
        />

        {/* DappComponent in fullscreen for app actions */}
        {appFullscreen && daoState.data.value && (
          <DappComponent
            src={appUrl}
            name={appName}
            fullScreen={true}
            onFullScreenChange={(fullscreen) => {
              if (!fullscreen) {
                handleAppClose();
              }
            }}
            onMessagesDecoded={handleAppMessages}
            daoData={daoState.data.value}
            showMenuButton={false}
          />
        )}
      </div>
    </ProposalFormProvider>
  );
}
