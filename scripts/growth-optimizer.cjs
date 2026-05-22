#!/usr/bin/env node
/**
 * QFINHUB Growth Optimizer v2 — Full Analytics Integration
 * ===========================================================
 *
 * Runs daily to:
 * 1. Pull GSC data (clicks, impressions, rankings, queries)
 * 2. Pull GA4 data (users, sessions, pageviews, sources)
 * 3. Pull Google Trends (trending keywords, rising queries)
 * 4. Monitor all engines, detect issues, auto-fix
 * 5. Generate actionable optimization recommendations
 *
 * USAGE:
 *   node scripts/growth-optimizer.cjs           Full cycle
 *   node scripts/growth-optimizer.cjs --report  Report only
 *   node scripts/growth-optimizer.cjs --fix     Auto-fix issues
 */

const { execSync } = require("child_process");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".optimizer-data");
const REPORT_FILE = resolve(DATA_DIR, "daily-report.json");
const TRAFFIC_FILE = resolve(DATA_DIR, "traffic-report.json");
const LOG_FILE = resolve(DATA_DIR, "optimizer-log.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const args = process.argv.slice(2);

// ═══════════════════════════════════════════════
// TASK 1: PULL ANALYTICS DATA
// ═══════════════════════════════════════════════

function pullAnalyticsData() {
  console.log("\n📊 Pulling live analytics data (GSC + GA4 + Trends)...");
  try {
    const result = execSync(
      "python3 scripts/analytics-connector.py --days 7",
      { cwd: ROOT, timeout: 120000, encoding: "utf-8" }
    );
    console.log(result.trim().split("\n").slice(-15).join("\n"));

    if (existsSync(TRAFFIC_FILE)) {
      const traffic = JSON.parse(readFileSync(TRAFFIC_FILE, "utf-8"));
      return traffic;
    }
  } catch (e) {
    console.error("  ⚠️ Analytics connector failed:", e.message?.slice(0, 200));
    // Try to use cached data
    if (existsSync(TRAFFIC_FILE)) {
      console.log("  📦 Using cached traffic data");
      return JSON.parse(readFileSync(TRAFFIC_FILE, "utf-8"));
    }
  }
  return null;
}

// ═══════════════════════════════════════════════
// TASK 2: ANALYZE TRAFFIC & GENERATE INSIGHTS
// ═══════════════════════════════════════════════

function analyzeTraffic(traffic) {
  const insights = [];
  const metrics = {};

  if (!traffic) {
    insights.push({
      priority: "high",
      action: "No traffic data available",
      details: "Check Google OAuth and API enablement",
    });
    return { insights, metrics };
  }

  // --- GSC Analysis ---
  const gsc = traffic.search_console || {};
  const gscSummary = gsc.summary || {};

  metrics.gsc = {
    clicks: gscSummary.clicks || 0,
    impressions: gscSummary.impressions || 0,
    ctr: gscSummary.ctr || 0,
    avgPosition: gscSummary.position || 999,
  };

  // CTR insights
  if (metrics.gsc.impressions > 100 && metrics.gsc.ctr < 1) {
    insights.push({
      priority: "high",
      action: `CRITICAL: CTR too low (${metrics.gsc.ctr}%)`,
      details: `${metrics.gsc.impressions} impressions but ${metrics.gsc.clicks} clicks. Improve meta titles/descriptions for top pages.`,
    });
  }

  // Top pages with high impressions but no clicks
  const missedPages = (gsc.top_pages || [])
    .filter((p) => p.impressions >= 3 && p.clicks === 0)
    .slice(0, 5);

  if (missedPages.length > 0) {
    insights.push({
      priority: "high",
      action: `${missedPages.length} pages with impressions but ZERO clicks`,
      details: missedPages.map((p) => p.page.split("/").pop()).join(", "),
    });
  }

  // Position improvement opportunities
  const nearPage1 = gsc.queries_by_position || {};
  if ((nearPage1.top3 || []).length > 0) {
    insights.push({
      priority: "medium",
      action: `${nearPage1.top3.length} keywords in position 1-3 — protect these`,
      details: nearPage1.top3.join(", "),
    });
  }

  // --- GA4 Analysis ---
  const ga = traffic.analytics || {};
  const gaSummary = ga.summary || {};

  metrics.ga = {
    users: gaSummary.users || 0,
    sessions: gaSummary.sessions || 0,
    pageviews: gaSummary.pageviews || 0,
    bounceRate: gaSummary.bounce_rate || 0,
    avgDuration: gaSummary.avg_session_duration_sec || 0,
  };

  // Low engagement
  if (metrics.ga.sessions > 10 && metrics.ga.bounceRate > 70) {
    insights.push({
      priority: "medium",
      action: `High bounce rate (${metrics.ga.bounceRate}%) — improve internal linking`,
      details: "Add more cross-links between calculators and blog posts",
    });
  }

  // Source breakdown
  const sources = ga.source_summary || {};
  if (sources.organic_search === 0 && metrics.ga.sessions > 5) {
    insights.push({
      priority: "medium",
      action: "Zero organic search traffic — site still in Google sandbox",
      details: "Keep submitting to Indexing API, generate more content",
    });
  }

  // --- Trends Analysis ---
  const trends = traffic.google_trends || {};
  const keywordInterest = trends.keyword_interest || {};
  const spikes7d = trends.keyword_interest_7d || {};
  const trends12m = trends.keyword_interest_12m || {};
  const suggestions = trends.suggestions || {};

  metrics.trends = {
    topKeywords: Object.entries(keywordInterest)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, v]) => ({ keyword: k, score: v })),
    spikes: Object.entries(spikes7d)
      .sort((a, b) => b[1].spike_pct - a[1].spike_pct)
      .slice(0, 5)
      .map(([k, v]) => ({ keyword: k, spike_pct: v.spike_pct })),
    longTermUp: Object.entries(trends12m)
      .filter(([_, v]) => v.direction === 'up')
      .map(([k, v]) => ({ keyword: k, trend_pct: v.trend_pct })),
    suggestionCount: Object.values(suggestions).reduce((sum, arr) => sum + arr.length, 0),
    opportunities: (trends.opportunities || []).slice(0, 8),
  };

  // Rising trends to target
  const risingRelated = trends.rising_related || [];
  if (risingRelated.length > 0) {
    const top = risingRelated[0];
    insights.push({
      priority: "high",
      action: `🔥 Rising trend: "${top.query}" (+${top.value}%)`,
      details: `Create dedicated content targeting this query immediately`,
    });
  }

  // Spike detection (7-day) — urgent opportunities
  if (metrics.trends.spikes && metrics.trends.spikes.length > 0) {
    const topSpike = metrics.trends.spikes[0];
    insights.push({
      priority: "high",
      action: `🚨 Spike detected: "${topSpike.keyword}" (+${topSpike.spike_pct}% in 7 days)`,
      details: `This is surging NOW — create content today to capture the wave`,
    });
  }

  // Long-term uptrends
  if (metrics.trends.longTermUp && metrics.trends.longTermUp.length > 0) {
    insights.push({
      priority: "medium",
      action: `📈 ${metrics.trends.longTermUp.length} keywords trending up over 12 months`,
      details: metrics.trends.longTermUp.slice(0, 3).map(k => `${k.keyword} (+${k.trend_pct}%)`).join(", "),
    });
  }

  // New keyword discoveries from Suggestions
  if (metrics.trends.suggestionCount > 0) {
    insights.push({
      priority: "low",
      action: `💡 ${metrics.trends.suggestionCount} keyword suggestions via autocomplete`,
      details: "Review .optimizer-data/traffic-report.json → google_trends.suggestions for new content ideas",
    });
  }

  // Keyword gaps we should fill
  const topKw = Object.entries(keywordInterest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [kw, score] of topKw) {
    if (score > 50) {
      insights.push({
        priority: "medium",
        action: `High-demand keyword: "${kw}" (score: ${score})`,
        details: `Optimize existing content or create new page for this keyword`,
      });
    }
  }

  return { insights, metrics };
}

