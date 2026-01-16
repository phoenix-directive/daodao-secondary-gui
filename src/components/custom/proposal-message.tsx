import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Switch } from '@/components/ui/switch';
import { usePrices } from '@/hooks/usePrices';
import { useTheme } from '@/lib/useTheme';
import { ChevronDown, ChevronRight, Code2, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ProposalMessageProps {
  message: any;
  index: number;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export function ProposalMessage({
  message,
  index,
  expanded: controlledExpanded,
  onToggleExpanded,
}: ProposalMessageProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { theme } = useTheme();
  const { getPrice } = usePrices();

  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpanded = () => {
    const newExpanded = !expanded;
    if (onToggleExpanded) {
      onToggleExpanded(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const syntaxTheme = theme === 'dark' ? oneDark : oneLight;

  const getMessageType = () => {
    if (message.wasm?.execute) {
      let actionName = '';

      // Try to decode the message and get the first key
      try {
        const { msg } = message.wasm.execute;
        const decoded = atob(msg);
        const decodedMsg = JSON.parse(decoded);
        const firstKey = Object.keys(decodedMsg)[0];

        if (firstKey) {
          // Convert snake_case to Title Case
          actionName = toTitleCase(firstKey);
        }
      } catch (e) {
        // Ignore errors, just don't show action name
      }

      return {
        title: 'Execute Smart Contract',
        subtitle: actionName,
        icon: Code2,
        supported: true,
      };
    }

    // Fallback for unsupported types
    const firstKey = toTitleCase(Object.keys(message)[0] || '');
    return {
      title: 'Raw Message',
      subtitle: firstKey,
      icon: FileText,
      supported: false,
    };
  };

  const messageType = getMessageType();

  const renderWasmExecute = (wasmMsg: any) => {
    const { contract_addr, msg, funds } = wasmMsg.execute || wasmMsg;

    // Decode base64 message
    let decodedMsg;
    try {
      const decoded = atob(msg);
      decodedMsg = JSON.parse(decoded);
    } catch (e) {
      decodedMsg = { error: 'Failed to decode message', raw: msg };
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
                <AmountDisplay
                  amount={decodedMsg.increase_allowance.amount}
                  denom={contract_addr}
                />
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
  };

  const renderParsed = () => {
    // Check if it's a wasm execute message
    if (message.wasm?.execute) {
      return renderWasmExecute(message.wasm);
    }

    // Fallback: show raw JSON for unsupported types
    return (
      <div className="overflow-hidden rounded-lg border">
        <SyntaxHighlighter
          language="json"
          style={syntaxTheme}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            lineHeight: '1.25rem',
          }}
        >
          {JSON.stringify(message, null, 2)}
        </SyntaxHighlighter>
      </div>
    );
  };

  const MessageIcon = showRaw ? FileText : messageType.icon;

  return (
    <Card className="p-0 gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
        onClick={handleToggleExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0">
              {expanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <MessageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {showRaw ? 'Raw Message' : messageType.title}
              </CardTitle>
              {messageType.subtitle && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {messageType.subtitle}
                </p>
              )}
            </div>
          </div>
          {messageType.supported && (
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm text-muted-foreground">Show Raw</span>
              <Switch
                checked={showRaw}
                onCheckedChange={(checked) => {
                  setShowRaw(checked);
                  // Auto-expand when toggling to raw view
                  if (checked && !expanded) {
                    handleToggleExpanded();
                  }
                }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="pb-4">
              {showRaw ? (
                <div className="overflow-hidden rounded-lg border">
                  <SyntaxHighlighter
                    language="json"
                    style={syntaxTheme}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      lineHeight: '1.25rem',
                    }}
                  >
                    {JSON.stringify(message, null, 2)}
                  </SyntaxHighlighter>
                </div>
              ) : (
                renderParsed()
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  function toTitleCase(firstKey: string): string {
    return firstKey
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
