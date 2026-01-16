import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Switch } from '@/components/ui/switch';
import { fromBaseUnits } from '@/hooks';
import { usePrices } from '@/hooks/usePrices';
import { useTheme } from '@/lib/useTheme';
import { ChevronDown, ChevronRight, Code2, FileText, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Type guards for message types
type BankSendMsg = {
  bank: {
    send: {
      to_address: string;
      amount: Array<{ denom: string; amount: string }>;
    };
  };
};

type WasmExecuteMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: string;
    };
  };
};

interface MessageTypeInfo {
  title: string;
  subtitle?: string | ReactNode;
  icon: any;
  expandable: boolean;
  data?: any;
}

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

  // Type guard functions
  const isBankSend = (data: any): data is BankSendMsg => {
    return data?.bank?.send !== undefined;
  };

  const isWasmExecute = (data: any): data is WasmExecuteMsg => {
    return data?.wasm?.execute !== undefined;
  };

  const getMessageType = (): MessageTypeInfo => {
    // Bank Send
    if (isBankSend(message)) {
      const { to_address, amount } = message.bank.send;
      const coin = amount[0];
      if (!coin) {
        return {
          title: 'Bank Send',
          icon: Send,
          expandable: false,
        };
      }

      const priceData = getPrice(coin.denom);
      const displayAmount = priceData
        ? fromBaseUnits(coin.amount, priceData.decimals)
        : coin.amount;
      const displayDenom = priceData?.display || coin.denom;

      return {
        title: 'Bank Send',
        subtitle: (
          <div className="flex gap-1">
            {displayAmount} {displayDenom} to <AddressLink address={to_address} />
          </div>
        ),
        icon: Send,
        expandable: false,
      };
    }

    // Wasm Execute
    if (isWasmExecute(message)) {
      let actionName = '';
      let decodedMsg;

      try {
        const decoded = atob(message.wasm.execute.msg);
        decodedMsg = JSON.parse(decoded);
        const firstKey = Object.keys(decodedMsg)[0];

        if (firstKey) {
          actionName = toTitleCase(firstKey);
        }
      } catch (e) {
        // Ignore errors
      }

      return {
        title: 'Execute Smart Contract',
        subtitle: actionName,
        icon: Code2,
        expandable: true,
        data: { decodedMsg },
      };
    }

    // Fallback for unsupported types
    const firstKey = toTitleCase(Object.keys(message)[0] || '');
    return {
      title: 'Raw Message',
      subtitle: firstKey,
      icon: FileText,
      expandable: true,
    };
  };

  const messageType = getMessageType();

  const renderWasmExecute = (wasmMsg: any, decodedMsg?: any) => {
    const { contract_addr, msg, funds } = wasmMsg.execute || wasmMsg;

    // Decode base64 message if not already decoded
    if (!decodedMsg) {
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
    if (isWasmExecute(message)) {
      return renderWasmExecute(message.wasm, messageType.data?.decodedMsg);
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
        className={
          messageType.expandable
            ? 'cursor-pointer hover:bg-muted/50 transition-colors py-4'
            : 'py-4'
        }
        onClick={messageType.expandable ? handleToggleExpanded : undefined}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <MessageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {showRaw ? 'Raw Message' : messageType.title}
              </CardTitle>
              {messageType.subtitle && (
                <div className="text-sm text-muted-foreground truncate mt-0.5">
                  {messageType.subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {messageType.expandable && (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
            {messageType.expandable && (
              <div className="shrink-0">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {expanded && messageType.expandable && (
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
