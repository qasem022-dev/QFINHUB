import { readFileSync, existsSync } from "fs";
import { join } from "path";

let cachedIndex: Record<string, { batch: string; title: string; calculatorSlug: string; category: string }> | null = null;

function loadScenarioIndex() {
  if (cachedIndex) return cachedIndex;
  const indexPath = join(process.cwd(), "public", "data", "scenarios", "index.json");
  if (!existsSync(indexPath)) return {};
  cachedIndex = JSON.parse(readFileSync(indexPath, "utf-8"));
  return cachedIndex!;
}

export interface ScenarioLink {
  slug: string;
  title: string;
  calculatorSlug: string;
  category: string;
}

export function getScenariosForCalculator(calculatorSlug: string, maxResults = 8): ScenarioLink[] {
  const index = loadScenarioIndex();
  if (Object.keys(index).length === 0) return [];

  const matches: ScenarioLink[] = [];
  for (const [slug, entry] of Object.entries(index)) {
    if (entry.calculatorSlug === calculatorSlug) {
      matches.push({
        slug,
        title: entry.title,
        calculatorSlug: entry.calculatorSlug,
        category: entry.category,
      });
      if (matches.length >= maxResults) break;
    }
  }
  return matches;
}

export function getAllScenarioLinks(): ScenarioLink[] {
  const index = loadScenarioIndex();
  return Object.entries(index).map(([slug, entry]) => ({
    slug,
    title: entry.title,
    calculatorSlug: entry.calculatorSlug,
    category: entry.category,
  }));
}
