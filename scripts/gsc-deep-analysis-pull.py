#!/usr/bin/env python3
"""
GSC Deep-Dive Analysis — Pull & Analyze
Pulls all 3 dimensions (page, query, query+page) at rowLimit=500
for 7-day, 28-day, and previous-7-day comparison windows.
Then performs 4 deep analysis passes:
  1) Snippet leakage — pages with most impressions but zero clicks
  2) Best position-to-impression ratio queries
  3) Content gaps — searches with no matching pages
  4) Indexing state — pages indexed vs discovered, crawl rate trends

Auth: Service Account via gsc-service-account-auth.py (importlib.util pattern)
"""
import urllib.request, urllib.parse, json, os, sys, hashlib, time
from datetime import datetime, timedelta, timezone
from collections import defaultdict

# ── Import service account auth (hyphenated filename → importlib.util) ──
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "gsc_sa_auth",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "gsc-service-account-auth.py")
)
_sa_auth = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sa_auth)
get_access_token = _sa_auth.get_access_token

# ── Constants ─────────────────────────────────────────────────────
OUTPUT_FILE = ".optimizer-data/gsc-deep-analysis-2026-06-29.json"
SITE = "https://www.qfinhub.com"
SITE_ENC = urllib.parse.quote(SITE, safe='')
ROW_LIMIT = 500
TIMEOUT = 30

# ── Date windows (GSC has 2-3 day lag, latest available ~Jun 26) ──
pull_ts = datetime.now(timezone.utc)
END_DATE_7D = (pull_ts - timedelta(days=3)).date()  # ~Jun 26
START_DATE_7D = END_DATE_7D - timedelta(days=6)     # ~Jun 20

# Previous 7-day comparison
PREV_END = START_DATE_7D - timedelta(days=1)         # ~Jun 19
PREV_START = PREV_END - timedelta(days=6)             # ~Jun 13

# 28-day window
END_DATE_28D = END_DATE_7D
START_DATE_28D = END_DATE_28D - timedelta(days=27)   # ~May 30

print(f"=== GSC Deep Analysis Pull ===")
print(f"  7-day:  {START_DATE_7D} → {END_DATE_7D}")
print(f" 28-day:  {START_DATE_28D} → {END_DATE_28D}")
print(f" Prev 7d: {PREV_START} → {PREV_END}")
print(f"  Property: {SITE}")

# ── Auth ──────────────────────────────────────────────────────────
try:
    access_token = get_access_token()
    print(f"✅ Service Account auth OK")
except Exception as e:
    print(f"❌ Auth failed: {e}")
    sys.exit(1)

# ── GSC Pull Function ─────────────────────────────────────────────
def gsc_pull(dims, start, end, rowLimit=ROW_LIMIT, timeout=TIMEOUT):
    """Pull GSC Search Analytics. Returns (data_dict, checksum)."""
    body = json.dumps({
        "startDate": str(start),
        "endDate": str(end),
        "dimensions": dims,
        "rowLimit": rowLimit,
        "searchType": "web"
    }).encode()
    req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE_ENC}/searchAnalytics/query",
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    )
    resp = urllib.request.urlopen(req, timeout=timeout)
    data = json.loads(resp.read())
    rows = data.get("rows", [])
    chk = hashlib.md5(json.dumps(rows, sort_keys=True).encode()).hexdigest()[:12]
    return data, chk


# ═══════════════════════════════════════════════════════════════════
# PHASE 1: PULL ALL DATA
# ═══════════════════════════════════════════════════════════════════

print("\n── Pulling 7-day page dimension ──")
d7_page, d7_page_chk = gsc_pull(["page"], str(START_DATE_7D), str(END_DATE_7D))
d7_page_rows = d7_page.get("rows", [])
print(f"  Pages: {len(d7_page_rows)} rows")

print("── Pulling 7-day query dimension ──")
d7_query, d7_query_chk = gsc_pull(["query"], str(START_DATE_7D), str(END_DATE_7D))
d7_query_rows = d7_query.get("rows", [])
print(f"  Queries: {len(d7_query_rows)} rows")

print("── Pulling 7-day query+page dimension ──")
d7_qp, d7_qp_chk = gsc_pull(["query", "page"], str(START_DATE_7D), str(END_DATE_7D))
d7_qp_rows = d7_qp.get("rows", [])
print(f"  Query+Page: {len(d7_qp_rows)} rows")

