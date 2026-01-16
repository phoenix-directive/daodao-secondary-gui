import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
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

interface SortableTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  condensedColumns?: boolean;
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
}

export function SortableTable<TData>({
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
}: SortableTableProps<TData>) {
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

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className={cn('bg-muted/50 ', headerClassName)}>
            {headerGroup.headers.map((header, i) => {
              const isFirst = i === 0;
              const isLast = i === headerGroup.headers.length - 1;
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    'relative h-10 border-t select-none',
                    condensedColumns && 'px-1',
                    isFirst && 'ps-6',
                    isLast && 'pe-6',
                  )}
                  align={header.column.columnDef.meta?.align}
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                      ? 'descending'
                      : 'none'
                  }
                  colSpan={header.colSpan}
                  style={{ width: header.column.columnDef.meta?.width ?? `${header.getSize()}px` }}
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <div
                      className={cn(
                        header.column.getCanSort() &&
                          'flex h-full cursor-pointer items-center justify-between gap-1 select-none hover:text-foreground',
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
                          <ChevronUpIcon
                            className="shrink-0 opacity-60"
                            size={16}
                            aria-hidden="true"
                          />
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
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            if (!row) return null;
            const cells = row.getVisibleCells();
            const computedRowClassName =
              typeof rowClassName === 'function' ? rowClassName(row.original) : rowClassName;
            return (
              <TableRow
                key={row.id}
                className={cn(
                  onRowClick && 'cursor-pointer transition-colors hover:bg-muted/50',
                  computedRowClassName,
                )}
                onClick={(ev) => {
                  if (onRowClick) {
                    onRowClick(row.original);
                    ev.stopPropagation();
                    ev.preventDefault();
                  }
                }}
              >
                {cells.map((cell, i) => {
                  const isFirst = i === 0;
                  const isLast = i === cells.length - 1;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        condensedColumns && 'px-1',
                        isFirst && 'pl-6',
                        isLast && 'pr-6',
                        'min-w-max',
                        cell.column.columnDef.meta?.align === 'right' && 'flex justify-end',
                      )}
                      style={{
                        width: cell.column.columnDef.meta?.width ?? `${cell.column.getSize()}px`,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default SortableTable;
