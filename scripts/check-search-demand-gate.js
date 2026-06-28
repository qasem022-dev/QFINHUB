#!/usr/bin/env node
/**
 * check-search-demand-gate.js — Phase 35.2 Automatic Enforcement
 *
 * Prevents imagination-first publishing by requiring evidence files for any
 * SEO-sensitive file change. Fails the build/pre-deploy step if evidence is
 * missing or scores fall below mandatory thresholds.
 *
 * Usage:
 *   node scripts/check-search-demand-gate.js                     # Git diff (staged+unstaged)
 *   node scripts/check-search-demand-gate.js --files "a.ts b.ts" # Explicit file list
 *   node scripts/check-search-demand-gate.js --staged            # Staged changes only (local/agent)
 *   node scripts/check-search-demand-gate.js --ci                # CI mode (deploy commit range)
 *   node scripts/check-search-demand-gate.js --all               # Full repo audit scan
 *   node scripts/check-search-demand-gate.js --since HEAD~1      # Changes since commit
 *
 * CI mode detection fallback order:
 *   1. VERCEL_GIT_COMMIT_SHA + previous commit → diff those
 *   2. HEAD~1..HEAD local git history
 *   3. Conservative full-SEO-sensitive-file scan (fail-safe — never pass blindly)
 *
 * Exit codes:
 *   0 = All checks passed or no SEO-sensitive files changed
 *   1 = Gate failure (missing evidence or low scores)
 *   2 = Script error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Configuration ────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(PROJECT_ROOT, '.optimizer-data', 'search-demand-gate');
const FAILURE_REPORT_DIR = path.join(PROJECT_ROOT, '.optimizer-data', 'phase35');

// Mandatory score thresholds (from Search-Demand-First rule)
const THRESHOLDS = {
  searchDemandScore: 70,
  clickPotentialScore: 70,
  uniquenessScore: 90,
  adSenseSafetyScore: 90,
};

// SEO-sensitive file patterns → page identifier extraction
// Each entry: { pattern (regex), extractId(filePath), label }
const SEO_SENSITIVE_PATTERNS = [
  // Calculator metadata / titles
  {
    regex: /src\/app\/calculators\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'calculator-metadata',
    label: 'Calculator metadata/titles (ctrTitles in page.tsx)',
  },
  // Calculator config (title, description)
  {
    regex: /src\/lib\/calculators\/index\.ts$/,
    extractId: (fp) => 'calculator-config',
    label: 'Calculator config (title/description in index.ts)',
  },
  // Calculator content
  {
    regex: /src\/lib\/calculators\/calculator-content\.ts$/,
    extractId: (fp) => 'calculator-content',
    label: 'Calculator long-form content',
  },
  // Blog posts data
  {
    regex: /src\/lib\/blog\/posts\.ts$/,
    extractId: (fp) => 'blog-posts-data',
    label: 'Blog posts data (posts.ts)',
  },
  // Blog post page (individual blog — extract slug from posts.ts or filename)
  {
    regex: /src\/app\/blog\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'blog-page-template',
    label: 'Blog page template',
  },
  // Individual blog content files / MDX
  {
    regex: /src\/content\/blog\/(.+)\.(mdx?|json)$/,
    extractId: (fp) => {
      const m = fp.match(/src\/content\/blog\/(.+)\.(mdx?|json)$/);
      return m ? `blog-${m[1].replace(/\//g, '-')}` : 'blog-content';
    },
    label: 'Blog post content file',
  },
  // Guide page template
  {
    regex: /src\/app\/guides\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'guide-page-template',
    label: 'Guide page template',
  },
  // Comparison page template
  {
    regex: /src\/app\/compare\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'comparison-page-template',
    label: 'Comparison page template',
  },
  // Comparison data
  {
    regex: /src\/lib\/programmatic-seo\/comparisons\.ts$/,
    extractId: (fp) => 'comparisons-data',
    label: 'Comparison pages data',
  },
  // Scenario page template
  {
    regex: /src\/app\/scenario\/\[id\]\/page\.tsx$/,
    extractId: (fp) => 'scenario-page-template',
    label: 'Scenario page template',
  },
  // Decision page template
  {
    regex: /src\/app\/decision\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'decision-page-template',
    label: 'Decision page template',
  },
  // Decision pages data
  {
    regex: /src\/lib\/decision-pages\.ts$/,
    extractId: (fp) => 'decision-pages-data',
    label: 'Decision pages data',
  },
  // Loan scenario pages
  {
    regex: /src\/app\/loan-scenarios\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'loan-scenario-template',
    label: 'Loan scenario page template',
  },
  // Loan scenarios generator
  {
    regex: /src\/lib\/programmatic-seo\/(generator|loan-scenarios)/,
    extractId: (fp) => 'programmatic-seo-generator',
    label: 'Programmatic SEO page generator',
  },
  // Data page
  {
    regex: /src\/app\/data\/page\.tsx$/,
    extractId: (fp) => 'data-page',
    label: 'Data page',
  },
  // Loan payment table
  {
    regex: /src\/app\/loan-payment-table\/page\.tsx$/,
    extractId: (fp) => 'loan-payment-table',
    label: 'Loan payment table page',
  },
  // Sitemap
  {
    regex: /src\/app\/sitemap\.ts$/,
    extractId: (fp) => 'sitemap',
    label: 'Sitemap configuration',
  },
  // Tool variant page template
  {
    regex: /src\/app\/tools\/\[slug\]\/page\.tsx$/,
    extractId: (fp) => 'tool-variant-template',
    label: 'Tool variant page template',
  },
  // Geo-targeted calculator pages
  {
    regex: /src\/app\/calculators\/\[slug\]\/\[geo\]\/page\.tsx$/,
    extractId: (fp) => 'geo-calculator-template',
    label: 'Geo-targeted calculator page template',
  },
  // Geo-targeted data
  {
    regex: /src\/lib\/programmatic-seo\/data\/us-cities\.ts$/,
    extractId: (fp) => 'geo-cities-data',
    label: 'Geo-targeted cities data',
  },
  // Widget pages (embed pages — SEO-relevant)
  {
    regex: /src\/app\/widgets\/.+\/page\.tsx$/,
    extractId: (fp) => 'widget-pages',
    label: 'Widget/embed page',
  },
  // Embed pages
  {
    regex: /src\/app\/embed\/.+\/page\.tsx$/,
    extractId: (fp) => 'embed-pages',
    label: 'Embed page',
  },
  // New SEO pages (any new page.tsx in app router that's in sitemap or SEO-adjacent)
  {
    regex: /src\/app\/(?!auth\/|\(dashboard\)\/|api\/|all-pages\/).*\/page\.tsx$/,
    extractId: (fp) => {
      // Extract route segment as slug
      const m = fp.match(/src\/app\/(.+)\/page\.tsx$/);
      if (!m) return null;
      const route = m[1].replace(/\[([^\]]+)\]/g, ':$1').replace(/\//g, '-');
      return `new-page-${route}`;
    },
    label: 'New SEO-relevant app route page',
    isCatchall: true, // Only fires if no other pattern matched
  },
];

// Non-SEO pages (auth, dashboard, api, admin-only, noindexed, etc.)
const NON_SEO_PATTERNS = [
  /src\/app\/auth\//,
  /src\/app\/\(dashboard\)\//,
  /src\/app\/api\//,
  /src\/app\/all-pages\//,
  /src\/app\/cookies\//,
  /src\/app\/disclaimer\//,
  /src\/app\/privacy\//,
  /src\/app\/terms\//,
  /src\/app\/contact\//,
  /src\/app\/about\//,
  /src\/app\/methodology\//,
  /src\/app\/editorial-policy\//,
  /src\/app\/for-ai-developers\//,
  /src\/components\//,   // Components aren't pages
  /src\/lib\/(?!calculators|blog|programmatic-seo|decision-pages)/, // Non-SEO lib files
  /\.test\./,
  /\.spec\./,
  /__tests__\//,
  /node_modules\//,
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function isNonSEOPage(filePath) {
  return NON_SEO_PATTERNS.some((p) => p.test(filePath));
}

function getSEOFileInfo(filePath) {
  // Check specific patterns first
  for (const pattern of SEO_SENSITIVE_PATTERNS) {
    if (pattern.regex.test(filePath)) {
      return {
        id: pattern.extractId(filePath),
        label: pattern.label,
        isCatchall: !!pattern.isCatchall,
      };
    }
  }
  return null;
}

function getGitChangedFiles(mode) {
  let cmd;
  if (mode === '--staged') {
    cmd = 'git diff --cached --name-only --diff-filter=ACMR';
  } else if (mode && mode.startsWith('--since')) {
    const ref = mode.split(' ')[1] || 'HEAD~1';
    cmd = `git diff --name-only --diff-filter=ACMR ${ref}..HEAD`;
  } else {
    // All uncommitted changes (staged + unstaged)
    cmd = 'git diff --name-only --diff-filter=ACMR HEAD';
  }
  try {
    const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 5000 });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * CI mode: detect changed files for the deployment commit.
 * Fallback order:
 *   1. VERCEL_GIT_COMMIT_SHA env var — diff with previous commit
 *   2. Local git HEAD~1..HEAD
 *   3. Return null → caller runs conservative full scan
 */