print("── Pulling 28-day page dimension ──")
d28_page, d28_page_chk = gsc_pull(["page"], str(START_DATE_28D), str(END_DATE_28D))
d28_page_rows = d28_page.get("rows", [])
print(f"  Pages: {len(d28_page_rows)} rows")

print("── Pulling 28-day query dimension ──")
d28_query, d28_query_chk = gsc_pull(["query"], str(START_DATE_28D), str(END_DATE_28D))
d28_query_rows = d28_query.get("rows", [])
print(f"  Queries: {len(d28_query_rows)} rows")

print("── Pulling 28-day query+page dimension ──")
d28_qp, d28_qp_chk = gsc_pull(["query", "page"], str(START_DATE_28D), str(END_DATE_28D))
d28_qp_rows = d28_qp.get("rows", [])
print(f"  Query+Page: {len(d28_qp_rows)} rows")

print("── Pulling prev-7-day page dimension (comparison) ──")
prev_page, prev_page_chk = gsc_pull(["page"], str(PREV_START), str(PREV_END))
prev_page_rows = prev_page.get("rows", [])
print(f"  Pages: {len(prev_page_rows)} rows")

print("── Pulling prev-7-day query dimension ──")
prev_query, prev_query_chk = gsc_pull(["query"], str(PREV_START), str(PREV_END))
prev_query_rows = prev_query.get("rows", [])
print(f"  Queries: {len(prev_query_rows)} rows")

print("── Pulling prev-7-day query+page dimension ──")
prev_qp, prev_qp_chk = gsc_pull(["query", "page"], str(PREV_START), str(PREV_END))
prev_qp_rows = prev_qp.get("rows", [])
print(f"  Query+Page: {len(prev_qp_rows)} rows")


# ═══════════════════════════════════════════════════════════════════
# PHASE 2: INDEXING STATE
# ═══════════════════════════════════════════════════════════════════

print("\n── Pulling sitemap/index coverage data ──")
indexing_data = {}

# Get sitemap info
try:
    sitemap_req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE_ENC}/sitemaps",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    sitemap_resp = urllib.request.urlopen(sitemap_req, timeout=TIMEOUT)
    sitemap_data = json.loads(sitemap_resp.read())
    sitemaps = sitemap_data.get("sitemap", [])
    total_submitted = 0
    total_warnings = 0
    sitemap_entries = []
    for sm in sitemaps:
        entry = {
            "path": sm.get("path", ""),
            "lastSubmitted": sm.get("lastSubmitted", ""),
            "isPending": sm.get("isPending", False),
            "warnings": sm.get("warnings", 0),
            "errors": sm.get("errors", 0),
            "contents": [],
        }
        # Get contents for each sitemap
        sm_path_enc = urllib.parse.quote(sm["path"], safe='')
        try:
            smc_req = urllib.request.Request(
                f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE_ENC}/sitemaps/{sm_path_enc}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            smc_resp = urllib.request.urlopen(smc_req, timeout=TIMEOUT)
            smc_data = json.loads(smc_resp.read())
            contents = smc_data.get("contents", [])
            for c in contents:
                submitted = int(c.get("submitted", 0))
                indexed = int(c.get("indexed", 0))
                total_submitted += submitted
                entry["contents"].append({
                    "type": c.get("type", "web"),
                    "submitted": submitted,
                    "indexed": indexed,
                })
        except Exception as e2:
            entry["contents_error"] = str(e2)[:200]
        total_warnings += int(sm.get("warnings", 0))
        sitemap_entries.append(entry)

    indexing_data["sitemaps"] = {
        "count": len(sitemaps),
        "total_submitted": total_submitted,
        "total_indexed": sum(
            sum(c.get("indexed", 0) for c in e.get("contents", []))
            for e in sitemap_entries
        ),
        "total_warnings": total_warnings,
        "entries": sitemap_entries,
    }
    print(f"  Sitemaps: {len(sitemaps)}, submitted: {total_submitted}, indexed: {indexing_data['sitemaps']['total_indexed']}")
except Exception as e:
    indexing_data["sitemaps"] = {"error": str(e)[:300]}
    print(f"  Sitemap error: {e}")

