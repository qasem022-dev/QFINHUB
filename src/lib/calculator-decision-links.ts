/**
 * V2: Calculator → Decision Page mappings for cross-linking.
 * Decision pages that support specific calculator hubs.
 * Updated: 2026-05-28
 */

export const CALCULATOR_DECISION_LINKS: Record<string, Array<{ slug: string; title: string }>> = {
  "mortgage-calculator": [
    { slug: "can-i-afford-a-400k-home", title: "Can I Afford a $400,000 Home?" },
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
  ],
  "mortgage-affordability": [
    { slug: "can-i-afford-a-400k-home", title: "Can I Afford a $400,000 Home?" },
  ],
  "rent-vs-buy": [
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
  ],
  "debt-payoff": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
  "investment-return": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
  ],
  "compound-interest": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
  ],
  "retirement-planning": [
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
  ],
  "401k-calculator": [
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
  ],
  "tax-calculator": [
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
  ],
  "budget-planner": [
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
  "fire-calculator": [
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
  ],
  "credit-card-payoff": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
  "loan-calculator": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
};
