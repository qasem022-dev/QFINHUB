/**
 * V2: Calculator → Decision Page mappings for cross-linking.
 * Decision pages that support specific calculator hubs.
 * Updated: 2026-05-28 (10 decision pages)
 */

export const CALCULATOR_DECISION_LINKS: Record<string, Array<{ slug: string; title: string }>> = {
  "mortgage-calculator": [
    { slug: "can-i-afford-a-400k-home", title: "Can I Afford a $400,000 Home?" },
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
    { slug: "how-much-house-can-i-afford", title: "How Much House Can I Afford?" },
    { slug: "should-i-refinance-my-mortgage", title: "Should I Refinance My Mortgage?" },
  ],
  "mortgage-affordability": [
    { slug: "can-i-afford-a-400k-home", title: "Can I Afford a $400,000 Home?" },
    { slug: "how-much-house-can-i-afford", title: "How Much House Can I Afford?" },
  ],
  "rent-vs-buy": [
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
  ],
  "refinance-calculator": [
    { slug: "should-i-refinance-my-mortgage", title: "Should I Refinance My Mortgage?" },
  ],
  "debt-payoff": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "snowball-vs-avalanche-which-wins", title: "Snowball vs Avalanche" },
  ],
  "debt-snowball": [
    { slug: "snowball-vs-avalanche-which-wins", title: "Snowball vs Avalanche" },
  ],
  "credit-card-payoff": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "snowball-vs-avalanche-which-wins", title: "Snowball vs Avalanche" },
  ],
  "investment-return": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
  ],
  "compound-interest": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
    { slug: "how-much-do-i-need-to-retire", title: "How Much Do I Need to Retire?" },
  ],
  "retirement-planning": [
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
    { slug: "how-much-do-i-need-to-retire", title: "How Much Do I Need to Retire?" },
    { slug: "roth-vs-traditional-401k-decision", title: "Roth vs Traditional 401(k)" },
  ],
  "401k-calculator": [
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
    { slug: "how-much-do-i-need-to-retire", title: "How Much Do I Need to Retire?" },
    { slug: "roth-vs-traditional-401k-decision", title: "Roth vs Traditional 401(k)" },
  ],
  "tax-calculator": [
    { slug: "401k-vs-taxable-investing", title: "401(k) vs Taxable Investing" },
    { slug: "roth-vs-traditional-401k-decision", title: "Roth vs Traditional 401(k)" },
  ],
  "budget-planner": [
    { slug: "rent-vs-buy-with-100k-income", title: "Rent vs Buy on a $100k Income" },
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
  "fire-calculator": [
    { slug: "retire-at-45-with-1-million", title: "Retire at 45 With $1 Million?" },
  ],
  "loan-calculator": [
    { slug: "pay-off-debt-or-invest", title: "Pay Off Debt or Invest?" },
  ],
};
