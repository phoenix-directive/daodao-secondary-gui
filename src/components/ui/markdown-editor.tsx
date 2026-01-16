import { useTheme } from '@/lib/useTheme';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const { theme } = useTheme();

  return (
    <div data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
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
