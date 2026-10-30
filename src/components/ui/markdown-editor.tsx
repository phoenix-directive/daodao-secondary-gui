import { useTheme } from '@/lib/useTheme';
import MDEditor from '@uiw/react-md-editor';
import { useEffect, useRef } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove toolbar buttons from tab order
    if (containerRef.current) {
      const toolbarButtons = containerRef.current.querySelectorAll('.w-md-editor-toolbar button');
      toolbarButtons.forEach((button) => {
        (button as HTMLElement).tabIndex = -1;
      });
    }
  }, []);

  return (
    <div ref={containerRef} data-color-mode={isDark ? 'dark' : 'light'}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview="edit"
        height={300}
        textareaProps={{
          placeholder: placeholder || 'Enter description...',
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
    </div>
  );
}
