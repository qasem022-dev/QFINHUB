/**
 * Augments calculator content with citations, definitions, key takeaways.
 * DeepSeek API version (Gemini key is leaked/blocked).
 * 
 * Usage: node scripts/augment-calc-content-ds.cjs
 * Reads: /tmp/calculators-data.json
 * Writes: /tmp/calculator-augment-output.json
 */

const https = require('https');
const fs = require('fs');
const { readFileSync } = require('fs');
const { resolve } = require('path');

try {
  const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
  env.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch (e) { console.error("Could not load .env.local"); }

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
if (!API_KEY) { console.error('DEEPSEEK_API_KEY not found'); process.exit(1); }
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

const allCalculators = require('/tmp/calculators-data.json');
console.log(`Loaded ${allCalculators.length} calculators`);

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
  const systemPrompt = `You are a financial content writer. Return ONLY valid JSON with NO markdown formatting, NO code fences.`;
  const userPrompt = `Generate 3 content items for the "${calc.title}" calculator (category: ${calc.category}, slug: ${calc.slug}).

Return ONLY this JSON object:
{
  "definition": "1-2 concise sentences defining this calculator, formatted for Google AI Overview featured snippets. Authoritative, clear language.",
  "keyTakeaways": ["3-4 factual bullet points. Each a complete sentence. Clean plain text — NO markdown, NO **, NO bullets, NO emoji."],
  "citations": ["2-3 authoritative source citations using: ${sources}. Format: 'Source Name — context' (e.g., 'IRS Publication 936 — Home Mortgage Interest Deduction'). Only real, verifiable government/financial sources."]
}`;

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1024,
      stream: false,
    });

    const req = https.request(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
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
          const text = parsed.choices?.[0]?.message?.content || '';
          let jsonText = text.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const result = JSON.parse(jsonText);
          console.log(`  [${index + 1}/${allCalculators.length}] ✓ ${calc.slug}`);
          resolve({ slug: calc.slug, ...result });
        } catch (e) {
          console.error(`  [${index + 1}] ✗ ${calc.slug} — Parse: ${e.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`  [${index + 1}] ✗ ${calc.slug} — Network: ${e.message}`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Generating citations, definitions, key takeaways via DeepSeek...\n');

  // Process in batches of 5 concurrent with 1s delay between calls
  const CONCURRENCY = 5;
  const allResults = [];

  for (let batchStart = 0; batchStart < allCalculators.length; batchStart += CONCURRENCY) {
    const batch = allCalculators.slice(batchStart, batchStart + CONCURRENCY);
    const promises = batch.map((calc, i) => {
      const delay = i * 1500; // Stagger starts
      return new Promise(resolve => {
        setTimeout(async () => {
          const r = await generateAugmentedContent(calc, batchStart + i);
          resolve(r);
        }, delay);
      });
    });
    const batchResults = await Promise.all(promises);
    allResults.push(...batchResults.filter(Boolean));
    if (batchStart + CONCURRENCY < allCalculators.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

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
}

main().catch(console.error);
