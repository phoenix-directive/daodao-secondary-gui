import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MultiTokenAmountPicker,
  type TokenAmount,
} from '@/components/custom/TokenAmountPicker';
import { useDebounce } from '@/hooks/useDebounce';
import { useProposalFormContext } from '@/lib/proposal-form-context';
import { useTheme } from '@/lib/useTheme';
import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import type { WasmExecuteMsg } from './WasmExecuteAction';
import { decodeMessage, encodeMessage } from './WasmExecuteAction';

export function WasmExecuteForm({
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

  // Use allCoins for the combined balances with prices
  const { allCoins } = useProposalFormContext();

  const handleFundsChange = (newFunds: TokenAmount[]) => {
    onUpdate(['wasm', 'execute', 'funds'], newFunds);
  };

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
        <Label>Funds</Label>
        <MultiTokenAmountPicker
          values={executeData.funds || []}
          availableCoins={allCoins.value}
          onChange={handleFundsChange}
          addButtonLabel="+ Add another coin"
          showMaxButton={true}
        />
        <p className="text-xs text-muted-foreground">
          Use the settings button to switch between standard (with decimals) and custom (raw base units) mode per coin
        </p>
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
