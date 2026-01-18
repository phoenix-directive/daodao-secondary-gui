import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { actionRegistry } from '@/lib/action-types';
import { useTheme } from '@/lib/useTheme';
import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageTypeInfo {
  title: string;
  subtitle?: string | ReactNode;
  icon: any;
  expandable: boolean;
  data?: any;
}

interface ProposalMessageProps {
  message: any;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  onRemove?: () => void;
}

export function ProposalMessage({
  message,
  expanded: controlledExpanded,
  onToggleExpanded,
  onRemove,
}: ProposalMessageProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { theme } = useTheme();

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

  // Find the matching action type from the registry
  const actionType = actionRegistry.match(message);

  const getMessageType = (): MessageTypeInfo => {
    if (actionType) {
      const subtitle = actionType.getSubtitle ? actionType.getSubtitle(message) : undefined;
      return {
        title: actionType.getTitle(message),
        subtitle,
        icon: actionType.icon,
        expandable: actionType.expandable,
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

  const renderParsed = () => {
    // If action type has a ViewComponent, use it
    if (actionType?.ViewComponent) {
      const ViewComponent = actionType.ViewComponent;
      return <ViewComponent data={message} />;
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
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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