# Get crawl stats (if available)
try:
    crawl_req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/v1/sites/{SITE_ENC}/urlInspection/index",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    # Note: GSC API v1 doesn't expose crawl stats directly.
    # We'll attempt to use the legacy method.
    indexing_data["crawl_stats"] = {
        "note": "GSC API doesn't expose crawl stats via standard endpoint. "
                "Index coverage is approximated from sitemap data above."
    }
except Exception:
    pass


# ═══════════════════════════════════════════════════════════════════
# PHASE 3: ANALYSIS — Snippet Leakage (pages with impressions, 0 clicks)
# ═══════════════════════════════════════════════════════════════════

print("\n── Analysis 1: Snippet Leakage ──")

def analyze_snippet_leakage(page_rows, label):
    """Find pages getting impressions but zero clicks — 'snippet leakage'."""
    zero_click = [r for r in page_rows if r.get("clicks", 0) == 0 and r.get("impressions", 0) > 0]
    zero_click.sort(key=lambda r: r.get("impressions", 0), reverse=True)

    total_imp = sum(r.get("impressions", 0) for r in zero_click)
    total_pages = len(page_rows)
    leaking_pct = round(len(zero_click) / max(total_pages, 1) * 100, 1)
    imp_lost_pct = round(total_imp / max(sum(r.get("impressions", 0) for r in page_rows), 1) * 100, 1)

    top_leakers = []
    for r in zero_click[:20]:
        page_url = r["keys"][0]
        # Derive page slug/type
        slug = page_url.replace(SITE, "").rstrip("/") or "/"
        # Classify page type
        if slug.startswith("/calculators/") or slug.startswith("/calculator/"):
            ptype = "calculator"
        elif "/blog/" in slug:
            ptype = "blog"
        elif "/tools/" in slug:
            ptype = "tool"
        elif slug in ("/", ""):
            ptype = "homepage"
        elif slug == "/index.html":
            ptype = "homepage"
        else:
            ptype = "other"

        top_leakers.append({
            "page": page_url,
            "slug": slug,
            "type": ptype,
            "impressions": r.get("impressions", 0),
            "clicks": 0,
            "ctr": 0.0,
            "avg_position": round(r.get("position", 0), 1),
        })

    return {
        "label": label,
        "total_zero_click_pages": len(zero_click),
        "total_pages_with_impressions": total_pages,
        "leaking_page_pct": leaking_pct,
        "impressions_lost_to_leakage": total_imp,
        "impressions_lost_pct": imp_lost_pct,
        "top_leakers": top_leakers,
    }

leakage_7d = analyze_snippet_leakage(d7_page_rows, "7-day")
leakage_28d = analyze_snippet_leakage(d28_page_rows, "28-day")
leakage_prev = analyze_snippet_leakage(prev_page_rows, "previous-7-day")


# ═══════════════════════════════════════════════════════════════════
# PHASE 4: ANALYSIS — Best Position-to-Impression Ratio Queries
# ═══════════════════════════════════════════════════════════════════

print("── Analysis 2: Position-to-Impression Ratio ──")

