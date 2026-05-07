"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
  prefix?: React.ReactNode;
  className?: string;
}

export function ResultCard({
  label,
  value,
  subtext,
  highlight = false,
  prefix,
  className,
}: ResultCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        highlight
          ? "border-accent-200 bg-gradient-to-br from-accent-50 to-accent-50/50 shadow-sm dark:border-accent-800 dark:from-accent-900/20 dark:to-accent-900/10"
          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              highlight
                ? "text-accent-700 dark:text-accent-400"
                : "text-gray-500 dark:text-gray-400",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-bold tracking-tight",
              highlight
                ? "text-2xl text-accent-600 dark:text-accent-300"
                : "text-xl text-gray-900 dark:text-white",
            )}
          >
            {value}
          </p>
          {subtext && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {subtext}
            </p>
          )}
        </div>
        {prefix && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              highlight
                ? "bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
            )}
          >
            {prefix}
          </div>
        )}
      </div>
    </div>
  );
}