function getCIChangedFiles() {
  // Strategy 1: Vercel provides VERCEL_GIT_COMMIT_SHA
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (commitSha) {
    try {
      // Try diffing the deployment commit against its parent
      const cmd = `git diff --name-only --diff-filter=ACMR ${commitSha}^..${commitSha}`;
      const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 5000 });
      const files = output.trim().split('\n').filter(Boolean);
      if (files.length > 0) return files;
    } catch {
      // Parent commit not available — try diff against previous HEAD
    }
    try {
      // Fallback: diff deployment commit against HEAD (before this deploy)
      const cmd = `git diff --name-only --diff-filter=ACMR HEAD..${commitSha}`;
      const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 5000 });
      const files = output.trim().split('\n').filter(Boolean);
      if (files.length > 0) return files;
    } catch {
      // Both strategies failed
    }
  }

  // Strategy 2: Local git history — compare HEAD~1 to HEAD
  try {
    const cmd = 'git diff --name-only --diff-filter=ACMR HEAD~1..HEAD';
    const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 5000 });
    const files = output.trim().split('\n').filter(Boolean);
    if (files.length > 0) return files;
  } catch {
    // Shallow clone, no history
  }

  // Strategy 3: Fail-safe — return null to signal full conservative scan
  return null;
}

/**
 * --all mode: scan all SEO-sensitive files that exist in the repo.
 * Used for full audits and CI fallback when git history is unavailable.
 */