def analyze_position_impression_ratio(query_rows, label):
    """
    Find queries with the best 'bang for buck' — high impressions at good positions.
    We want: high impressions AND good position (low number).
    Score = impressions / position (higher = better visibility efficiency).
    Also identify 'undervalued' queries: good position but low CTR.
    """
    if not query_rows:
        return {"label": label, "error": "no data"}

    scored = []
    for r in query_rows:
        pos = r.get("position", 100)
        imp = r.get("impressions", 0)
        clicks = r.get("clicks", 0)
        ctr = r.get("ctr", 0.0)
        # Efficiency score: impressions per position point
        eff_score = round(imp / max(pos, 0.1), 1)

        # Undervalued: position < 10 but CTR < 2%
        undervalued = pos < 10 and ctr < 0.02

        scored.append({
            "query": r["keys"][0],
            "impressions": imp,
            "clicks": clicks,
            "ctr": round(ctr * 100, 2),
            "position": round(pos, 1),
            "efficiency_score": eff_score,
            "undervalued": undervalued,
        })

    scored.sort(key=lambda x: x["efficiency_score"], reverse=True)

    # Top efficiency
    top_efficient = scored[:30]

    # Undervalued queries (good pos, low CTR)
    undervalued = [q for q in scored if q["undervalued"]]
    undervalued.sort(key=lambda x: x["position"])

    # Queries with best CTR
    by_ctr = sorted(scored, key=lambda x: x["ctr"], reverse=True)[:20]

    # Queries ranking well (pos 1-3)
    top_positions = [q for q in scored if q["position"] <= 3]
    top_positions.sort(key=lambda x: x["impressions"], reverse=True)

    return {
        "label": label,
        "total_queries": len(scored),
        "top_by_efficiency": top_efficient,
        "undervalued_queries": undervalued[:20],
        "top_ctr_queries": by_ctr,
        "top_position_queries": top_positions[:20],
        "efficiency_stats": {
            "max_efficiency": scored[0]["efficiency_score"] if scored else 0,
            "avg_efficiency": round(sum(q["efficiency_score"] for q in scored) / max(len(scored), 1), 1),
            "queries_above_avg_efficiency": len([q for q in scored if q["efficiency_score"] > (sum(q["efficiency_score"] for q in scored) / max(len(scored), 1))]),
        },
    }

pos_imp_7d = analyze_position_impression_ratio(d7_query_rows, "7-day")
pos_imp_28d = analyze_position_impression_ratio(d28_query_rows, "28-day")
pos_imp_prev = analyze_position_impression_ratio(prev_query_rows, "previous-7-day")


# ═══════════════════════════════════════════════════════════════════
# PHASE 5: ANALYSIS — Content Gaps
# ═══════════════════════════════════════════════════════════════════

print("── Analysis 3: Content Gaps ──")

