"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import type { CalculatorInput as CalculatorInputType } from "@/types/calculator";

interface CalculatorInputProps {
  input: CalculatorInputType;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

function formatDisplayValue(value: number): string {
  return formatNumber(value, 0);
}

export function CalculatorInput({
  input,
  value,
  onChange,
  className,
}: CalculatorInputProps) {
  const { id, label, type, suffix, placeholder, tooltip, options, min, max, step } = input;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.-]/g, "");
    const num = raw === "" ? 0 : parseFloat(raw);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleSliderChange = (val: number[]) => {
    onChange(val[0] ?? input.defaultValue);
  };

  const renderTooltip = () => {
    if (!tooltip) return null;
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="ml-1 h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderSuffix = () => {
    if (!suffix) return null;
    return (
      <Badge
        variant="secondary"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0 text-xs font-normal"
      >
        {suffix}
      </Badge>
    );
  };

  if (type === "select" && options) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center">
          <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </Label>
          {renderTooltip()}
        </div>
        <Select
          value={String(value)}
          onValueChange={(v) => onChange(Number(v))}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "slider") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </Label>
            {renderTooltip()}
          </div>
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {formatDisplayValue(value)}
            {suffix && <span className="ml-0.5 text-xs font-normal text-gray-500">{suffix}</span>}
          </span>
        </div>
        <Slider
          id={id}
          value={[value]}
          onValueChange={handleSliderChange}
          min={min ?? 0}
          max={max ?? 100}
          step={step ?? 1}
          aria-label={label}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatDisplayValue(min ?? 0)}{suffix}</span>
          <span>{formatDisplayValue(max ?? 100)}{suffix}</span>
        </div>
      </div>
    );
  }

  // Default: number input
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
        {renderTooltip()}
      </div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={formatDisplayValue(value)}
          onChange={handleNumberChange}
          placeholder={placeholder ?? "Enter value..."}
          min={min}
          max={max}
          step={step}
          className={cn(
            "pr-12",
            "focus-visible:ring-primary-500",
          )}
        />
        {renderSuffix()}
      </div>
    </div>
  );
}