function getAllSEOSensitiveFiles() {
  const files = [];
  const srcDir = path.join(PROJECT_ROOT, 'src');

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
        walk(fullPath);
      } else if (/\.(tsx?|jsx?|mdx?|json)$/.test(entry.name)) {
        const relativePath = path.relative(PROJECT_ROOT, fullPath);
        if (!isNonSEOPage(relativePath) && getSEOFileInfo(relativePath)) {
          files.push(relativePath);
        }
      }
    }
  }

  walk(srcDir);

  // Also check root-level SEO config files
  const rootFiles = ['src/app/sitemap.ts'];
  for (const rf of rootFiles) {
    const fullPath = path.join(PROJECT_ROOT, rf);
    if (fs.existsSync(fullPath) && !files.includes(rf)) {
      files.push(rf);
    }
  }

  return files;
}

function loadEvidence(pageId) {
  const evidencePath = path.join(EVIDENCE_DIR, `${pageId}.json`);
  if (!fs.existsSync(evidencePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (e) {
    console.error(`  ⚠️  Evidence file corrupt: ${evidencePath}`);
    return null;
  }
}

function validateEvidence(evidence, pageId, label) {
  const requiredFields = [
    'targetQuery',
    'evidenceSource',
    'serpIntent',
    'competitorWeakness',
    'pageTypeDecision',
    'titleMetaDecision',
    'searchDemandScore',
    'rankingDifficultyScore',
    'clickPotentialScore',
    'uniquenessScore',
    'adSenseSafetyScore',
    'expectedFirst30DayImpressions',
    'expectedFirst90DayClicks',
    'improveExistingPageCheck',
    'finalDecision',
  ];

  const missing = requiredFields.filter((f) => evidence[f] === undefined);
  if (missing.length > 0) {
    return {
      valid: false,
      reason: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  // Score validation
  const scores = {
    searchDemandScore: evidence.searchDemandScore,
    clickPotentialScore: evidence.clickPotentialScore,
    uniquenessScore: evidence.uniquenessScore,
    adSenseSafetyScore: evidence.adSenseSafetyScore,
  };

  const failures = [];
  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const score = scores[key];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      failures.push(`${key}=${score} (invalid — must be 0-100)`);
    } else if (score < threshold) {
      failures.push(`${key}=${score} (below threshold ${threshold})`);
    }
  }

  if (failures.length > 0) {
    return {
      valid: false,
      reason: `Score failures: ${failures.join('; ')}`,
      scoreFailures: failures,
    };
  }

  // Final decision validation
  const validDecisions = new Set(['BUILD', 'IMPROVE_EXISTING', 'HOLD', 'REJECT']);
  if (!validDecisions.has(evidence.finalDecision)) {
    return {
      valid: false,
      reason: `Invalid finalDecision: "${evidence.finalDecision}" (must be BUILD, IMPROVE_EXISTING, HOLD, or REJECT)`,
    };
  }

  return { valid: true };
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  let files = [];
  let mode = 'default';

  if (args.includes('--files')) {
    const idx = args.indexOf('--files');
    files = args[idx + 1]?.split(/\s+/) || [];
    mode = 'explicit';
  } else if (args.includes('--staged')) {
    files = getGitChangedFiles('--staged');
    mode = 'staged';
  } else if (args.includes('--ci')) {
    files = getCIChangedFiles();
    mode = 'ci';
    // Fail-safe: if CI can't determine changed files, do a conservative full scan
    // Never pass blindly just because git history is unavailable
    if (files === null) {
      console.log('⚠️  CI mode: No git history available. Running conservative full SEO-sensitive scan.\n');
      files = getAllSEOSensitiveFiles();
      mode = 'ci-fallback';
    }
  } else if (args.includes('--all')) {
    files = getAllSEOSensitiveFiles();
    mode = 'all';
  } else if (args.some((a) => a.startsWith('--since'))) {
    const sinceArg = args.find((a) => a.startsWith('--since'));
    files = getGitChangedFiles(sinceArg);
    mode = 'since';
  } else {
    files = getGitChangedFiles(null);
    mode = 'unstaged';
  }

  // Filter to TS/TSX/JS/JSX/MDX/JSON only (source changes, not images/assets)
  files = files.filter((f) => /\.(tsx?|jsx?|mdx?|json)$/.test(f));

  if (files.length === 0) {
    if (mode === 'ci-fallback') {
      console.log('⚠️  Conservative scan found 0 SEO-sensitive files. Gate: PASS (no SEO files in repo — unusual, verify).');
    } else {
      console.log('✅ No changed source files detected. Gate: PASS (no changes).');
    }
    process.exit(0);
  }

  console.log(`📋 [${mode}] Scanning ${files.length} file(s)...\n`);

  const seoFiles = [];
  const skippedFiles = [];

  for (const file of files) {
    if (isNonSEOPage(file)) {
      skippedFiles.push(file);
      continue;
    }
    const info = getSEOFileInfo(file);
    if (info) {
      // Deduplicate by page ID (only include first match)
      if (!seoFiles.find((s) => s.id === info.id)) {
        seoFiles.push({ ...info, file });
      }
    } else {
      skippedFiles.push(file);
    }
  }

  if (seoFiles.length === 0) {
    console.log('✅ No SEO-sensitive files changed. Gate: PASS.');
    if (skippedFiles.length > 0) {
      console.log(`   (${skippedFiles.length} non-SEO file(s) skipped)`);
    }
    process.exit(0);
  }

  console.log(`🔍 Found ${seoFiles.length} SEO-sensitive file(s):`);
  for (const s of seoFiles) {
    console.log(`   📄 ${s.label} (ID: ${s.id})`);
    console.log(`      File: ${s.file}`);
  }
  console.log('');

  // Check evidence for each SEO-sensitive file
  const results = [];
  let hasFailures = false;

  for (const seo of seoFiles) {
    console.log(`🔎 Checking gate for: ${seo.label} [${seo.id}]`);

    const evidence = loadEvidence(seo.id);
    if (!evidence) {
      console.log(`   ❌ FAIL: No evidence file found at .optimizer-data/search-demand-gate/${seo.id}.json`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'FAIL',
        reason: 'MISSING_EVIDENCE',
        detail: `No evidence file at .optimizer-data/search-demand-gate/${seo.id}.json`,
      });
      hasFailures = true;
      continue;
    }

    console.log(`   📋 Evidence loaded: ${evidence.targetQuery || 'UNKNOWN QUERY'}`);

    const validation = validateEvidence(evidence, seo.id, seo.label);
    if (!validation.valid) {
      console.log(`   ❌ FAIL: ${validation.reason}`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'FAIL',
        reason: 'INVALID_EVIDENCE',
        detail: validation.reason,
        scoreFailures: validation.scoreFailures || [],
      });
      hasFailures = true;
      continue;
    }

    // Final decision check
    if (evidence.finalDecision === 'HOLD') {
      console.log(`   ⚠️  HOLD: Evidence complete but final decision is HOLD — gate passes with warning.`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'PASS_WARN',
        reason: 'FINAL_DECISION_HOLD',
        detail: 'Evidence complete but final decision is HOLD',
      });
    } else if (evidence.finalDecision === 'IMPROVE_EXISTING') {
      console.log(`   ✅ PASS: Improve-existing-path decision — gate passes.`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'PASS',
        reason: 'IMPROVE_EXISTING',
        detail: 'Improving existing page rather than creating new one',
      });
    } else if (evidence.finalDecision === 'REJECT') {
      console.log(`   🚫 BLOCKED: Final decision is REJECT — gate fails.`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'FAIL',
        reason: 'FINAL_DECISION_REJECT',
        detail: 'Evidence complete but final decision is REJECT',
      });
      hasFailures = true;
    } else {
      // BUILD
      console.log(`   ✅ PASS: All scores above thresholds, final decision BUILD.`);
      results.push({
        pageId: seo.id,
        label: seo.label,
        file: seo.file,
        status: 'PASS',
        reason: 'ALL_CHECKS_PASSED',
        scores: {
          searchDemandScore: evidence.searchDemandScore,
          clickPotentialScore: evidence.clickPotentialScore,
          uniquenessScore: evidence.uniquenessScore,
          adSenseSafetyScore: evidence.adSenseSafetyScore,
          rankingDifficultyScore: evidence.rankingDifficultyScore,
        },
      });
    }
    console.log('');
  }

  // ─── Failure Report ───────────────────────────────────────────────────

  const failures = results.filter((r) => r.status === 'FAIL');
  if (failures.length > 0) {
    const reportPath = path.join(FAILURE_REPORT_DIR, 'search-demand-gate-failure-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      phase: '35.3',
      gate: 'SEARCH_DEMAND_FIRST',
      result: 'FAILED',
      totalFilesChecked: seoFiles.length,
      totalFailures: failures.length,
      failures,
      allResults: results,
      action: 'BLOCK_DEPLOY — Fix evidence files or revert changes before deploying.',
    };

    fs.mkdirSync(FAILURE_REPORT_DIR, { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Failure report written: ${reportPath}`);
  }

  // ─── Summary ───────────────────────────────────────────────────────────

  console.log('═'.repeat(60));
  console.log(`📊 Gate Summary: ${seoFiles.length} SEO file(s) checked`);

  const passCount = results.filter((r) => r.status.startsWith('PASS')).length;
  const failCount = failures.length;

  console.log(`   ✅ Pass: ${passCount}  ❌ Fail: ${failCount}`);

  if (failures.length > 0) {
    console.log('\n🚫 SEARCH-DEMAND GATE FAILED');
    console.log('   No deploy allowed. Resolve failures above.');
    console.log('   Each changed SEO file must have a valid evidence file at:');
    console.log(`   ${EVIDENCE_DIR}/<page-id>.json`);
    console.log('\n   Revert changes OR create evidence files with all required fields.');
    console.log('   See: qfinhub-search-demand-first skill for full requirements.');
    process.exit(1);
  }

  console.log('\n✅ SEARCH-DEMAND GATE PASSED');
  console.log('   All SEO-sensitive changes have valid evidence. Deploy may proceed.');
  process.exit(0);
}

main();
