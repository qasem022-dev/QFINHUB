/**
 * Public API for QFINHUB Calculator Data
 * Developer-friendly REST API that returns calculator configurations,
 * sample calculations, and embed data.
 *
 * Each API response includes attribution linking back to QFINHUB.
 */

import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import type { CalculatorConfig } from "@/types/calculator";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.qfinhub.com";

export interface ApiCalculatorResponse {
  calculator: CalculatorConfig;
  embedUrl: string;
  widgetUrl: string;
  apiUrl: string;
  hasImplementation: boolean;
  attribution: {
    name: string;
    url: string;
  };
}

export interface ApiListResponse {
  count: number;
  calculators: ApiCalculatorResponse[];
  attribution: {
    name: string;
    url: string;
  };
  apiVersion: string;
  documentation: string;
}

const API_VERSION = "v1";

/**
 * Get the API response for a single calculator.
 */
export function getApiCalculator(slug: string): ApiCalculatorResponse | null {
  const calc = getCalculatorBySlug(slug);
  if (!calc) return null;

  return {
    calculator: calc,
    embedUrl: `${BASE_URL}/calculators/${slug}`,
    widgetUrl: `${BASE_URL}/api/widget/${slug}`,
    apiUrl: `${BASE_URL}/api/${API_VERSION}/calculators/${slug}`,
    hasImplementation: !!getCalculatorComponent(slug),
    attribution: {
      name: "QFINHUB",
      url: BASE_URL,
    },
  };
}

/**
 * Get the API response for all calculators.
 */
export function getApiAllCalculators(): ApiListResponse {
  const calculators = allCalculators
    .filter((calc) => !!getCalculatorComponent(calc.slug))
    .map((calc) => getApiCalculator(calc.slug))
    .filter(Boolean) as ApiCalculatorResponse[];

  return {
    count: calculators.length,
    calculators,
    attribution: {
      name: "QFINHUB",
      url: BASE_URL,
    },
    apiVersion: API_VERSION,
    documentation: `${BASE_URL}/api/docs`,
  };
}

/**
 * Generate API documentation content.
 * Used to create an API docs page.
 */
export function getApiDocsContent(): string {
  return `# QFINHUB Public API

## Overview

QFINHUB provides a free, public REST API for accessing financial calculator data.
No API key required. Free for non-commercial and commercial use with attribution.

## Base URL

\`${BASE_URL}/api/${API_VERSION}\`

## Endpoints

### List All Calculators

\`\`\`
GET ${BASE_URL}/api/${API_VERSION}/calculators
\`\`\`

Returns all available calculators with metadata, embed URLs, and widget URLs.

### Get Single Calculator

\`\`\`
GET ${BASE_URL}/api/${API_VERSION}/calculators/:slug
\`\`\`

Returns detailed information about a specific calculator.

### Get Calculator Widget

\`\`\`
GET ${BASE_URL}/api/widget/:slug
\`\`\`

Returns an embeddable HTML widget for the calculator. Use this in an iframe.

## Response Format

All responses are JSON with an \`attribution\` field.

## Attribution

When displaying calculator data from the API, you must include attribution:
"Powered by QFINHUB" with a link to https://qfinhub.com

## Rate Limits

- 100 requests per minute per IP
- No API key required

## Examples

### Get loan calculator data:
\`\`\`javascript
fetch('${BASE_URL}/api/${API_VERSION}/calculators/loan-calculator')
  .then(res => res.json())
  .then(console.log);
\`\`\`

### Embed a mortgage calculator:
\`\`\`html
<iframe
  src="${BASE_URL}/api/widget/mortgage-calculator"
  width="100%"
  height="500"
  frameborder="0"
  loading="lazy">
</iframe>
\`\`\`
`;
}
