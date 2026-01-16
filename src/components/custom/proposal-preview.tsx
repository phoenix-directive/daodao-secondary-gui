import { ProposalMessage } from '@/components/custom/proposal-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ProposalPreviewProps {
  title: string;
  description: string;
  actions: any[];
}

export function ProposalPreview({ title, description, actions }: ProposalPreviewProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const hasDescription = description && description.trim() !== '' && description.trim() !== '.';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl wrap-break-word">{title || 'Untitled Proposal'}</CardTitle>
        </CardHeader>
        {hasDescription && (
          <CardContent>
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {description}
              </ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Actions</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedMessages(new Set(actions.map((_, i) => i)))}
              >
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedMessages(new Set())}>
                Collapse All
              </Button>
            </div>
          </div>
          {actions.map((msg, index) => (
            <ProposalMessage
              key={index}
              message={msg}
              index={index}
              expanded={expandedMessages.has(index)}
              onToggleExpanded={(isExpanded) => {
                const newExpanded = new Set(expandedMessages);
                if (isExpanded) {
                  newExpanded.add(index);
                } else {
                  newExpanded.delete(index);
                }
                setExpandedMessages(newExpanded);
              }}
            />
          ))}
        </div>
      )}

      {(!actions || actions.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No actions added yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
