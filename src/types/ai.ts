export interface AICalculatorInput {
  id: string;
  label: string;
  type: "number" | "select" | "slider" | "text";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  options?: { label: string; value: number }[];
  tooltip?: string;
}

export interface AICalculatorResult {
  id: string;
  label: string;
  description: string;
  formula: string;
  format: "currency" | "percentage" | "number" | "years" | "ratio";
  highlight?: boolean;
}

export interface AIChartConfig {
  type: "line" | "bar" | "pie" | "area";
  title: string;
  dataPoints: number;
  xLabel: string;
  xFormula: string;
  yFormulas: { key: string; label: string; formula: string }[];
}

export interface AIPlanStep {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface AIPlan {
  summary: string;
  steps: AIPlanStep[];
  tips: string[];
}

export interface AITableConfig {
  columns: { key: string; label: string; format?: "currency" | "percentage" | "number" }[];
  rows: number;
  rowLabel: string;
  rowFormula: string;
  cellFormulas: Record<string, string>;
}

export interface AICalculatorResponse {
  title: string;
  description: string;
  inputs: AICalculatorInput[];
  results: AICalculatorResult[];
  chart?: AIChartConfig;
  plan?: AIPlan;
  table?: AITableConfig;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  calculator?: AICalculatorResponse;
}

export interface SavedPlan {
  id: string;
  user_id: string;
  title: string;
  config: AICalculatorResponse;
  created_at: string;
  updated_at?: string;
}
