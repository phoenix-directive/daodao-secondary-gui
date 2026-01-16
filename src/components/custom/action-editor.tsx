import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { detectMessageType, ProposalAction } from '@/lib/proposal-drafts';
import { ArrowDown, ArrowUp, Code2, Copy, Eye, X } from 'lucide-react';
import { useState } from 'react';
import {
  BankSendForm,
  CW20SendForm,
  GovVoteForm,
  StakingDelegateForm,
  StakingUndelegateForm,
  StargateGovVoteForm,
  WasmExecuteForm,
  WasmUpdateAdminForm,
} from './action-forms';

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
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');

  const messageInfo = detectMessageType(action.data);

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
    onUpdate({ ...action, data: updated });
    setJsonString(JSON.stringify(updated, null, 2));
  };

  // Type guards for message types
  type BankSendMsg = {
    bank: {
      send: {
        to_address: string;
        amount: Array<{ denom: string; amount: string }>;
      };
    };
  };

  type CW20SendMsg = {
    wasm: {
      execute: {
        contract_addr: string;
        funds: any[];
        msg: { transfer: { recipient: string; amount: string } };
      };
    };
  };

  type WasmExecuteMsg = {
    wasm: {
      execute: {
        contract_addr: string;
        funds: any[];
        msg: any;
      };
    };
  };

  type WasmUpdateAdminMsg = {
    wasm: {
      update_admin: {
        contract_addr: string;
        admin: string;
      };
    };
  };

  type StargateStakingDelegateMsg = {
    stargate: {
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate';
      value: {
        delegatorAddress: string;
        validatorAddress: string;
        amount: { denom: string; amount: string };
      };
    };
  };

  type StargateStakingUndelegateMsg = {
    stargate: {
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate';
      value: {
        delegatorAddress: string;
        validatorAddress: string;
        amount: { denom: string; amount: string };
      };
    };
  };

  type GovVoteMsg = {
    gov: {
      vote: {
        proposal_id: number;
        vote: 'yes' | 'no' | 'abstain' | 'no_with_veto';
      };
    };
  };

  type StargateGovVoteMsg = {
    stargate: {
      typeUrl: '/cosmos.gov.v1beta1.MsgVote' | '/cosmos.gov.v1.MsgVote';
      value: {
        proposalId: string;
        voter: string;
        option: number;
      };
    };
  };

  const isBankSend = (data: any): data is BankSendMsg => {
    return data?.bank?.send !== undefined;
  };

  const isCW20Send = (data: any): data is CW20SendMsg => {
    return data?.wasm?.execute?.msg?.transfer !== undefined;
  };

  const isWasmExecute = (data: any): data is WasmExecuteMsg => {
    return data?.wasm?.execute !== undefined && !data.wasm.execute.msg?.transfer;
  };

  const isWasmUpdateAdmin = (data: any): data is WasmUpdateAdminMsg => {
    return data?.wasm?.update_admin !== undefined;
  };

  const isStargateStakingDelegate = (data: any): data is StargateStakingDelegateMsg => {
    return data?.stargate?.typeUrl === '/cosmos.staking.v1beta1.MsgDelegate';
  };

  const isStargateStakingUndelegate = (data: any): data is StargateStakingUndelegateMsg => {
    return data?.stargate?.typeUrl === '/cosmos.staking.v1beta1.MsgUndelegate';
  };

  const isGovVote = (data: any): data is GovVoteMsg => {
    return data?.gov?.vote !== undefined;
  };

  const isStargateGovVote = (data: any): data is StargateGovVoteMsg => {
    return (
      data?.stargate?.typeUrl === '/cosmos.gov.v1beta1.MsgVote' ||
      data?.stargate?.typeUrl === '/cosmos.gov.v1.MsgVote'
    );
  };

  const renderFormEditor = () => {
    // Bank Send
    if (isBankSend(action.data)) {
      return <BankSendForm data={action.data} onUpdate={updateField} />;
    }

    // CW20 Send
    if (isCW20Send(action.data)) {
      return <CW20SendForm data={action.data} onUpdate={updateField} />;
    }

    // Staking Delegate (Stargate)
    if (isStargateStakingDelegate(action.data)) {
      return <StakingDelegateForm data={action.data} onUpdate={updateField} />;
    }

    // Staking Undelegate (Stargate)
    if (isStargateStakingUndelegate(action.data)) {
      return <StakingUndelegateForm data={action.data} onUpdate={updateField} />;
    }

    // Governance Vote
    if (isGovVote(action.data)) {
      return <GovVoteForm data={action.data} onUpdate={updateField} />;
    }

    // Governance Vote (Stargate - for backwards compatibility)
    if (isStargateGovVote(action.data)) {
      return <StargateGovVoteForm data={action.data} onUpdate={updateField} />;
    }

    // CosmWasm Execute (generic)
    if (isWasmExecute(action.data)) {
      return <WasmExecuteForm data={action.data} onUpdate={updateField} />;
    }

    // Update Admin
    if (isWasmUpdateAdmin(action.data)) {
      return <WasmUpdateAdminForm data={action.data} onUpdate={updateField} />;
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
      </CardFooter>
    </Card>
  );
}
