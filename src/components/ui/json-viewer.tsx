import { useTheme } from '@/lib/useTheme';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
  data: any;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const { theme } = useTheme();
  const syntaxTheme = theme === 'dark' ? oneDark : oneLight;

  return (
    <div className={className}>
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
        {JSON.stringify(data, null, 2)}
      </SyntaxHighlighter>
    </div>
  );
}