def analyze_content_gaps(query_rows, page_rows, qp_rows, label):
    """
    Find gaps between what people search and what pages exist.
    - Queries with impressions but no good matching page (high position)
    - Query clusters (topics) with demand but no dedicated page
    - Pages that rank for queries they aren't optimized for
    """
    if not query_rows or not qp_rows:
        return {"label": label, "error": "insufficient data"}

    # Build query → pages mapping from query+page dimension
    query_pages = defaultdict(list)
    for r in qp_rows:
        query_pages[r["keys"][0]].append({
            "page": r["keys"][1],
            "impressions": r.get("impressions", 0),
            "clicks": r.get("clicks", 0),
            "position": round(r.get("position", 0), 1),
        })

    # Build page → queries mapping
    page_queries = defaultdict(list)
    for r in qp_rows:
        page_queries[r["keys"][1]].append({
            "query": r["keys"][0],
            "impressions": r.get("impressions", 0),
            "clicks": r.get("clicks", 0),
            "position": round(r.get("position", 0), 1),
        })

    # Gap type 1: High-impression queries with poor average position (no good page)
    query_avg_pos = {}
    for r in query_rows:
        query_avg_pos[r["keys"][0]] = r.get("position", 100)

    high_demand_poor_pos = []
    for q, pos in query_avg_pos.items():
        imp = next((r.get("impressions", 0) for r in query_rows if r["keys"][0] == q), 0)
        if pos > 20 and imp >= 10:  # Page 3+ with decent impressions = content gap
            pages = query_pages.get(q, [])
            high_demand_poor_pos.append({
                "query": q,
                "impressions": imp,
                "avg_position": round(pos, 1),
                "matching_pages": len(pages),
                "best_page": pages[0]["page"] if pages else None,
                "best_page_position": pages[0]["position"] if pages else None,
            })

    high_demand_poor_pos.sort(key=lambda x: x["impressions"], reverse=True)
    high_demand_poor_pos = high_demand_poor_pos[:30]

    # Gap type 2: Query topic clusters not well-served
    # Group queries by common words/topics
    topic_clusters = defaultdict(list)
    stopwords = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
                 "have", "has", "had", "do", "does", "did", "will", "would", "could",
                 "should", "may", "might", "can", "shall", "to", "of", "in", "for",
                 "on", "with", "at", "by", "from", "as", "into", "about", "like",
                 "through", "after", "over", "between", "out", "against", "during",
                 "without", "before", "under", "around", "among", "and", "or", "but",
                 "if", "because", "then", "than", "so", "just", "also", "now", "how",
                 "what", "which", "who", "whom", "this", "that", "these", "those"}

    for q, pages in query_pages.items():
        words = [w.lower().strip(",.!?()[]{}:;\"'") for w in q.split()
                 if w.lower().strip(",.!?()[]{}:;\"'") not in stopwords
                 and len(w.strip(",.!?()[]{}:;\"'")) > 2]
        for w in set(words):
            topic_clusters[w].append({
                "query": q,
                "impressions": sum(p["impressions"] for p in pages),
                "pages": [p["page"] for p in pages],
            })

    # Aggregate topic clusters
    topic_summary = []
    for word, entries in topic_clusters.items():
        if len(entries) >= 3:  # At least 3 queries sharing this topic
            total_imp = sum(e["impressions"] for e in entries)
            unique_pages = set()
            for e in entries:
                unique_pages.update(e["pages"])
            topic_summary.append({
                "topic": word,
                "query_count": len(entries),
                "total_impressions": total_imp,
                "unique_pages_serving": len(unique_pages),
                "coverage_ratio": round(len(unique_pages) / len(entries), 2),
            })

    topic_summary.sort(key=lambda x: x["total_impressions"], reverse=True)

    # Gap type 3: Pages ranking for irrelevant queries (optimization gaps)
    misaligned_pages = []
    for page_url, queries in page_queries.items():
        slug = page_url.replace(SITE, "").lower()
        # Check if queries match the page's topic
        mismatches = []
        for qe in queries[:10]:
            q = qe["query"].lower()
            # Simple mismatch detection: query doesn't contain slug keywords
            slug_keywords = [w for w in slug.replace("/", " ").replace("-", " ").split()
                             if len(w) > 2]
            match = any(kw in q for kw in slug_keywords) if slug_keywords else True
            if not match:
                mismatches.append(qe)

        if mismatches:
            total_mis_imp = sum(m["impressions"] for m in mismatches)
            misaligned_pages.append({
                "page": page_url,
                "slug": slug,
                "mismatched_queries": len(mismatches),
                "mismatch_impressions": total_mis_imp,
                "examples": [m["query"] for m in mismatches[:5]],
            })

    misaligned_pages.sort(key=lambda x: x["mismatch_impressions"], reverse=True)
    misaligned_pages = misaligned_pages[:20]

    # Content gap scoring
    gap_score = {
        "high_demand_poor_position_queries": len(high_demand_poor_pos),
        "topic_clusters": len([t for t in topic_summary if t["coverage_ratio"] < 0.5]),
        "misaligned_pages": len(misaligned_pages),
        "overall_gap_severity": "HIGH" if len(high_demand_poor_pos) > 15 else "MEDIUM" if len(high_demand_poor_pos) > 5 else "LOW",
    }

    return {
        "label": label,
        "unique_queries": len(query_rows),
        "unique_pages": len(page_rows),
        "query_page_pairs": len(qp_rows),
        "high_demand_poor_position": high_demand_poor_pos,
        "topic_clusters": topic_summary[:30],
        "misaligned_pages": misaligned_pages,
        "gap_assessment": gap_score,
    }

gaps_7d = analyze_content_gaps(d7_query_rows, d7_page_rows, d7_qp_rows, "7-day")
gaps_28d = analyze_content_gaps(d28_query_rows, d28_page_rows, d28_qp_rows, "28-day")


# ═══════════════════════════════════════════════════════════════════
# PHASE 6: TREND COMPARISON
# ═══════════════════════════════════════════════════════════════════

print("── Computing Trends ──")

# Aggregate metrics
d7_total_imp = sum(r.get("impressions", 0) for r in d7_page_rows)
d7_total_clicks = sum(r.get("clicks", 0) for r in d7_page_rows)
prev_total_imp = sum(r.get("impressions", 0) for r in prev_page_rows)
prev_total_clicks = sum(r.get("clicks", 0) for r in prev_page_rows)
d28_total_imp = sum(r.get("impressions", 0) for r in d28_page_rows)
d28_total_clicks = sum(r.get("clicks", 0) for r in d28_page_rows)

# Weighted avg position
def wavg_pos(rows):
    total_imp = sum(r.get("impressions", 0) for r in rows)
    if total_imp == 0:
        return 0.0
    return round(sum(r.get("impressions", 0) * r.get("position", 0) for r in rows) / total_imp, 1)

