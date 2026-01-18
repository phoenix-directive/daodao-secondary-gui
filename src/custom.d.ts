import '@tanstack/react-table';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
    width?: string;
  }
}

// Vite injected build-time constants
declare const __BUILD_VERSION__: string;
