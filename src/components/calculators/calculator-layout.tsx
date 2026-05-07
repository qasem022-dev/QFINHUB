"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalculatorLayoutProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  results: React.ReactNode;
  className?: string;
}

export function CalculatorLayout({
  title,
  description,
  icon,
  children,
  results,
  className,
}: CalculatorLayoutProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-lg dark:bg-primary-900/30">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main grid: inputs + results */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Inputs section */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200 shadow-sm dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Inputs
              </CardTitle>
              <CardDescription>
                Adjust the values below to calculate your results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">{children}</div>
            </CardContent>
          </Card>
        </div>

        {/* Results section */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Results
              </CardTitle>
              <CardDescription>
                Your calculated results based on the inputs provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">{results}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
