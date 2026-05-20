/**
 * Generates SEO educational content for a batch of calculators using Google Gemini API.
 * 
 * Usage: node scripts/generate-calc-content.cjs <start-index> <count>
 * Example: node scripts/generate-calc-content.cjs 0 16 (first 16 calculators)
 * 
 * Content is appended to /tmp/calculator-content-output.json
 */

const https = require('https');
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
const MODEL = 'gemini-3.1-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

const allCalculators = require('/tmp/calculators-data.json');

const startIdx = parseInt(process.argv[2] || '0');
const count = parseInt(process.argv[3] || '1');
const batch = allCalculators.slice(startIdx, startIdx + count);

let results = [];

async function generateContent(calc, index) {
  const prompt = `You are a financial content writer for QFINHUB, a free online financial calculator platform.

Generate comprehensive SEO-optimized educational content for the "${calc.title}" calculator (category: ${calc.category}).

The content must be at least 500 words and include ALL these sections. Return ONLY valid JSON, no markdown formatting, no code fences:

{
  "explanation": "2-3 sentence explanation of what this calculator does and why it matters",
  "formula": "The mathematical formula in plain text (e.g., A = P(1 + r/n)^(nt))",
  "formulaDescription": "1-2 sentence plain-language description of what the formula means",
  "realWorldUse": "3-5 sentences describing a real-world scenario where someone would use this calculator",
  "example": "2-3 sentence practical example with specific numbers",
  "keyFactors": ["3-5 short factors that affect the calculation"],
  "tips": ["2-4 practical tips for using this calculator effectively"],
  "relatedCalculators": ["2-4 related calculator slugs from this list that users might also need"]
}

Calculator details:
- Title: ${calc.title}
- Slug: ${calc.slug}
- Description: ${calc.description}
- Category: ${calc.category}

Available calculator slugs for relatedCalculators (choose 2-4 most relevant, NOT including "${calc.slug}"):
compound-interest, simple-interest, investment-return, retirement-planning, loan-calculator, mortgage-calculator, mortgage-affordability, roi-calculator, budget-planner, net-worth, savings-goal, inflation-calculator, tax-calculator, auto-loan, student-loan, personal-loan, debt-snowball, debt-avalanche, refinance-calculator, fha-loan, va-loan, roth-ira, traditional-ira, social-security, 401k-calculator, pension-calculator, credit-card-payoff, em-fund, college-savings, car-affordability, life-insurance, capital-gains-tax, amortization-schedule, annuity-calculator, present-value, future-value, irr-calculator, npv-calculator

Respond with ONLY the JSON object, no other text.`;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
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
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Extract JSON from the response
          let jsonText = text.trim();
          // Remove markdown code fences if present
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const content = JSON.parse(jsonText);
          results.push({ slug: calc.slug, content });
          console.log(`  [${index + 1}/${batch.length}] ✓ ${calc.slug} — ${calc.title}`);
          resolve();
        } catch (e) {
          console.error(`  [${index + 1}/${batch.length}] ✗ ${calc.slug} — Parse error:`, e.message);
          resolve(); // Continue despite error
        }
      });
    });

    req.on('error', (e) => {
      console.error(`  [${index + 1}/${batch.length}] ✗ ${calc.slug} — Network error:`, e.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Generating content for ${batch.length} calculators (index ${startIdx}–${startIdx + count - 1})...`);
  console.log(`Batch: ${batch.map(c => c.slug).join(', ')}`);
  console.log('');

  // Process sequentially to respect API rate limits
  for (let i = 0; i < batch.length; i++) {
    await generateContent(batch[i], i);
    // Small delay between calls to avoid rate limiting
    if (i < batch.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Write results
  const fs = require('fs');
  const existingPath = '/tmp/calculator-content-output.json';
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  } catch (e) { /* file doesn't exist yet */ }

  for (const r of results) {
    existing[r.slug] = r.content;
  }

  fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2));
  console.log(`\nDone. Total entries in output: ${Object.keys(existing).length}`);
  console.log(`Batch succeeded: ${results.length}/${batch.length}`);
}

main().catch(console.error);