// ═══════════════════════════════════════════════
// TASK 3: ENGINE HEALTH CHECK
// ═══════════════════════════════════════════════

function checkEngineHealth() {
  const engines = {};
  const issues = [];

  // HARO
  try {
    const haroLog = resolve(ROOT, ".haro-data", "haro-log.json");
    if (existsSync(haroLog)) {
      const log = JSON.parse(readFileSync(haroLog, "utf-8"));
      const recent = log.filter(
        (e) => new Date(e.ts) > new Date(Date.now() - 86400000)
      );
      engines.haro = {
        status: "ok",
        runsToday: recent.length,
        lastRun: log[log.length - 1]?.ts,
      };
    } else {
      engines.haro = { status: "no-data" };
      issues.push("HARO: No activity data");
    }
  } catch (e) {
    engines.haro = { status: "error", error: e.message };
  }

  // X/Twitter
  try {
    const xLog = resolve(ROOT, ".x-data-v2", "activity-log.json");
    if (existsSync(xLog)) {
      const log = JSON.parse(readFileSync(xLog, "utf-8"));
      const recent = log.filter(
        (e) => new Date(e.ts) > new Date(Date.now() - 86400000)
      );
      engines.x = {
        status: recent.length > 0 ? "ok" : "paused",
        actionsToday: recent.length,
        lastRun: log[log.length - 1]?.ts,
      };
      if (recent.length === 0)
        issues.push("X/Twitter: No posts today — cron may be paused");
    } else {
      engines.x = { status: "no-data" };
    }
  } catch (e) {
    engines.x = { status: "error", error: e.message };
  }

  // Blog Agent
  try {
    const blogLog = resolve(ROOT, ".blog-agent", "activity-log.json");
    if (existsSync(blogLog)) {
      const log = JSON.parse(readFileSync(blogLog, "utf-8"));
      const today = log.filter(
        (e) =>
          new Date(e.ts || e.timestamp) > new Date(Date.now() - 86400000)
      );
      engines.blog = {
        status: today.length > 0 ? "ok" : "stale",
        postsToday: today.length,
        lastRun: log[log.length - 1]?.ts || log[log.length - 1]?.timestamp,
      };
    } else {
      engines.blog = { status: "no-data" };
    }
  } catch (e) {
    engines.blog = { status: "error", error: e.message };
  }

  // Newsjacking
  try {
    const njLog = resolve(ROOT, ".newsjack-data", "activity-log.json");
    if (existsSync(njLog)) {
      const log = JSON.parse(readFileSync(njLog, "utf-8"));
      const published = log.filter((e) => e.type === "news-published");
      engines.newsjack = {
        status: "ok",
        totalPublished: published.length,
      };
    } else {
      engines.newsjack = { status: "no-data" };
    }
  } catch (e) {
    engines.newsjack = { status: "error", error: e.message };
  }

  // Widget Outreach
  try {
    const woLog = resolve(ROOT, ".widget-outreach", "campaign-log.json");
    if (existsSync(woLog)) {
      const log = JSON.parse(readFileSync(woLog, "utf-8"));
      const sent = log.filter((e) => e.type === "outreach-batch");
      const totalSent = sent.reduce(
        (sum, entry) => sum + (entry.details?.sent || 0),
        0
      );
      engines.widgetOutreach = {
        status: "ok",
        batchesSent: sent.length,
        totalEmailsSent: totalSent,
      };
    } else {
      engines.widgetOutreach = { status: "pending" };
    }
  } catch (e) {
    engines.widgetOutreach = { status: "error", error: e.message };
  }

  // Scenario Generator
  try {
    const idxFile = resolve(ROOT, "public", "data", "scenarios", "index.json");
    if (existsSync(idxFile)) {
      const idx = JSON.parse(readFileSync(idxFile, "utf-8"));
      engines.scenarios = {
        status: "ok",
        totalPages: Object.keys(idx).length,
      };
    } else {
      engines.scenarios = { status: "no-data" };
    }
  } catch (e) {
    engines.scenarios = { status: "error", error: e.message };
  }

  // SEO Indexing
  try {
    const idxLog = resolve(
      require("os").homedir(),
      ".hermes",
      "logs",
      "indexing-engine-log.json"
    );
    if (existsSync(idxLog)) {
      const lines = readFileSync(idxLog, "utf-8")
        .trim()
        .split("\n");
      const last = JSON.parse(lines[lines.length - 1]);
      engines.indexing = {
        status: "ok",
        lastSubmitted: last.submitted || 0,
        lastFailed: last.failed || 0,
        timestamp: last.timestamp,
      };
    } else {
      engines.indexing = { status: "no-data" };
    }
  } catch (e) {
    engines.indexing = { status: "error", error: e.message };
  }

  console.log(
    `  ✅ Engines: ${Object.keys(engines).length} monitored, ${issues.length} issues`
  );
  return { engines, issues };
}