d7_pos = wavg_pos(d7_page_rows)
prev_pos = wavg_pos(prev_page_rows)
d28_pos = wavg_pos(d28_page_rows)

# Unique pages comparison
d7_unique_pages = len(d7_page_rows)
prev_unique_pages = len(prev_page_rows)

# Pages gained/lost
d7_page_urls = set(r["keys"][0] for r in d7_page_rows)
prev_page_urls = set(r["keys"][0] for r in prev_page_rows)
pages_gained = d7_page_urls - prev_page_urls
pages_lost = prev_page_urls - d7_page_urls

# Query comparison
d7_query_set = set(r["keys"][0] for r in d7_query_rows)
prev_query_set = set(r["keys"][0] for r in prev_query_rows)
queries_gained = d7_query_set - prev_query_set
queries_lost = prev_query_set - d7_query_set

trends = {
    "metrics_comparison": {
        "7d": {
            "impressions": d7_total_imp,
            "clicks": d7_total_clicks,
            "ctr_pct": round(d7_total_clicks / max(d7_total_imp, 1) * 100, 2),
            "avg_position": d7_pos,
            "unique_pages": d7_unique_pages,
            "unique_queries": len(d7_query_rows),
            "query_page_pairs": len(d7_qp_rows),
            "date_range": {"start": str(START_DATE_7D), "end": str(END_DATE_7D)},
        },
        "28d": {
            "impressions": d28_total_imp,
            "clicks": d28_total_clicks,
            "ctr_pct": round(d28_total_clicks / max(d28_total_imp, 1) * 100, 2),
            "avg_position": d28_pos,
            "unique_pages": len(d28_page_rows),
            "unique_queries": len(d28_query_rows),
            "query_page_pairs": len(d28_qp_rows),
            "date_range": {"start": str(START_DATE_28D), "end": str(END_DATE_28D)},
        },
        "previous_7d": {
            "impressions": prev_total_imp,
            "clicks": prev_total_clicks,
            "ctr_pct": round(prev_total_clicks / max(prev_total_imp, 1) * 100, 2),
            "avg_position": prev_pos,
            "unique_pages": prev_unique_pages,
            "unique_queries": len(prev_query_rows),
            "query_page_pairs": len(prev_qp_rows),
            "date_range": {"start": str(PREV_START), "end": str(PREV_END)},
        },
    },
    "changes_7d_vs_prev7d": {
        "impressions_change": d7_total_imp - prev_total_imp,
        "impressions_change_pct": round((d7_total_imp - prev_total_imp) / max(prev_total_imp, 1) * 100, 1),
        "clicks_change": d7_total_clicks - prev_total_clicks,
        "clicks_change_pct": round((d7_total_clicks - prev_total_clicks) / max(prev_total_clicks, 1) * 100, 1) if prev_total_clicks > 0 else "N/A (0 baseline)",
        "position_change": round(d7_pos - prev_pos, 1),
        "pages_gained": len(pages_gained),
        "pages_lost": len(pages_lost),
        "queries_gained": len(queries_gained),
        "queries_lost": len(queries_lost),
        "new_pages": sorted(list(pages_gained))[:30],
        "lost_pages": sorted(list(pages_lost))[:30],
        "new_queries": sorted(list(queries_gained))[:30],
        "lost_queries": sorted(list(queries_lost))[:30],
    },
}

# Daily trend from query+page data (aggregate by page to see daily spread)
# Note: GSC API aggregated data doesn't give daily breakdown unless we pull day-by-day.
# We'll note this limitation.
trends["daily_trend_note"] = "GSC API returns aggregated data for the date range. Daily breakdown requires separate per-day pulls (not performed in this deep analysis to stay within row limits)."


# ═══════════════════════════════════════════════════════════════════
# PHASE 7: PAGE-LEVEL DEEP DIVE (Top Pages)
# ═══════════════════════════════════════════════════════════════════

print("── Page-Level Deep Dive ──")

