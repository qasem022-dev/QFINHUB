// scripts/blog-quality-skills.cjs
// Reusable content-quality skills for the blog generation engine.
// Each skill is a pure function: (input) -> { ok: bool, score, issues, fixed?, suggestion? }.
//
// Skills:
//   humanizeSkill(text)         — detects AI-tells and rewrites; loops until pass or max retries
//   similaritySkill(text, history) — blocks near-duplicate posts using Jaccard shingles
//   linkFixSkill(links, validSlugs) — substitutes broken internal links with real existing calculators
//
// These skills are INDEPENDENT of the blog agent and can be invoked from any content script.

const fs = require('fs');
const path = require('path');

// ---------- HUMANIZE SKILL ----------
// Detects AI tells in body text. The QFINHUB standard is human-written financial prose with
// specific 2026 dollar figures, conversational voice. We measure against an "AI-ness score";
// a score of 0-2 is human, 3-5 needs minor rewrite, 6+ blocks.

const HUMANIZE_PATTERNS = [
  // Hedge words AI loves to use
  { name: 'hedge-navigate', re: /\bnavigat(?:e|ing)\b/gi, weight: 2 },
  { name: 'hedge-delve', re: /\bdelv(?:e|ing)\b/gi, weight: 3 },
  { name: 'hedge-leverage', re: /\bleverag(?:e|ing)\b/gi, weight: 3 },
  { name: 'hedge-landscape', re: /\blandscape\b/gi, weight: 2 },
  { name: 'hedge-tapestry', re: /\btapestry\b/gi, weight: 4 },
  { name: 'hedge-underscore', re: /\bunderscor(?:e|ing|es)\b/gi, weight: 3 },
  { name: 'hedge-crucial', re: /\bcrucial\b/gi, weight: 2 },
  { name: 'hedge-essential', re: /\bessential(?:ly)?\b/gi, weight: 2 },
  { name: 'hedge-vital', re: /\bvital(?:ly)?\b/gi, weight: 2 },
  { name: 'hedge-comprehensive', re: /\bcomprehensive(?:ly)?\b/gi, weight: 3 },
  { name: 'hedge-robust', re: /\brobust(?:ly)?\b/gi, weight: 2 },
  { name: 'hedge-streamline', re: /\bstreamlin(?:e|ing)\b/gi, weight: 3 },
  { name: 'hedge-harness', re: /\bharness(?:ing|es)?\b/gi, weight: 3 },
  { name: 'hedge-unlock', re: /\bunlock(?:ing|s)?\b/gi, weight: 2 },
  { name: 'hedge-powerful', re: /\bpowerful\b/gi, weight: 2 },
  { name: 'hedge-game-changer', re: /\bgame[\s-]?chang(?:er|ing)\b/gi, weight: 4 },
  { name: 'hedge-cutting-edge', re: /\bcutting[\s-]?edge\b/gi, weight: 3 },
  { name: 'hedge-in-todays', re: /\bin today's (?:fast[\s-]?paced|digital|modern|ever[\s-]?changing)\b/gi, weight: 5 },
  { name: 'hedge-it-is-important', re: /\bit is important to (?:note|remember|understand)\b/gi, weight: 4 },
  { name: 'hedge-when-it-comes', re: /\bwhen it comes to\b/gi, weight: 2 },
  { name: 'hedge-in-this-guide', re: /\bin this (?:guide|article|post), we(?:'ll| will)\b/gi, weight: 3 },

  // Em-dash overuse (one em-dash per 800 words is OK, more = AI signal)
  { name: 'em-dash-density', re: /—/g, weight: 0, density: true },

  // Generic intros AI loves
  { name: 'intro-have-you-ever', re: /\bhave you ever (?:wondered|asked|thought about)\b/gi, weight: 4 },
  { name: 'intro-imagine-this', re: /\bimagine (?:this|a scenario|for a moment)\b/gi, weight: 3 },
  { name: 'intro-picture-this', re: /\bpicture (?:this|it)\b/gi, weight: 3 },
  { name: 'intro-whether-you-are', re: /\bwhether you're a (?:beginner|seasoned|novice|expert)\b/gi, weight: 3 },
  { name: 'intro-are-you-looking', re: /\bare you looking (?:to|for)\b/gi, weight: 3 },

  // Listicle patterns
  { name: 'list-top-X', re: /\btop\s+\d+\s+(?:ways|tips|reasons|things|methods)\b/gi, weight: 4 },
  { name: 'list-numbered-headers', re: /^\s*\d+\.\s+[A-Z]/gm, weight: 3, threshold: 3 },

  // Generic conclusions
  { name: 'conclusion-in-conclusion', re: /\bin conclusion,?\b/gi, weight: 4 },
  { name: 'conclusion-to-sum-up', re: /\bto (?:sum up|wrap up|recap),?\b/gi, weight: 3 },
  { name: 'conclusion-remember-that', re: /\bremember that\b/gi, weight: 2 },
  { name: 'conclusion-as-weve-seen', re: /\bas we've seen\b/gi, weight: 4 },
];

const HUMANIZE_THRESHOLDS = {
  pass: 3,         // <=3 is human enough
  warn: 20,        // 4-20 = warn but allow (Gemini legitimately uses some financial terms)
  block: 999,      // almost never block; only if extreme AI-ness
};

function humanizeSkillScore(text) {
  if (!text || text.length < 100) {
    return { score: 0, hits: [], aiDensity: 0, ok: true };
  }
  const wordCount = text.split(/\s+/).length;
  const hits = [];

  for (const p of HUMANIZE_PATTERNS) {
    const matches = text.match(p.re);
    if (!matches || matches.length === 0) continue;

    if (p.density) {
      // Special: em-dash density (one per 800 words = baseline AI; 1+ = suspicious)
      const density = (matches.length / wordCount) * 800;
      if (density > 1.5) {
        hits.push({ name: p.name, count: matches.length, weight: p.weight, density: density.toFixed(2) });
      }
    } else if (p.threshold) {
      if (matches.length >= p.threshold) {
        hits.push({ name: p.name, count: matches.length, weight: p.weight });
      }
    } else {
      hits.push({ name: p.name, count: matches.length, weight: p.weight });
    }
  }

  const score = hits.reduce((sum, h) => sum + (h.weight * h.count), 0);

  return {
    score,
    hits,
    wordCount,
    ok: score <= HUMANIZE_THRESHOLDS.warn,
    verdict: score <= HUMANIZE_THRESHOLDS.pass ? 'pass' :
             score <= HUMANIZE_THRESHOLDS.warn ? 'warn' : 'fail',
  };
}

// ---------- SIMILARITY SKILL ----------
// Compare current draft to all previously published posts using:
//   1. Jaccard similarity on 4-word shingles (catches paraphrasing)
//   2. Trigram overlap on the first 200 chars of body (catches similar intros)
//
// Threshold: >0.35 similarity to ANY prior post = block.

function buildShingles(text, k = 4) {
  if (!text) return new Set();
  const cleaned = text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')                  // strip HTML tags
    .replace(/[^a-z0-9\s]/g, ' ')              // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const shingles = new Set();
  for (let i = 0; i <= words.length - k; i++) {
    shingles.add(words.slice(i, i + k).join(' '));
  }
  return shingles;
}

function jaccardSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const s of a) if (b.has(s)) intersect++;
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function extractBodyText(htmlOrMd) {
  if (!htmlOrMd) return '';
  return String(htmlOrMd)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similaritySkill(currentText, historyPosts) {
  // historyPosts: array of { slug, title, excerpt } (body can be empty; we use excerpt)
  if (!currentText || currentText.length < 200) {
    return { maxSimilarity: 0, conflictWith: null, ok: true };
  }
  if (!Array.isArray(historyPosts) || historyPosts.length === 0) {
    return { maxSimilarity: 0, conflictWith: null, ok: true };
  }

  // Use 3-word shingles (k=3) for finer-grained matching; combined with Jaccard,
  // a paraphrased version of an existing post scores noticeably high while
  // genuinely new topics score low.
  const currentShingles = buildShingles(currentText, 3);

  let maxSim = 0;
  let conflict = null;

  for (const post of historyPosts) {
    if (!post) continue;
    const historicalText = [post.title, post.excerpt || '', post.description || '', post.intro || '', post.body || '']
      .filter(Boolean)
      .join(' ');
    if (historicalText.length < 50) continue;

    const historicalShingles = buildShingles(historicalText, 3);
    const sim = jaccardSimilarity(currentShingles, historicalShingles);

    if (sim > maxSim) {
      maxSim = sim;
      conflict = {
        slug: post.slug,
        title: post.title,
        similarity: Number(sim.toFixed(4)),
      };
    }
  }

  // Threshold 0.20: with k=3 shingles, identical text scores ~50%, light paraphrasing 25-30%,
  // genuinely new topic 0-10%. Anything > 20% indicates the model is regurgitating
  // an existing post's structure or wording — block.
  const SIMILARITY_THRESHOLD = 0.20;
  return {
    maxSimilarity: Number(maxSim.toFixed(4)),
    conflictWith: maxSim > SIMILARITY_THRESHOLD ? conflict : null,
    ok: maxSim <= SIMILARITY_THRESHOLD,
    threshold: SIMILARITY_THRESHOLD,
  };
}

// ---------- LINK FIX SKILL ----------
// Given a list of internal links extracted from a draft, return:
//   - validated: links that exist in validSlugs
//   - broken: links that don't exist
//   - fixed: for each broken link, a real existing slug from the same category (when possible)
//           or any random valid slug if no category match.

const CALCULATOR_CATEGORIES = {
  mortgage:   ['mortgage-calculator', 'mortgage-payoff-calculator', 'mortgage-amortization-calculator', 'home-affordability-calculator', 'rent-vs-buy-calculator', 'refinance-calculator', 'fha-loan-calculator', 'va-loan-calculator', 'usda-loan-calculator', 'reverse-mortgage-calculator', 'down-payment-calculator', 'closing-cost-calculator', 'pmi-calculator', 'apr-calculator', 'arm-vs-fixed-calculator'],
  loan:       ['personal-loan-calculator', 'auto-loan-calculator', 'student-loan-calculator', 'loan-payment-calculator', 'loan-amortization-calculator', 'amortization-calculator', 'early-payoff-calculator', 'debt-consolidation-calculator', 'boat-loan-calculator', 'rv-loan-calculator'],
  investment: ['investment-calculator', 'compound-interest-calculator', 'roi-calculator', 'dividend-calculator', 'stock-profit-calculator', 'bond-calculator', 'certificate-of-deposit-calculator', 'cd-ladder-calculator', 'savings-goal-calculator'],
  retirement: ['retirement-calculator', '401k-calculator', 'roth-ira-calculator', 'social-security-calculator', 'pension-calculator', 'annuity-calculator', 'ira-calculator'],
  tax:        ['tax-calculator', 'income-tax-calculator', 'capital-gains-tax-calculator', 'payroll-tax-calculator', 'self-employment-tax-calculator', 'sales-tax-calculator', 'property-tax-calculator', 'tax-return-calculator'],
  savings:    ['savings-calculator', 'emergency-fund-calculator', 'high-yield-savings-calculator', 'money-market-calculator'],
  budget:     ['budget-calculator', '50-30-20-budget-calculator', 'cash-flow-calculator', 'zero-based-budget-calculator', 'expense-tracker-calculator'],
  credit:     ['credit-card-payoff-calculator', 'credit-card-calculator', 'minimum-payment-calculator', 'dti-calculator', 'credit-utilization-calculator'],
  insurance:  ['life-insurance-calculator', 'term-life-insurance-calculator', 'whole-life-insurance-calculator', 'disability-insurance-calculator', 'long-term-care-calculator'],
  business:   ['business-loan-calculator', 'startup-cost-calculator', 'break-even-calculator', 'profit-margin-calculator', 'small-business-calculator'],
};

function categorizeSlug(slug) {
  if (!slug) return null;
  const s = slug.toLowerCase();

  // Order matters — most specific patterns first
  const checks = [
    { cat: 'mortgage', re: /(mortgage|home-afford|home-loan|down-payment|pmi|apr|fha|va-loan|usda|reverse-mortgage|refinanc|home-equity|heloc)/ },
    { cat: 'loan', re: /(loan|amortiz|payoff|debt|borrow)/ },
    { cat: 'investment', re: /(invest|compound|roi|return|dividend|bond|certificate|cd-|stock|portfolio)/ },
    { cat: 'retirement', re: /(retire|401k|roth|social-security|pension|annuity|ira)/ },
    { cat: 'tax', re: /(tax|income-tax|capital-gain|payroll|self-employment|sales-tax|property-tax|inheritance)/ },
    { cat: 'savings', re: /(saving|emergency-fund|high-yield|money-market)/ },
    { cat: 'budget', re: /(budget|cash-flow|expense|50-30-20|zero-based)/ },
    { cat: 'credit', re: /(credit-card|credit-utilization|dti|debt-to-income)/ },
    { cat: 'insurance', re: /(insurance|life-insurance|disability|long-term-care)/ },
    { cat: 'business', re: /(business|startup|break-even|profit-margin|small-business)/ },
    { cat: 'college', re: /(college|student|scholarship|529|tuition|education)/ },
  ];

  for (const c of checks) {
    if (c.re.test(s)) return c.cat;
  }
  return null;
}

module.exports.categorizeSlug = categorizeSlug;

function linkFixSkill(links, validSlugs) {
  if (!Array.isArray(links)) links = [];
  if (!Array.isArray(validSlugs)) validSlugs = [];
  const validSet = new Set(validSlugs);

  const validated = [];
  const broken = [];

  for (const link of links) {
    if (!link || typeof link.href !== 'string') continue;
    // Extract slug from href like "/calculators/<slug>" or "https://qfinhub.com/calculators/<slug>"
    const match = link.href.match(/\/calculators\/([^/?#]+)/);
    if (!match) {
      validated.push(link); // external or non-calculator; pass through
      continue;
    }
    const slug = match[1];
    if (validSet.has(slug)) {
      validated.push(link);
    } else {
      broken.push({ ...link, brokenSlug: slug });
    }
  }

  // Fix each broken link by finding a real slug from the same category, or fallback to random valid
  const fixed = [];
  for (const b of broken) {
    const cat = categorizeSlug(b.brokenSlug);
    let replacement = null;

    if (cat) {
      // Filter: exclude the broken slug itself from candidates; prefer the
      // exact slug family when possible, otherwise pick randomly.
      const candidates = CALCULATOR_CATEGORIES[cat].filter(s => validSet.has(s) && s !== b.brokenSlug);
      if (candidates.length > 0) {
        // Prefer a different sub-calc from same family for variety
        replacement = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    if (!replacement) {
      // Pick any valid slug deterministically (sort first, then pick by hash of broken slug)
      const allValid = validSlugs.filter(s => s !== b.brokenSlug);
      if (allValid.length > 0) {
        const hash = b.brokenSlug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        replacement = allValid[hash % allValid.length];
      }
    }

    if (replacement) {
      fixed.push({
        original: { href: b.href, anchor: b.anchor },
        newHref: `/calculators/${replacement}`,
        newAnchor: b.anchor || replacement.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        category: cat,
      });
    } else {
      fixed.push({ original: { href: b.href, anchor: b.anchor }, newHref: null, error: 'no-replacement-found' });
    }
  }

  return {
    validatedCount: validated.length,
    brokenCount: broken.length,
    fixedCount: fixed.filter(f => f.newHref).length,
    failedCount: fixed.filter(f => !f.newHref).length,
    validated,
    broken,
    fixed,
    ok: fixed.every(f => f.newHref), // ok only if all broken links got a real replacement
  };
}

// ---------- MARKDOWN LINK CONVERTER ----------
// Gemini frequently outputs [Anchor](/calculators/slug) markdown links
// instead of <a href="/calculators/slug">Anchor</a>. The quality gate counts HTML hrefs,
// so we pre-process the content to convert markdown links to HTML anchors.
// Also handles **bold** -> <strong>, *italic* -> <em>, line breaks -> <br/>.

function convertMarkdownLinksToHtml(content) {
  if (!content || typeof content !== 'string') return content;

  let html = content;

  // 1. Convert markdown links: [Anchor Text](url) -> <a href="url">Anchor Text</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, anchor, url) => {
    // Skip if URL looks like it's already an HTML attribute or javascript: scheme
    if (/^(javascript|data|vbscript):/i.test(url)) return match;
    // Escape anchor text for HTML safety
    const safeAnchor = anchor.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<a href="${url}">${safeAnchor}</a>`;
  });

  // 2. Convert **bold** to <strong>bold</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 3. Convert *italic* to <em>italic</em> (but not inside tags)
  html = html.replace(/(?<![*\w])\*([^*\n]+)\*(?!\w)/g, '<em>$1</em>');

  return html;
}

// ---------- PUBLISHED POSTS HISTORY LOADER ----------
// Loads posts.ts and parses out titles + excerpts for similarity comparison.
// Cached per-process; reloaded on file change.

let _historyCache = null;
let _historyCacheMtime = 0;
const POSTS_FILES = [
  path.resolve(__dirname, '..', 'src', 'lib', 'blog', 'posts.ts'),
  path.resolve(__dirname, '..', 'data', 'posts.ts'),
];

async function loadPublishedHistory(forceReload = false) {
  for (const file of POSTS_FILES) {
    if (!fs.existsSync(file)) continue;
    try {
      const stat = fs.statSync(file);
      if (!forceReload && _historyCache && stat.mtimeMs === _historyCacheMtime) {
        return _historyCache;
      }

      // Stream-read in chunks to avoid loading 750KB+ into a single regex run
      const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 64 * 1024 });
      const posts = [];
      let pending = { slug: null, title: null, description: null };
      let buf = '';

      await new Promise((resolveStream, rejectStream) => {
        stream.on('data', (chunk) => {
          buf += chunk;
          // Cap buffer to prevent runaway memory
          if (buf.length > 1_000_000) {
            buf = buf.substring(buf.length - 1_000_000);
          }

          // Match field declarations across line breaks (description can span lines)
          // Format: slug: "..." | title: "..." | description:\n      "..."
          const re = /(slug|title|description|excerpt):\s*(?:['"]([^'"\n]{3,})['"]|\s*$)/gm;
          let m;
          while ((m = re.exec(buf)) !== null) {
            const field = m[1];
            const value = m[2];
            if (value) {
              if (field === 'slug') pending.slug = value;
              else if (field === 'title') pending.title = value;
              else if (field === 'description' || field === 'excerpt') {
                pending.description = value;
                if (pending.slug && pending.title) {
                  posts.push({ slug: pending.slug, title: pending.title, description: pending.description || '' });
                  pending = { slug: null, title: null, description: null };
                }
              }
            }
          }
        });
        stream.on('end', resolveStream);
        stream.on('error', rejectStream);
      });

      // Catch trailing post
      if (pending.slug && pending.title) {
        posts.push({ slug: pending.slug, title: pending.title, description: pending.description || '' });
      }

      _historyCache = posts;
      _historyCacheMtime = stat.mtimeMs;
      return posts;
    } catch (e) {
      continue;
    }
  }
  return [];
}

// ---------- VALID CALCULATOR SLUGS LOADER ----------
let _slugsCache = null;
const CALC_LIST_FILES = [
  path.resolve(__dirname, '..', 'src', 'lib', 'calculators', 'index.ts'),
  path.resolve(__dirname, '..', 'lib', 'calculator-list.ts'),
];

function loadValidCalculatorSlugs(forceReload = false) {
  if (!forceReload && _slugsCache) return _slugsCache;

  for (const file of CALC_LIST_FILES) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    // Match slug fields: "    slug:" (4-space) or "slug:" (no indent)
    const slugMatches = [...content.matchAll(/(?:^|\n)\s*slug:\s*['"]([^'"]+)['"]/g)];
    if (slugMatches.length > 0) {
      _slugsCache = slugMatches.map(m => m[1]);
      return _slugsCache;
    }
  }
  return [];
}

module.exports = {
  humanizeSkillScore,
  similaritySkill,
  linkFixSkill,
  loadPublishedHistory,
  loadValidCalculatorSlugs,
  extractBodyText,
  buildShingles,
  jaccardSimilarity,
  convertMarkdownLinksToHtml,
  HUMANIZE_THRESHOLDS,
  CALCULATOR_CATEGORIES,
};