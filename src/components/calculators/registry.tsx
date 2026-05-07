import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const calculatorMap: Record<string, ComponentType<any>> = {
  "compound-interest": dynamic(() => import("./impl/compound-interest")),
  "simple-interest": dynamic(() => import("./impl/simple-interest")),
  "investment-return": dynamic(() => import("./impl/investment-return")),
  "retirement-planning": dynamic(() => import("./impl/retirement-planning")),
  "loan-calculator": dynamic(() => import("./impl/loan-calculator")),
  "mortgage-calculator": dynamic(() => import("./impl/mortgage-calculator")),
  "mortgage-affordability": dynamic(() => import("./impl/mortgage-affordability")),
  "roi-calculator": dynamic(() => import("./impl/roi-calculator")),
  "break-even": dynamic(() => import("./impl/break-even")),
  "budget-planner": dynamic(() => import("./impl/budget-planner")),
  "net-worth": dynamic(() => import("./impl/net-worth")),
  "savings-goal": dynamic(() => import("./impl/savings-goal")),
  "inflation-calculator": dynamic(() => import("./impl/inflation-calculator")),
  "stock-return": dynamic(() => import("./impl/stock-return")),
  "dividend-calculator": dynamic(() => import("./impl/dividend-calculator")),
  "dollar-cost-average": dynamic(() => import("./impl/dollar-cost-average")),
  "401k-calculator": dynamic(() => import("./impl/401k-calculator")),
  "tax-calculator": dynamic(() => import("./impl/tax-calculator")),
  "capital-gains-tax": dynamic(() => import("./impl/capital-gains-tax")),
  "amortization-schedule": dynamic(() => import("./impl/amortization-schedule")),
  "debt-payoff": dynamic(() => import("./impl/debt-payoff")),
  "rent-vs-buy": dynamic(() => import("./impl/rent-vs-buy")),
};

export function getCalculatorComponent(
  slug: string,
): ComponentType<any> | null {
  return calculatorMap[slug] ?? null;
}