def page_deep_dive(page_rows, qp_rows, label):
    """For each top page, find what queries drive it and performance."""
    if not page_rows:
        return {"label": label, "error": "no data"}

    # Build page → queries
    page_q_map = defaultdict(list)
    for r in qp_rows:
        page_q_map[r["keys"][1]].append({
            "query": r["keys"][0],
            "impressions": r.get("impressions", 0),
            "clicks": r.get("clicks", 0),
            "position": round(r.get("position", 0), 1),
        })

    page_details = []
    for r in page_rows[:50]:  # Top 50 pages by impressions
        page_url = r["keys"][0]
        slug = page_url.replace(SITE, "").rstrip("/") or "/"
        imp = r.get("impressions", 0)
        clicks = r.get("clicks", 0)
        ctr = round(r.get("ctr", 0) * 100, 2)
        pos = round(r.get("position", 0), 1)

        queries = page_q_map.get(page_url, [])
        queries.sort(key=lambda x: x["impressions"], reverse=True)

        # Page classification
        if slug.startswith("/calculators/") or slug.startswith("/calculator/"):
            ptype = "calculator"
        elif "/blog/" in slug:
            ptype = "blog"
        elif "/tools/" in slug:
            ptype = "tool"
        elif slug in ("/", ""):
            ptype = "homepage"
        elif slug == "/index.html":
            ptype = "homepage"
        else:
            ptype = "other"

        page_details.append({
            "page": page_url,
            "slug": slug,
            "type": ptype,
            "impressions": imp,
            "clicks": clicks,
            "ctr_pct": ctr,
            "avg_position": pos,
            "query_count": len(queries),
            "top_queries": queries[:10],
            "performance_tier": (
                "HIGH_PERFORMER" if ctr > 3 and pos < 8 else
                "UNDERPERFORMER" if ctr < 1 and pos < 15 else
                "LOW_VISIBILITY" if pos > 20 else
                "AVERAGE"
            ),
        })

    # Classify by type
    type_breakdown = defaultdict(lambda: {"count": 0, "impressions": 0, "clicks": 0})
    for pd in page_details:
        t = pd["type"]
        type_breakdown[t]["count"] += 1
        type_breakdown[t]["impressions"] += pd["impressions"]
        type_breakdown[t]["clicks"] += pd["clicks"]

    return {
        "label": label,
        "total_page_rows_analyzed": len(page_details),
        "page_details": page_details,
        "type_breakdown": {k: {
            "count": v["count"],
            "impressions": v["impressions"],
            "clicks": v["clicks"],
            "ctr_pct": round(v["clicks"] / max(v["impressions"], 1) * 100, 2),
        } for k, v in sorted(type_breakdown.items())},
        "performance_summary": {
            "high_performers": len([p for p in page_details if p["performance_tier"] == "HIGH_PERFORMER"]),
            "underperformers": len([p for p in page_details if p["performance_tier"] == "UNDERPERFORMER"]),
            "low_visibility": len([p for p in page_details if p["performance_tier"] == "LOW_VISIBILITY"]),
            "average": len([p for p in page_details if p["performance_tier"] == "AVERAGE"]),
        },
    }

pages_d7 = page_deep_dive(d7_page_rows, d7_qp_rows, "7-day")
pages_d28 = page_deep_dive(d28_page_rows, d28_qp_rows, "28-day")


# ═══════════════════════════════════════════════════════════════════
# PHASE 8: ASSEMBLE & SAVE
# ═══════════════════════════════════════════════════════════════════

