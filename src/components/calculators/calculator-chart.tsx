"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalculatorChartProps {
  type: "line" | "bar" | "pie" | "area";
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string | string[];
  title?: string;
  colors?: string[];
  className?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  "#3b82f6", // primary-500
  "#10b981", // accent-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

const DARK_MODE_COLORS = [
  "#60a5fa", // primary-400
  "#34d399", // accent-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#22d3ee", // cyan-400
  "#fb923c", // orange-400
];

function ChartTooltipContent({
  active,
  payload,
  label,
  xKey,
  yKey,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  xKey: string;
  yKey: string | string[];
}) {
  if (!active || !payload?.length) return null;

  const keys = Array.isArray(yKey) ? yKey : [yKey];
  const labelName = label ?? "";

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-surface-dark">
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        {labelName}
      </p>
      {payload.map((entry, idx) => {
        const key = keys[idx] ?? entry.name;
        return (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CalculatorChart({
  type,
  data,
  xKey,
  yKey,
  title,
  colors,
  className,
  height = 300,
}: CalculatorChartProps) {
  const chartColors = colors ?? DEFAULT_COLORS;
  const keys = Array.isArray(yKey) ? yKey : [yKey];

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <RechartsTooltip
              content={<ChartTooltipContent xKey={xKey} yKey={yKey} />}
            />
            {keys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[idx % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <RechartsTooltip
              content={<ChartTooltipContent xKey={xKey} yKey={yKey} />}
            />
            {keys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartColors[idx % chartColors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
            />
            <RechartsTooltip
              content={<ChartTooltipContent xKey={xKey} yKey={yKey} />}
            />
            {keys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[idx % chartColors.length]}
                fill={chartColors[idx % chartColors.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={keys[0] ?? "value"}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${(Number(percent) * 100).toFixed(0)}%`
              }
              labelLine
            >
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={chartColors[idx % chartColors.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip
              content={<ChartTooltipContent xKey={xKey} yKey={yKey} />}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("border-gray-200 shadow-sm dark:border-gray-700", className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div
          className="w-full"
          style={{ height }}
          role="img"
          aria-label={title ?? `${type} chart`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() ?? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No chart data available
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
