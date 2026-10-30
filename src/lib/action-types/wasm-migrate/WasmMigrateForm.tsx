import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { decodeMessage, encodeMessage } from '@/lib/action-types/wasm-execute/WasmExecuteAction';
import { useTheme } from '@/lib/useTheme';
import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import type { WasmMigrateMsg } from './WasmMigrateAction';

export function WasmMigrateForm({
  data,
  onUpdate,
}: {
  data: WasmMigrateMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const migrateData = data.wasm.migrate;
  const [jsonText, setJsonText] = useState(() => decodeMessage(migrateData.msg));
  const [jsonError, setJsonError] = useState<string>('');
  const debouncedJsonText = useDebounce(jsonText, 200);
  const isInitialMount = useRef(true);
  const lastSavedValue = useRef<string>('');
  const { theme } = useTheme();
  const [editorHeight, setEditorHeight] = useState(150);

  // Update local state when external data changes
  useEffect(() => {
    // Only update if different from what we last saved, to prevent feedback loops
    if (migrateData.msg !== lastSavedValue.current) {
      setJsonText(decodeMessage(migrateData.msg));
    }
  }, [migrateData.msg]);

  // Save debounced changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      const encoded = encodeMessage(debouncedJsonText);
      lastSavedValue.current = encoded;
      onUpdate(['wasm', 'migrate', 'msg'], encoded);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON - cannot save');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedJsonText]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonText(value);
      if (jsonError) {
        setJsonError('');
      }
    }
  };

  const handleBeautify = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
    } catch {
      // Ignore if JSON is invalid
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contract Address</Label>
        <Input
          value={migrateData.contract_addr || ''}
          onChange={(e) => onUpdate(['wasm', 'migrate', 'contract_addr'], e.target.value)}
          placeholder="terra1..."
        />
      </div>
      <div className="space-y-2">
        <Label>New Code ID</Label>
        <Input
          type="number"
          min={0}
          value={migrateData.new_code_id || ''}
          onChange={(e) =>
            onUpdate(['wasm', 'migrate', 'new_code_id'], parseInt(e.target.value, 10) || 0)
          }
          placeholder="1234"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Migrate Message (JSON)</Label>
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
            onMount={(editor) => {
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
