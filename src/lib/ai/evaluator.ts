import { create, all, type MathJsInstance } from "mathjs";
import type { AIChartConfig, AITableConfig } from "@/types/ai";

const math: MathJsInstance = create(all as any);

/**
 * Safely evaluate a math expression with given variables.
 * Handles errors gracefully, returning 0 for invalid expressions.
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>,
): number {
  try {
    // Build scope from variables
    const scope: Record<string, number> = { ...variables };

    // Add math constants
    scope.PI = Math.PI;
    scope.E = Math.E;

    // Normalize formula
    const normalized = formula
      .replace(/−−/g, "+") // double negative
      .replace(/\\/g, "/"); // backslash to forward slash

    // Use mathjs evaluate with scope
    let result = math.evaluate(normalized, scope);

    if (typeof result === "bigint") return Number(result);
    if (result?.toNumber) result = result.toNumber();

    const num = Number(result);
    return isFinite(num) ? num : 0;
  } catch {
    // Silently fail and return 0 for invalid formulas
    return 0;
  }
}

/**
 * Format a value according to the specified format type.
 */
export function formatResultValue(
  value: number,
  format: "currency" | "percentage" | "number" | "years" | "ratio",
): string {
  if (!isFinite(value) || isNaN(value)) return "—";

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    case "percentage":
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    case "years":
      return `${value.toFixed(1)} years`;
    case "ratio":
      return value.toFixed(2);
    case "number":
    default:
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
  }
}

/**
 * Generate chart data from chart config and input variables.
 */
export function generateChartData(
  chart: AIChartConfig,
  variables: Record<string, number>,
): Record<string, string | number>[] {
  const data: Record<string, string | number>[] = [];

  try {
    for (let i = 0; i < chart.dataPoints; i++) {
      const point: Record<string, string | number> = {};

      // Calculate x value
      const xValue = evaluateFormula(chart.xFormula, { ...variables, i });
      point[chart.xLabel] = Math.round(xValue * 100) / 100;

      // Calculate y values
      for (const yf of chart.yFormulas) {
        const yValue = evaluateFormula(yf.formula, { ...variables, i });
        point[yf.key] = Math.round(yValue * 100) / 100;
      }

      data.push(point);
    }
  } catch {
    // Return empty array on error
  }

  return data;
}

/**
 * Generate table data from table config and input variables.
 */
export function generateTableData(
  table: AITableConfig,
  variables: Record<string, number>,
): Record<string, string | number>[] {
  const data: Record<string, string | number>[] = [];

  try {
    for (let i = 0; i < table.rows; i++) {
      const row: Record<string, string | number> = {};

      // Generate cell values
      for (const col of table.columns) {
        const formula = table.cellFormulas[col.key];
        if (formula) {
          const value = evaluateFormula(formula, { ...variables, i });
          if (col.format && col.format !== "number") {
            row[col.key] = formatResultValue(value, col.format);
          } else {
            row[col.key] = Math.round(value * 100) / 100;
          }
        } else {
          row[col.key] = i + 1;
        }
      }

      data.push(row);
    }
  } catch {
    // Return empty array on error
  }

  return data;
}

/**
 * Generate compound data points from a formula over iterations.
 */
export function generateCompoundData(
  formula: string,
  variables: Record<string, number>,
  dataPoints: number,
): number[] {
  const values: number[] = [];

  try {
    for (let i = 0; i < dataPoints; i++) {
      const value = evaluateFormula(formula, { ...variables, i });
      values.push(Math.round(value * 100) / 100);
    }
  } catch {
    // Return empty array on error
  }

  return values;
}
