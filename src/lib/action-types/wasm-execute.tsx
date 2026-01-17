import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { usePrices } from '@/hooks/usePrices';
import { useTheme } from '@/lib/useTheme';
import Editor from '@monaco-editor/react';
import { Code2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ActionType } from '../action-registry';

// Type definition for Wasm Execute message
export type WasmExecuteMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: any;
    };
  };
};

// Type guard - must not be a CW20 transfer
const isWasmExecute = (data: any): data is WasmExecuteMsg => {
  return data?.wasm?.execute !== undefined && !data.wasm.execute.msg?.transfer;
};

// Helper function to decode message
function decodeMessage(msg: any): string {
  if (typeof msg === 'string') {
    try {
      const decoded = atob(msg);
      const parsed = JSON.parse(decoded);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return JSON.stringify({}, null, 2);
    }
  }
  return JSON.stringify(msg || {}, null, 2);
}

// Helper function to encode message
function encodeMessage(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText);
    const stringified = JSON.stringify(parsed);
    return btoa(stringified);
  } catch {
    throw new Error('Invalid JSON');
  }
}

// Form component
function WasmExecuteForm({
  data,
  onUpdate,
}: {
  data: WasmExecuteMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const executeData = data.wasm.execute;
  const [jsonText, setJsonText] = useState(() => decodeMessage(executeData.msg));
  const [jsonError, setJsonError] = useState<string>('');
  const debouncedJsonText = useDebounce(jsonText, 200);
  const isInitialMount = useRef(true);
  const lastSavedValue = useRef<string>('');
  const { theme } = useTheme();
  const [editorHeight, setEditorHeight] = useState(150);

  // Update local state when external data changes
  useEffect(() => {
    const decoded = decodeMessage(executeData.msg);
    // Only update if the decoded value is different from what we last saved
    // This prevents feedback loops when our own save triggers an update
    if (executeData.msg !== lastSavedValue.current) {
      setJsonText(decoded);
    }
  }, [executeData.msg]);

  // Save debounced changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      const encoded = encodeMessage(debouncedJsonText);
      lastSavedValue.current = encoded;
      onUpdate(['wasm', 'execute', 'msg'], encoded);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON - cannot save');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedJsonText]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonText(value);
      // Clear error when user starts typing
      if (jsonError) {
        setJsonError('');
      }
    }
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const beautified = JSON.stringify(parsed, null, 2);
      setJsonText(beautified);
    } catch {
      // Ignore if JSON is invalid
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contract Address</Label>
        <Input
          value={executeData.contract_addr || ''}
          onChange={(e) => onUpdate(['wasm', 'execute', 'contract_addr'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Execute Message (JSON)</Label>
          <Button
            type="button"
            onClick={handleBeautify}
            variant="link-no-padding"
            className="text-sm"
          >
            Beautify
          </Button>
        </div>
        <div
          className="border rounded-md overflow-hidden resize-y"
          style={{ minHeight: '150px', maxHeight: '600px', height: `${editorHeight}px` }}
        >
          <Editor
            height="100%"
            defaultLanguage="json"
            value={jsonText}
            onChange={handleEditorChange}
            onMount={(editor, monaco) => {
              // Observe container resize
              const container = editor.getDomNode()?.parentElement;
              if (container) {
                const resizeObserver = new ResizeObserver((entries) => {
                  for (const entry of entries) {
                    setEditorHeight(entry.contentRect.height);
                  }
                });
                resizeObserver.observe(container);
              }
            }}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: 'off',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              suggest: {
                showProperties: false,
              },
            }}
            theme={theme === 'light' ? 'light' : 'vs-dark'}
          />
        </div>
        {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
        {!jsonError && <p className="text-sm text-muted-foreground">Valid JSON</p>}
      </div>
    </div>
  );
}

// View component for expanded view
function WasmExecuteView({ data }: { data: WasmExecuteMsg }) {
  const { contract_addr, msg, funds } = data.wasm.execute;
  const { getPrice } = usePrices();

  // Decode base64 message if needed
  let decodedMsg = msg;
  if (typeof msg === 'string') {
    try {
      const decoded = atob(msg);
      decodedMsg = JSON.parse(decoded);
    } catch (e) {
      decodedMsg = { error: 'Failed to decode message', raw: msg };
    }
  }

  // Check if this is an increase_allowance message
  const isIncreaseAllowance = decodedMsg.increase_allowance;
  const tokenInfo = isIncreaseAllowance ? getPrice(contract_addr) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Contract</div>
          {tokenInfo ? (
            <div className="flex items-center gap-2">
              <AddressLink address={contract_addr} short={false} />
              <span className="text-sm text-muted-foreground">({tokenInfo.display})</span>
            </div>
          ) : (
            <AddressLink address={contract_addr} short={false} />
          )}
        </div>

        {isIncreaseAllowance && decodedMsg.increase_allowance.amount && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Allowed Funds</div>
            <div className="space-y-2">
              <AmountDisplay amount={decodedMsg.increase_allowance.amount} denom={contract_addr} />
            </div>
          </div>
        )}

        {funds && funds.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Funds</div>
            <div className="space-y-2">
              {funds.map((fund: any, idx: number) => (
                <AmountDisplay key={idx} amount={fund.amount} denom={fund.denom} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
          <div className="overflow-hidden rounded-lg border">
            <JsonViewer data={decodedMsg} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Get subtitle for preview
function getSubtitle(data: WasmExecuteMsg): string {
  let actionName = '';

  try {
    const msg = data.wasm.execute.msg;
    let decodedMsg = msg;

    if (typeof msg === 'string') {
      const decoded = atob(msg);
      decodedMsg = JSON.parse(decoded);
    }

    const firstKey = Object.keys(decodedMsg)[0];
    if (firstKey) {
      actionName = firstKey
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  } catch (e) {
    // Ignore errors
  }

  return actionName;
}

// Export the action type configuration
export const WasmExecuteActionType: ActionType<WasmExecuteMsg> = {
  id: 'wasm_execute',
  name: 'Execute Contract',
  icon: Code2,
  guard: isWasmExecute,
  getTitle: () => 'Execute Smart Contract',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: WasmExecuteForm,
  ViewComponent: WasmExecuteView,
};
