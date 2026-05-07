import type { AICalculatorResponse, ChatMessage } from "@/types/ai";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a financial calculator AI that generates structured calculator configurations.

Your task is to parse the user's financial request and return ONLY valid JSON matching this schema:

{
  "title": "Calculator title",
  "description": "Brief description",
  "inputs": [
    {
      "id": "variable_name",
      "label": "Display Label",
      "type": "number|select|slider|text",
      "defaultValue": 10000,
      "min": 0,
      "max": 1000000,
      "step": 100,
      "suffix": "$",
      "options": [{"label": "Option", "value": 1}],
      "tooltip": "Helpful explanation"
    }
  ],
  "results": [
    {
      "id": "result_name",
      "label": "Result Label",
      "description": "What this result means",
      "formula": "principal * (1 + rate/100)^years",
      "format": "currency|percentage|number|years|ratio",
      "highlight": true
    }
  ],
  "chart": {
    "type": "line|bar|pie|area",
    "title": "Chart Title",
    "dataPoints": 30,
    "xLabel": "Year",
    "xFormula": "i + 1",
    "yFormulas": [
      { "key": "balance", "label": "Balance", "formula": "principal * (1 + rate/100)^(i+1)" }
    ]
  },
  "plan": {
    "summary": "Brief plan summary",
    "steps": [
      { "title": "Step title", "description": "Step details", "priority": "high|medium|low" }
    ],
    "tips": ["Tip 1", "Tip 2"]
  },
  "table": {
    "columns": [{ "key": "year", "label": "Year", "format": "number" }],
    "rows": 10,
    "rowLabel": "Year",
    "rowFormula": "i + 1",
    "cellFormulas": { "balance": "principal * (1 + rate/100)^(i+1)" }
  }
}

RULES:
1. Input IDs must be simple snake_case strings that can be used as variable names in formulas.
2. Formulas use input IDs as variables. Only use input IDs that exist in the inputs array.
3. Use 'i' as the iteration variable in chart/table formulas (0-indexed).
4. Create realistic default values that make sense for the calculation.
5. Design formulas that handle edge cases (avoid division by zero, handle negative values gracefully).
6. The chart config is OPTIONAL -- only include if chart data makes sense.
7. The plan config is OPTIONAL -- include actionable financial advice steps.
8. The table config is OPTIONAL -- include when showing year-by-year breakdowns.
9. Always include at least 2 inputs and 2 results.
10. Return ONLY the JSON object, no markdown, no explanation.

