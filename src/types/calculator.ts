export type CategoryType =
  | "basic"
  | "investment"
  | "retirement"
  | "tax"
  | "loan"
  | "mortgage"
  | "business"
  | "personal";

export interface CalculatorConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryType;
  icon: React.ReactNode;
  color: string;
}

export interface CalculatorInput {
  id: string;
  label: string;
  type: "number" | "select" | "slider";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  tooltip?: string;
  options?: { label: string; value: string | number }[];
}

export interface CalculatorResult {
  label: string;
  value: string;
  format?: "currency" | "percentage" | "number" | "years";
  highlight?: boolean;
}

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  basic: "Basic",
  investment: "Investment",
  retirement: "Retirement",
  tax: "Tax",
  loan: "Loan",
  mortgage: "Mortgage",
  business: "Business",
  personal: "Personal",
};

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  investment:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  retirement:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  tax: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  loan: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  mortgage:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  business:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  personal:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};
