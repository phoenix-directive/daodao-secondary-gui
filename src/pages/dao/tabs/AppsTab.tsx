import { AppPicker, DappComponent } from '@/components/custom/apps';
import { AppMessagesModal } from '@/components/modals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { getEmptyDraft, loadDraft, ProposalAction, saveDraft } from '@/lib/proposal-drafts';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function AppsTab() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { address: daoAddress } = useParams<{ address: string }>();
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value ?? undefined;

  // Load current draft to show in modal
  const draft = daoAddress ? loadDraft(daoAddress) || getEmptyDraft() : getEmptyDraft();

  const handleMessagesDecoded = (chain: string, sender: string, msgs: any[]) => {
    console.log('Decoded messages from app:', { chain, sender, msgs });

    if (!daoAddress) {
      toast.error('DAO address not found');
      console.error('DAO address not found');
      return;
    }

    if (!msgs || msgs.length === 0) {
      toast.error('No messages to add');
      console.error('No messages to add');
      return;
    }

    // Load current draft or create new one
    const currentDraft = loadDraft(daoAddress) || getEmptyDraft();

    // Create actions from messages
    const newActions: ProposalAction[] = msgs.map((msg) => ({
      id: crypto.randomUUID(),
      data: msg,
    }));

    // Add messages to draft based on proposal type
    if (currentDraft.proposalType === 'single') {
      // Add to single choice actions
      currentDraft.actions = [...currentDraft.actions, ...newActions];
    } else {
      // Add to first option in multiple choice
      if (currentDraft.choices.length === 0) {
        // Create first option if none exist
        currentDraft.choices.push({
          id: crypto.randomUUID(),
          title: '',
          description: '',
          actions: newActions,
        });
      } else {
        // Add to first option
        currentDraft.choices[0].actions = [...currentDraft.choices[0].actions, ...newActions];
      }
    }

    currentDraft.lastModified = Date.now();

    // Save updated draft
    saveDraft(daoAddress, currentDraft);

    toast.success(`Added ${msgs.length} ${msgs.length === 1 ? 'message' : 'messages'} to draft`);

    // Show modal
    setIsModalOpen(true);
  };

  const handleRemoveAction = (index: number) => {
    if (!daoAddress) return;

    const currentDraft = loadDraft(daoAddress) || getEmptyDraft();

    if (currentDraft.proposalType === 'single') {
      currentDraft.actions = currentDraft.actions.filter((_, i) => i !== index);
    } else if (currentDraft.choices.length > 0) {
      currentDraft.choices[0].actions = currentDraft.choices[0].actions.filter(
        (_, i) => i !== index,
      );
    }

    currentDraft.lastModified = Date.now();
    saveDraft(daoAddress, currentDraft);

    toast.success('Message removed from draft');
  };

  const handleClearAll = () => {
    if (!daoAddress) return;

    const currentDraft = loadDraft(daoAddress) || getEmptyDraft();

    if (currentDraft.proposalType === 'single') {
      currentDraft.actions = [];
    } else if (currentDraft.choices.length > 0) {
      currentDraft.choices[0].actions = [];
    }

    currentDraft.lastModified = Date.now();
    saveDraft(daoAddress, currentDraft);

    toast.success('All messages cleared from draft');
    setIsModalOpen(false);
  };

  // Get actions to display in modal
  const draftActions =
    draft.proposalType === 'single'
      ? draft.actions
      : draft.choices.length > 0
      ? draft.choices[0].actions
      : [];

  if (daoState.loading.value || !daoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apps</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading apps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex-0 mb-6">
        <CardHeader>
          <CardTitle>Apps</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <AppRenderer
            fullScreen={fullScreen}
            onFullScreenChange={setFullScreen}
            daoData={daoData}
          /> */}

          <AppPicker
            url={url}
            onOpenApp={(newUrl, name) => {
              setUrl(newUrl);
              setName(name);
            }}
            daoData={daoData}
          />
        </CardContent>
      </Card>

      {url && (
        <DappComponent
          className="w-full min-h-[500px] flex-1"
          src={url}
          name={name ?? url}
          daoData={daoData}
          onUrlChange={(url) => {
            setUrl(url);
          }}
          onMessagesDecoded={handleMessagesDecoded}
        />
      )}

      <AppMessagesModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        actions={draftActions}
        onRemoveAction={handleRemoveAction}
        onClearAll={handleClearAll}
        daoAddress={daoAddress || ''}
      />
    </>
  );
}
