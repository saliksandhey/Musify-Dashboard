import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  searchValue?: string;
  searchColumn?: string;
  onDeleteSelected?: (rows: TData[]) => void;
  className?: string;
}

export default function DataTable<TData>({
  data,
  columns,
  searchValue,
  searchColumn,
  onDeleteSelected,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const filteredData = useMemo(() => {
    if (!searchValue || !searchColumn) return data;
    return data.filter((row) => {
      const val = (row as Record<string, unknown>)[searchColumn];
      return String(val ?? "").toLowerCase().includes(searchValue.toLowerCase());
    });
  }, [data, searchValue, searchColumn]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {hasSelection && onDeleteSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 border border-purple-600/20 rounded-xl"
          >
            <span className="text-sm text-purple-300 font-medium">
              {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => {
                onDeleteSelected(selectedRows);
                setRowSelection({});
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/25 transition"
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-white/8 bg-surface-2">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1.5",
                          header.column.getCanSort() && "cursor-pointer hover:text-foreground transition-colors select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex-shrink-0">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp size={12} className="text-purple-400" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown size={12} className="text-purple-400" />
                            ) : (
                              <ChevronsUpDown size={12} className="opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-muted-foreground text-sm">
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className={cn(
                    "border-b border-white/5 transition-colors duration-150",
                    row.getIsSelected()
                      ? "bg-purple-600/8"
                      : "hover:bg-white/3"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 text-foreground/90">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}
          </span>{" "}
          of <span className="font-medium text-foreground">{filteredData.length}</span> results
        </span>

        <div className="flex items-center gap-1">
          <PaginationButton onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft size={14} />
          </PaginationButton>
          <PaginationButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft size={14} />
          </PaginationButton>

          {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
            const page = i + Math.max(0, table.getState().pagination.pageIndex - 2);
            if (page >= table.getPageCount()) return null;
            return (
              <button
                key={page}
                onClick={() => table.setPageIndex(page)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                  table.getState().pagination.pageIndex === page
                    ? "bg-purple-600 text-white"
                    : "hover:bg-white/8 text-muted-foreground"
                )}
              >
                {page + 1}
              </button>
            );
          })}

          <PaginationButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight size={14} />
          </PaginationButton>
          <PaginationButton onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight size={14} />
          </PaginationButton>
        </div>

        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-surface-3 border border-white/8 rounded-lg px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-purple-600/40"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}
