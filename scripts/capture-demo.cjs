#!/usr/bin/env node
// Generate demo video screenshots using Playwright (from project)
const path = require('path');
const { chromium } = require(path.resolve('/home/admin1/qfinhub/node_modules/playwright'));
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { resolve } = require('path');

const OUT_DIR = '/tmp/pinterest-demo/frames';
const HTML_PATH = '/tmp/pinterest-demo/demo.html';

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  console.log('Opening demo HTML...');
  await page.goto('file://' + HTML_PATH, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Found ${slideCount} slides`);
  
  for (let i = 0; i < slideCount; i++) {
    const outPath = resolve(OUT_DIR, `slide-${String(i).padStart(2, '0')}.png`);
    console.log(`  Slide ${i + 1}/${slideCount}...`);
    
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      if (slides[idx]) slides[idx].scrollIntoView({ behavior: 'instant', block: 'start' });
    }, i);
    
    await page.waitForTimeout(300);
    await page.screenshot({ path: outPath });
    console.log(`    Saved: ${outPath}`);
  }
  
  await browser.close();
  console.log(`\n✅ All ${slideCount} slides captured!`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
