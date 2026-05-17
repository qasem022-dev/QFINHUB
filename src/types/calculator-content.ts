/**
 * Educational SEO content for a calculator page.
 * 500-800 words total across all fields.
 */
export interface CalculatorContent {
  /** Brief explanation of what this calculator does (2-3 sentences) */
  explanation: string;
  /** The mathematical formula the calculator uses (LaTeX or plain text) */
  formula: string;
  /** Formula description in plain language */
  formulaDescription: string;
  /** Real-world scenario where this calculator is useful (3-5 sentences) */
  realWorldUse: string;
  /** Practical example with numbers (2-3 sentences) */
  example: string;
  /** Key factors that affect the calculation (3-5 short points) */
  keyFactors: string[];
  /** Tips for using this calculator effectively (2-4 points) */
  tips: string[];
  /** Related calculator slugs for cross-linking */
  relatedCalculators: string[];
}