report = {
    "report_type": "GSC_Deep_Dive_Analysis",
    "generated": pull_ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "generated_at_timestamp": pull_ts.isoformat(),
    "property": SITE,
    "auth_method": "service_account",
    "data_freshness": {
        "gsc_lag_days": 3,
        "latest_data_date": str(END_DATE_7D),
        "pull_timestamp": pull_ts.isoformat(),
    },
    "date_windows": {
        "7_day": {"start": str(START_DATE_7D), "end": str(END_DATE_7D)},
        "28_day": {"start": str(START_DATE_28D), "end": str(END_DATE_28D)},
        "previous_7_day": {"start": str(PREV_START), "end": str(PREV_END)},
    },
    "pull_summary": {
        "dimensions_pulled": ["page", "query", "query+page"],
        "row_limit_per_pull": ROW_LIMIT,
        "total_api_calls": 9,
        "checksums": {
            "d7_page": d7_page_chk,
            "d7_query": d7_query_chk,
            "d7_qp": d7_qp_chk,
            "d28_page": d28_page_chk,
            "d28_query": d28_query_chk,
            "d28_qp": d28_qp_chk,
            "prev_page": prev_page_chk,
            "prev_query": prev_query_chk,
            "prev_qp": prev_qp_chk,
        },
    },
    "indexing_state": indexing_data,
    "trends": trends,
    "analysis_1_snippet_leakage": {
        "description": "Pages getting the most impressions but zero clicks — 'snippet leakage' where Google shows the page in results but users don't click through. These need title/meta-description optimization.",
        "7_day": leakage_7d,
        "28_day": leakage_28d,
        "previous_7_day": leakage_prev,
    },
    "analysis_2_position_impression_ratio": {
        "description": "Queries with the best position-to-impression ratio — high visibility efficiency. Also identifies undervalued queries (good position, low CTR) and top performers.",
        "7_day": pos_imp_7d,
        "28_day": pos_imp_28d,
        "previous_7_day": pos_imp_prev,
    },
    "analysis_3_content_gaps": {
        "description": "Content gaps between what people search and what pages exist. Identifies high-demand queries with poor positions, topic clusters without dedicated pages, and pages ranking for irrelevant queries.",
        "7_day": gaps_7d,
        "28_day": gaps_28d,
    },
    "analysis_4_page_level_deep_dive": {
        "description": "Per-page performance breakdown with query attribution. Classifies pages into performance tiers and breaks down by page type.",
        "7_day": pages_d7,
        "28_day": pages_d28,
    },
    "executive_summary": {
        "headline_7d": f"{d7_total_imp} impressions, {d7_total_clicks} clicks, CTR {round(d7_total_clicks/max(d7_total_imp,1)*100,2)}%, avg pos {d7_pos}",
        "trend_vs_prev": f"Impressions {'↑' if d7_total_imp >= prev_total_imp else '↓'}{abs(d7_total_imp-prev_total_imp)} ({round((d7_total_imp-prev_total_imp)/max(prev_total_imp,1)*100,1)}%)",
        "indexing_status": f"{indexing_data.get('sitemaps', {}).get('total_indexed', 'unknown')} indexed / {indexing_data.get('sitemaps', {}).get('total_submitted', 'unknown')} submitted",
        "top_leakage_count": leakage_7d["total_zero_click_pages"],
        "top_gap_queries": gaps_7d["gap_assessment"]["overall_gap_severity"],
        "pages_gained_7d": len(pages_gained),
        "pages_lost_7d": len(pages_lost),
        "high_performers": pages_d7.get("performance_summary", {}).get("high_performers", 0),
        "underperformers": pages_d7.get("performance_summary", {}).get("underperformers", 0),
    },
}

# Save
os.makedirs(os.path.dirname(OUTPUT_FILE) or ".", exist_ok=True)
with open(OUTPUT_FILE, "w") as f:
    json.dump(report, f, indent=2, default=str)

file_size = os.path.getsize(OUTPUT_FILE)
print(f"\n{'='*60}")
print(f"✅ DEEP ANALYSIS COMPLETE")
print(f"{'='*60}")
print(f"Output: {OUTPUT_FILE} ({file_size:,} bytes)")
print(f"\n── Executive Summary ──")
print(f"7-day: {d7_total_imp} imp, {d7_total_clicks} clicks, {round(d7_total_clicks/max(d7_total_imp,1)*100,2)}% CTR")
print(f"28-day: {d28_total_imp} imp, {d28_total_clicks} clicks")
print(f"Vs prev 7d: {d7_total_imp-prev_total_imp:+d} imp ({round((d7_total_imp-prev_total_imp)/max(prev_total_imp,1)*100,1):+}%)")
print(f"Indexed: {report['executive_summary']['indexing_status']}")
print(f"Snippet leakage pages: {leakage_7d['total_zero_click_pages']} ({leakage_7d['leaking_page_pct']}% of pages)")
print(f"Content gaps: {gaps_7d['gap_assessment']['high_demand_poor_position_queries']} high-demand poor-position queries")
print(f"High performers: {pages_d7.get('performance_summary', {}).get('high_performers', 0)} | Underperformers: {pages_d7.get('performance_summary', {}).get('underperformers', 0)}")
