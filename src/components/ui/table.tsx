import * as React from "react"

import { cn } from "@/lib/utils"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
export interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  ),
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  ),
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  ),
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t bg-gray-100 font-medium dark:bg-gray-800 [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  ),
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-gray-200 transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800/50 dark:data-[state=selected]:bg-gray-800",
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  ),
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  ),
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  ),
)
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
