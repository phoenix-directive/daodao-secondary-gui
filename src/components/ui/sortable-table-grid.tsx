import { cn } from '@/lib/utils';
import { useSignal } from '@preact/signals-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SortableTableGridProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  condensedColumns?: boolean;
  condensedLastPadding?: boolean;
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
  renderDetailRow?: (row: TData) => React.ReactNode;
  enableRowHover?: boolean;
}

export function SortableTableGrid<TData>({
  columns,
  data,
  sorting,
  onSortingChange,
  onRowClick,
  getRowId,
  emptyMessage = 'No data available',
  headerClassName,
  rowClassName,
  condensedColumns,
  condensedLastPadding,
  renderDetailRow,
  enableRowHover = true,
}: SortableTableGridProps<TData>) {
  const hoveredRowId = useSignal<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    getRowId,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    defaultColumn: {
      size: 150,
      minSize: 50,
    },
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  // Calculate grid template columns based on column widths
  const gridTemplateColumns = headerGroups[0]?.headers
    .map((header) => header.column.columnDef.meta?.width ?? `1fr`)
    .join(' ');

  return (
    <div
      className="w-full overflow-x-auto overflow-y-hidden rounded-b-xl"
      style={{
        display: 'grid',
        gridTemplateColumns,
      }}
    >
      {/* Header */}
      {headerGroups.map((headerGroup) =>
        headerGroup.headers.map((header, i) => {
          const isFirst = i === 0;
          const isLast = i === headerGroup.headers.length - 1;
          return (
            <div
              key={header.id}
              className={cn(
                'relative flex h-10 items-center border-b border-t bg-muted/50 text-xs font-medium text-muted-foreground select-none text-nowrap',
                condensedColumns ? 'px-1' : 'px-4',
                isFirst && 'ps-6',
                isLast && 'pe-6',
                condensedLastPadding && isLast && 'pe-3',
                headerClassName,
              )}
              aria-sort={
                header.column.getIsSorted() === 'asc'
                  ? 'ascending'
                  : header.column.getIsSorted() === 'desc'
                  ? 'descending'
                  : 'none'
              }
            >
              {header.isPlaceholder ? null : header.column.getCanSort() ? (
                <div
                  className={cn(
                    'flex h-full w-full cursor-pointer items-center gap-1 select-none hover:text-foreground',
                    header.column.columnDef.meta?.align === 'center' && 'justify-center',
                    header.column.columnDef.meta?.align === 'right' && 'justify-end',
                    condensedColumns && 'gap-0',
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                  onKeyDown={(e) => {
                    if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      header.column.getToggleSortingHandler()?.(e);
                    }
                  }}
                  tabIndex={header.column.getCanSort() ? 0 : undefined}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: (
                      <ChevronUpIcon className="shrink-0 opacity-60" size={16} aria-hidden="true" />
                    ),
                    desc: (
                      <ChevronDownIcon
                        className="shrink-0 opacity-60"
                        size={16}
                        aria-hidden="true"
                      />
                    ),
                  }[header.column.getIsSorted() as string] ?? (
                    <ChevronsUpDownIcon
                      className="shrink-0 opacity-30"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ) : (
                flexRender(header.column.columnDef.header, header.getContext())
              )}
            </div>
          );
        }),
      )}

      {/* Body */}
      {rows.length ? (
        rows.map((row, index) => {
          if (!row) return null;
          const isLastRow = index === rows.length - 1;
          const cells = row.getVisibleCells();
          const computedRowClassName =
            typeof rowClassName === 'function' ? rowClassName(row.original) : rowClassName;
          const detailContent = renderDetailRow?.(row.original);

          return (
            <>
              {cells.map((cell, i) => {
                const isFirst = i === 0;
                const isLast = i === cells.length - 1;
                return (
                  <div
                    key={cell.id}
                    className={cn(
                      'flex items-center border-b p-4 text-sm transition-colors',
                      condensedColumns && 'px-1',
                      isFirst && 'pl-6',
                      isLast && 'pr-6',
                      isLastRow && !detailContent && 'border-0',
                      detailContent && 'border-0',
                      condensedLastPadding && isLast && 'pr-4',
                      cell.column.columnDef.meta?.align === 'center' && 'justify-center',
                      cell.column.columnDef.meta?.align === 'right' && 'justify-end',
                      onRowClick && 'cursor-pointer',
                      enableRowHover && hoveredRowId.value === row.id && onRowClick && 'bg-muted/50',
                      computedRowClassName,
                    )}
                    onClick={(ev) => {
                      if (onRowClick) {
                        onRowClick(row.original);
                        ev.stopPropagation();
                        ev.preventDefault();
                      }
                    }}
                    onMouseEnter={() => {
                      if (onRowClick && enableRowHover) {
                        hoveredRowId.value = row.id;
                      }
                    }}
                    onMouseLeave={() => {
                      if (onRowClick && enableRowHover) {
                        hoveredRowId.value = null;
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                );
              })}
              {detailContent && (
                <motion.div
                  className="border-t border-dashed"
                  style={{ gridColumn: '1 / -1' }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className={cn('border-b', isLastRow && 'border-b-0')}>{detailContent}</div>
                </motion.div>
              )}
            </>
          );
        })
      ) : (
        <div
          className="col-span-full flex h-24 items-center justify-center text-center text-muted-foreground"
          style={{ gridColumn: `1 / -1` }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default SortableTableGrid;
