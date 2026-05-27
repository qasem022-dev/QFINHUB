#!/usr/bin/env node
/**
 * Emergency blog post generator — targets top GSC query + trending topics
 * Run: node .optimizer-data/emergency-blog.mjs
 */
import { readFileSync, appendFileSync } from 'fs';
import { resolve } from 'path';

// Load env
const envPath = resolve('/home/admin1/qfinhub/.env.local');
try {
  const env = readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch (e) { console.error("Could not load .env.local"); }

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_KEY) { console.error("No DeepSeek key"); process.exit(1); }

async function generateBlogPost(topic, keyword, spikePct, targetUrl) {
  const prompt = `Generate a comprehensive SEO-optimized blog post HTML (single line, no newlines) about financial calculations. The keyword "${keyword}" has ${spikePct}% search spike.

Title: "${topic}"
Meta description: "Free ${keyword.toLowerCase()} — calculate instantly. See your monthly payment, total interest, and full breakdown. No signup, 100% free, updated for 2026."

Requirements:
- 800+ words content as single-line HTML string
- Use <h2>, <h3>, <p>, <ul>/<li>, <strong> tags only
- No markdown, no backticks, no newlines
- Include internal links to relevant calculator pages with absolute URLs and target="_blank"
- Calculators to link: ${targetUrl}
- Structure: <h2>TL;DR</h2><p>summary</p><h2>What Is It</h2><h2>How to Calculate</h2><h2>Example</h2><h2>Key Factors</h2><h2>Frequently Asked Questions</h2><h3>FAQ items</h3><h2>Conclusion</h2>
- All quotes escaped (\")
- relatedCalculators: array of calculator slugs ["mortgage-calculator", "mortgage-affordability", "loan-calculator", "amortization-schedule"]
- readingTime: number of minutes
- Output format: JSON object with fields: title, description, content (string), relatedCalculators (string array), readingTime (number)`;

  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a financial SEO content writer. Output ONLY valid JSON. No markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 4096,
    })
  });

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || '';
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, ''));
}

async function main() {
  // Blog post 1: Top GSC query
  console.log("Generating emergency blog post 1: $20,000 loan payment...");
  try {
    const post1 = await generateBlogPost(
      "If You Borrow $20,000 for 5 Years at 8% APR — What's Your Monthly Payment?",
      "20,000 loan over 5 years monthly payments",
      "15",
      "https://www.qfinhub.com/tools/loan-20k-5yr-8pct (main), https://www.qfinhub.com/calculators/loan-calculator, https://www.qfinhub.com/calculators/debt-consolidation, https://www.qfinhub.com/calculators/personal-loan"
    );
    
    const postStr = JSON.stringify(post1, null, 2);
    console.log("Post 1 generated:", post1.title);
    
    // Blog post 2: Mortgage rates trending
    console.log("Generating emergency blog post 2: mortgage rates June 2026...");
    const post2 = await generateBlogPost(
      "Mortgage Rates June 2026 — Current Rates & Home Affordability Calculator",
      "mortgage rates june 2026",
      "25",
      "https://www.qfinhub.com/calculators/mortgage-calculator, https://www.qfinhub.com/calculators/mortgage-affordability, https://www.qfinhub.com/calculators/refinance-calculator, https://www.qfinhub.com/tools/afford-100k-40k-6-5pct"
    );
    console.log("Post 2 generated:", post2.title);
    
    // Save both
    const output = JSON.stringify([post1, post2], null, 2);
    const fs = await import('fs');
    fs.writeFileSync('/tmp/emergency-blog-posts.json', output);
    console.log("Saved to /tmp/emergency-blog-posts.json");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