Example for "compound interest calculator":
{
  "title": "Compound Interest Calculator",
  "description": "Calculate how your investment grows over time with compound interest.",
  "inputs": [
    { "id": "principal", "label": "Initial Investment", "type": "number", "defaultValue": 10000, "min": 0, "max": 10000000, "step": 100, "suffix": "$", "tooltip": "The amount you plan to invest initially." },
    { "id": "rate", "label": "Annual Interest Rate", "type": "number", "defaultValue": 7, "min": 0, "max": 100, "step": 0.1, "suffix": "%", "tooltip": "Expected annual return rate." },
    { "id": "years", "label": "Investment Period", "type": "slider", "defaultValue": 10, "min": 1, "max": 50, "step": 1, "suffix": "years", "tooltip": "How long you plan to invest." },
    { "id": "contribution", "label": "Monthly Contribution", "type": "number", "defaultValue": 500, "min": 0, "max": 100000, "step": 50, "suffix": "$", "tooltip": "Additional amount you add each month." }
  ],
  "results": [
    { "id": "final_balance", "label": "Final Balance", "description": "Total value at the end of the investment period.", "formula": "principal * (1 + rate/100/12)^(years*12) + contribution * (((1 + rate/100/12)^(years*12) - 1) / (rate/100/12))", "format": "currency", "highlight": true },
    { "id": "total_contributions", "label": "Total Contributions", "description": "Total amount you contributed.", "formula": "principal + contribution * years * 12", "format": "currency" },
    { "id": "total_interest", "label": "Total Interest Earned", "description": "Total interest earned on your investment.", "formula": "max(0, principal * (1 + rate/100/12)^(years*12) + contribution * (((1 + rate/100/12)^(years*12) - 1) / (rate/100/12)) - (principal + contribution * years * 12))", "format": "currency", "highlight": true },
    { "id": "annual_return", "label": "Annualized Return", "description": "Effective annual return rate.", "formula": "rate", "format": "percentage" }
  ],
  "chart": {
    "type": "area",
    "title": "Investment Growth Over Time",
    "dataPoints": 30,
    "xLabel": "Year",
    "xFormula": "i + 1",
    "yFormulas": [
      { "key": "balance", "label": "Balance", "formula": "principal * (1 + rate/100/12)^((i+1)*12) + contribution * (((1 + rate/100/12)^((i+1)*12) - 1) / (rate/100/12))" },
      { "key": "contributions", "label": "Contributions", "formula": "principal + contribution * (i+1) * 12" }
    ]
  },
  "plan": {
    "summary": "A solid investment strategy that grows your wealth through compound interest and regular contributions.",
    "steps": [
      { "title": "Start Early", "description": "The earlier you start investing, the more time compound interest has to work.", "priority": "high" },
      { "title": "Increase Contributions", "description": "Try to increase your monthly contributions by 1-2% each year.", "priority": "medium" },
      { "title": "Diversify", "description": "Spread investments across different asset classes to manage risk.", "priority": "high" }
    ],
    "tips": ["Consider tax-advantaged accounts like 401(k) or IRA.", "Reinvest dividends to maximize compound growth.", "Review your portfolio annually and rebalance as needed."]
  },
  "table": {
    "columns": [{ "key": "year", "label": "Year", "format": "number" }, { "key": "balance", "label": "Balance", "format": "currency" }, { "key": "contributions", "label": "Contributions", "format": "currency" }],
    "rows": 10,
    "rowLabel": "Year",
    "rowFormula": "i + 1",
    "cellFormulas": { "year": "i + 1", "balance": "principal * (1 + rate/100/12)^((i+1)*12) + contribution * (((1 + rate/100/12)^((i+1)*12) - 1) / (rate/100/12))", "contributions": "principal + contribution * (i+1) * 12" }
  }
}`;

function isValidAICalculatorResponse(obj: unknown): obj is AICalculatorResponse {
  if (!obj || typeof obj !== "object") return false;
  const resp = obj as Record<string, unknown>;

  if (typeof resp.title !== "string" || typeof resp.description !== "string") return false;
  if (!Array.isArray(resp.inputs) || resp.inputs.length === 0) return false;
  if (!Array.isArray(resp.results) || resp.results.length === 0) return false;

  for (const input of resp.inputs) {
    if (!input || typeof input !== "object") return false;
    const inp = input as Record<string, unknown>;
    if (typeof inp.id !== "string" || typeof inp.label !== "string") return false;
    if (!["number", "select", "slider", "text"].includes(inp.type as string)) return false;
    if (typeof inp.defaultValue !== "number") return false;
  }

  for (const result of resp.results) {
    if (!result || typeof result !== "object") return false;
    const res = result as Record<string, unknown>;
    if (typeof res.id !== "string" || typeof res.label !== "string") return false;
    if (typeof res.formula !== "string") return false;
    if (!["currency", "percentage", "number", "years", "ratio"].includes(res.format as string)) return false;
  }

  return true;
}

function extractJSON(text: string): string {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return text.slice(jsonStart, jsonEnd + 1);
  }

  return text;
}

export async function generateCalculator(
  query: string,
  context?: ChatMessage[],
): Promise<AICalculatorResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Please add it to your .env.local file.",
    );
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (context && context.length > 0) {
    const recentMessages = context.slice(-10);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  messages.push({ role: "user", content: query });

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from DeepSeek API");
    }

    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);

    if (!isValidAICalculatorResponse(parsed)) {
      const fixed = parsed as Record<string, unknown>;
      if (!fixed.title) fixed.title = "AI Calculator";
      if (!fixed.description) fixed.description = "Custom calculator generated from your request.";
      if (!Array.isArray(fixed.inputs)) {
        fixed.inputs = [
          {
            id: "value",
            label: "Value",
            type: "number",
            defaultValue: 1000,
            min: 0,
          },
        ];
      }
      if (!Array.isArray(fixed.results)) {
        fixed.results = [
          {
            id: "result",
            label: "Result",
            description: "Calculated result",
            formula: "value",
            format: "number",
            highlight: true,
          },
        ];
      }
      return fixed as unknown as AICalculatorResponse;
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse AI response as JSON. Please try rephrasing your request.",
      );
    }
    throw error;
  }
}
