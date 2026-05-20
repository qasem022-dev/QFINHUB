/**
 * Augments existing calculator content with 3 new fields:
 * - citations: 2-3 authoritative sources (IRS, CFPB, Federal Reserve, BLS, SEC, FTC)
 * - definition: 1-2 sentence concise definition for AI Overview featured snippets
 * - keyTakeaways: 3-4 bullet points for AI Overview "Key Takeaways" panel
 *
 * Usage: node scripts/augment-calc-content.cjs
 * Reads: /tmp/calculators-data.json
 * Writes: /tmp/calculator-augment-output.json
 */

const https = require('https');
const fs = require('fs');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load .env.local
try {
  const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
  env.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch (e) {
  console.error("Could not load .env.local");
}

const API_KEY = process.env.GEMINI_API_KEY || '';
if (!API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1); }
const MODEL = 'gemini-3.1-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

const allCalculators = require('/tmp/calculators-data.json');
console.log(`Loaded ${allCalculators.length} calculators`);

// Source authority map by category for context
const categorySources = {
  'Mortgage': 'CFPB, Federal Reserve, HUD',
  'Loan': 'CFPB, Federal Reserve, FTC',
  'Investment': 'SEC, Federal Reserve, FINRA',
  'Retirement': 'IRS, Social Security Administration, Department of Labor',
  'Tax': 'IRS, Treasury Department, Tax Foundation',
  'Savings': 'FDIC, Federal Reserve, CFPB',
  'Debt': 'CFPB, FTC, Federal Reserve',
  'Credit Card': 'CFPB, Federal Reserve, FTC',
  'Auto': 'CFPB, Federal Reserve, FTC',
  'Business': 'SBA, IRS, Bureau of Labor Statistics',
  'Insurance': 'NAIC, State Insurance Departments, CFPB',
  'Budget': 'CFPB, Bureau of Labor Statistics, Federal Reserve',
  'Real Estate': 'Federal Reserve, HUD, NAR',
  'Education': 'Department of Education, Federal Student Aid, CFPB',
  'General': 'CFPB, Federal Reserve, IRS',
  'Banking': 'FDIC, Federal Reserve, CFPB',
  'Credit': 'CFPB, FTC, Federal Reserve',
  'Other': 'Federal Reserve, CFPB, IRS',
};

function getCategorySources(category) {
  return categorySources[category] || categorySources['General'];
}

async function generateAugmentedContent(calc, index) {
  const sources = getCategorySources(calc.category);
  const prompt = `You are a financial content writer for QFINHUB, a free online financial calculator platform.

Generate 3 specific content items for the "${calc.title}" calculator (slug: ${calc.slug}, category: ${calc.category}).

Return ONLY valid JSON, no markdown formatting, no code fences:

{
  "definition": "1-2 concise sentences defining what this calculator does, formatted for Google AI Overview featured snippets. Use clear, authoritative language suitable for a definition panel.",
  "keyTakeaways": ["3-4 short bullet-point key takeaways. Each should be a complete factual sentence. Format as a plain string array — NO markdown formatting of any kind (no **, no -, no bullets, no emoji). Just clean plain text facts."],
  "citations": ["2-3 authoritative source citations. Use these trusted sources: ${sources}. Format: 'Source Name — relevant context' (e.g., 'IRS Publication 936 — Home Mortgage Interest Deduction guidelines'). Only cite real, verifiable government/financial sources relevant to this calculator."]
}

Calculator details:
- Title: ${calc.title}
- Description: ${calc.description}
- Category: ${calc.category}
- Slug: ${calc.slug}

Respond with ONLY the JSON object, no other text.`;

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    });

    const req = https.request(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.error(`  [${index + 1}] ✗ ${calc.slug} — API error: ${parsed.error.message}`);
            resolve(null);
            return;
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          let jsonText = text.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const result = JSON.parse(jsonText);
          console.log(`  [${index + 1}/${allCalculators.length}] ✓ ${calc.slug}`);
          resolve({ slug: calc.slug, ...result });
        } catch (e) {
          console.error(`  [${index + 1}] ✗ ${calc.slug} — Parse error: ${e.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`  [${index + 1}] ✗ ${calc.slug} — Network error: ${e.message}`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function processBatch(batch, startIdx) {
  const results = [];
  for (let i = 0; i < batch.length; i++) {
    const r = await generateAugmentedContent(batch[i], startIdx + i);
    if (r) results.push(r);
    if (i < batch.length - 1) {
      await new Promise(r => setTimeout(r, 400)); // 400ms delay
    }
  }
  return results;
}

async function main() {
  console.log(`Generating citations, definitions, and key takeaways for ${allCalculators.length} calculators...`);
  console.log('');

  const CONCURRENCY = 5;
  const batchSize = Math.ceil(allCalculators.length / CONCURRENCY);
  const batches = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, allCalculators.length);
    if (start < allCalculators.length) {
      batches.push({ batch: allCalculators.slice(start, end), startIdx: start });
    }
  }

  const batchResults = await Promise.all(batches.map(b => processBatch(b.batch, b.startIdx)));
  const allResults = batchResults.flat();

  // Write output
  const output = {};
  for (const r of allResults) {
    output[r.slug] = {
      definition: r.definition,
      keyTakeaways: r.keyTakeaways,
      citations: r.citations,
    };
  }

  fs.writeFileSync('/tmp/calculator-augment-output.json', JSON.stringify(output, null, 2));
  console.log(`\nDone. ${Object.keys(output).length}/${allCalculators.length} calculators augmented.`);
  console.log('Output: /tmp/calculator-augment-output.json');
}

main().catch(console.error);
