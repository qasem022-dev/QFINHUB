/**
 * V2 Decision Page Types
 */
export interface DecisionPage {
  /** URL slug — e.g., "can-i-afford-a-400k-home" */
  slug: string;
  /** Page title */
  title: string;
  /** Meta description (150-160 chars) */
  description: string;
  /** Primary calculator cluster */
  cluster: string;
  /** The financial decision question */
  question: string;
  /** Short answer (1-2 sentences, appears near top) */
  shortAnswer: string;
  /** Calculator-backed results */
  results: DecisionResult[];
  /** Assumptions used */
  assumptions: string[];
  /** Formula or methodology */
  methodology: string;
  /** Outcome table */
  table: DecisionTable;
  /** Alternative paths */
  alternatives: DecisionAlternative[];
  /** Risk/tradeoff analysis */
  risks: string[];
  /** What this means */
  whatThisMeans: string;
  /** Next steps */
  nextSteps: string[];
  /** FAQ items */
  faqs: Array<{ question: string; answer: string }>;
  /** Calculator links */
  calculatorLinks: string[];
  /** Supporting content links */
  supportingLinks: Array<{ url: string; label: string }>;
  /** Word count */
  wordCount: number;
  /** Schema type */
  schemaType: "Article" | "FAQPage";
}

export interface DecisionResult {
  label: string;
  value: string;
  detail?: string;
}

export interface DecisionTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface DecisionAlternative {
  name: string;
  outcome: string;
  pros: string[];
  cons: string[];
}