// ═══════════════════════════════════════════════
// TASK 4: GENERATE ACTIONABLE RECOMMENDATIONS
// ═══════════════════════════════════════════════

function generateRecommendations(trafficInsights, engineHealth) {
  const all = [...trafficInsights];

  // Engine issues
  if (engineHealth.issues.length > 0) {
    all.push({
      priority: "high",
      action: "Engine issues detected",
      details: engineHealth.issues.join("; "),
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  all.sort(
    (a, b) =>
      (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
  );

  return all;
}

// ═══════════════════════════════════════════════
// TASK 5: AUTO-FIX KNOWN ISSUES
// ═══════════════════════════════════════════════

function autoFix(insights) {
  const fixes = [];

  for (const insight of insights) {
    if (insight.priority !== "high") continue;

    // Auto-fix: Submit top pages to Indexing API if they have impressions but no clicks
    if (insight.action.includes("impressions but ZERO clicks")) {
      fixes.push({
        type: "reindex",
        action: "Submit zero-click pages to Indexing API",
        status: "pending-manual",
      });
    }

    // Auto-fix: Rising trend detected
    if (insight.action.includes("Rising trend")) {
      fixes.push({
        type: "trend-content",
        action: `Queue blog post targeting: ${insight.action.split('"')[1] || "rising query"}`,
        status: "pending-manual",
      });
    }
  }

  if (fixes.length > 0) {
    console.log(`\n🔧 Auto-fix opportunities: ${fixes.length}`);
    fixes.forEach((f) => console.log(`  → ${f.action}`));
  }

  return fixes;
}

// ═══════════════════════════════════════════════
// GENERATE DAILY REPORT
// ═══════════════════════════════════════════════

function generateReport() {
  const now = new Date();
  console.log("\n" + "═".repeat(50));
  console.log("  QFINHUB Growth Optimizer v2 — Daily Report");
  console.log("  " + now.toISOString().split("T")[0]);
  console.log("═".repeat(50));

  // 1. Pull analytics
  console.log("\n📊 [1/4] Pulling analytics data...");
  const traffic = pullAnalyticsData();

  // 2. Analyze traffic
  console.log("\n📈 [2/4] Analyzing traffic patterns...");
  const { insights, metrics } = analyzeTraffic(traffic);

  // 3. Engine health
  console.log("\n🔧 [3/4] Checking engine health...");
  const engineHealth = checkEngineHealth();

  // 4. Recommendations
  console.log("\n💡 [4/4] Generating recommendations...");
  const recommendations = generateRecommendations(insights, engineHealth);

  // Build report
  const report = {
    date: now.toISOString().split("T")[0],
    timestamp: now.toISOString(),
    traffic: {
      gsc: metrics.gsc || {},
      ga4: metrics.ga || {},
      trends: metrics.trends || {},
    },
    engineHealth,
    insights,
    recommendations,
  };

  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("  📋 DAILY REPORT SUMMARY");
  console.log("═".repeat(50));

  if (metrics.gsc) {
    console.log(
      `  🔍 GSC:  ${metrics.gsc.clicks} clicks | ${metrics.gsc.impressions} impressions | Avg pos ${metrics.gsc.avgPosition}`
    );
  }
  if (metrics.ga) {
    console.log(
      `  📈 GA4:  ${metrics.ga.users} users | ${metrics.ga.sessions} sessions | ${metrics.ga.pageviews} pageviews`
    );
  }
  if (metrics.trends?.topKeywords) {
    console.log(
      `  🔥 Trends: ${metrics.trends.topKeywords
        .map((k) => `${k.keyword}(${k.score})`)
        .join(", ")}`
    );
  }

  console.log(
    `  🔧 Engines: ${Object.values(engineHealth.engines).filter((e) => e.status === "ok").length}/${Object.keys(engineHealth.engines).length} healthy`
  );
  console.log(`  💡 Recommendations: ${recommendations.length}`);

  if (recommendations.length > 0) {
    console.log(`\n  TOP ACTIONS:`);
    recommendations.slice(0, 5).forEach((r, i) => {
      const icon = r.priority === "high" ? "🔴" : r.priority === "medium" ? "🟡" : "🟢";
      console.log(`  ${i + 1}. ${icon} ${r.action}`);
    });
  }

  // Auto-fix
  if (args.includes("--fix")) {
    autoFix(insights);
  }

  return report;
}

// ═══════════════════════════════════════════════
// LOG
// ═══════════════════════════════════════════════

function log(type, details) {
  let l = [];
  if (existsSync(LOG_FILE))
    try {
      l = JSON.parse(readFileSync(LOG_FILE, "utf-8"));
    } catch (e) {}
  l.push({ ts: new Date().toISOString(), type, details });
  if (l.length > 90) l = l.slice(-90);
  writeFileSync(LOG_FILE, JSON.stringify(l, null, 2));
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

async function main() {
  const report = generateReport();

  log("daily-run-v2", {
    gscClicks: report.traffic?.gsc?.clicks || 0,
    gscImpressions: report.traffic?.gsc?.impressions || 0,
    gaUsers: report.traffic?.ga4?.users || 0,
    enginesOk: Object.values(report.engineHealth.engines).filter(
      (e) => e.status === "ok"
    ).length,
    recommendations: report.recommendations.length,
  });

  console.log(`\n✅ Growth Optimizer v2 complete.`);
  console.log(`📁 Reports: .optimizer-data/daily-report.json + traffic-report.json`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
