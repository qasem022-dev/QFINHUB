#!/usr/bin/env python3
"""
GSC Daily Data Pipeline V3 — Service Account Auth
Phase 35: Switched from OAuth (7-day refresh token death) to Service Account (permanent).
Uses gsc-service-account-auth.py for token management.
No more refresh_token expiry. No more Testing mode 7-day limit.
"""
import urllib.request, urllib.parse, json, os, sys, hashlib, time
from datetime import datetime, timedelta, timezone

# Add scripts dir to path for local import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# Import service account auth (filename has hyphens, use importlib)
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "gsc_sa_auth",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "gsc-service-account-auth.py")
)
_sa_auth = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sa_auth)
get_access_token = _sa_auth.get_access_token

TRUTH_FILE = ".optimizer-data/gsc-api-truth-current.json"
CORRECTED_OUTPUT = ".optimizer-data/gsc-live-data-corrected.json"
SITE = "https://www.qfinhub.com"
SITE_ENC = urllib.parse.quote(SITE, safe='')

# ── Step 1: Get access token via service account ──────────────────
try:
    access = get_access_token()
    pull_timestamp = datetime.now(timezone.utc)
    print(f"Token: Service Account (no refresh needed)")
except Exception as e:
    print(f"❌ Service account auth failed: {e}")
    sys.exit(1)

# ── Step 2: Compute DYNAMIC date range ────────────────────────────
end_date = (pull_timestamp - timedelta(days=3)).date()
start_date = end_date - timedelta(days=6)
prev_end = start_date - timedelta(days=1)
prev_start = prev_end - timedelta(days=6)

def gsc_pull(dims, start, end, rowLimit=500, timeout=15):
    """Pull GSC Search Analytics data."""
    body = json.dumps({
        "startDate": str(start), "endDate": str(end),
        "dimensions": dims,
        "rowLimit": rowLimit,
        "searchType": "web"
    }).encode()
    req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE_ENC}/searchAnalytics/query",
        data=body,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=timeout)
    data = json.loads(resp.read())
    rows = data.get("rows", [])
    chk = hashlib.md5(json.dumps(rows, sort_keys=True).encode()).hexdigest()[:12]
    return data, chk

# ── Pull ALL dimensions ───────────────────────────────────────────
page_data, page_checksum = gsc_pull(["page"], str(start_date), str(end_date))
page_rows = page_data.get("rows", [])
page_imp = sum(r.get("impressions", 0) for r in page_rows)
page_clicks = sum(r.get("clicks", 0) for r in page_rows)
page_count = len(page_rows)
if page_imp > 0:
    wsum = sum(r.get("impressions", 0) * r.get("position", 0) for r in page_rows)
    page_pos = round(wsum / page_imp, 1)
else:
    page_pos = 0.0

query_data, query_checksum = gsc_pull(["query"], str(start_date), str(end_date))
query_rows = query_data.get("rows", [])
query_count = len(query_rows)
query_imp = sum(r.get("impressions", 0) for r in query_rows)

qp_data, qp_checksum = gsc_pull(["query", "page"], str(start_date), str(end_date))
qp_rows = qp_data.get("rows", [])
qp_count = len(qp_rows)

prev_data, prev_checksum = gsc_pull(["page"], str(prev_start), str(prev_end))
prev_rows = prev_data.get("rows", [])
prev_imp = sum(r.get("impressions", 0) for r in prev_rows)

t28_end = end_date
t28_start = t28_end - timedelta(days=27)
t28_data, t28_checksum = gsc_pull(["page"], str(t28_start), str(t28_end))
t28_rows = t28_data.get("rows", [])
t28_imp = sum(r.get("impressions", 0) for r in t28_rows)
t28_clicks = sum(r.get("clicks", 0) for r in t28_rows)
pages_with_clicks = [r for r in t28_rows if r.get("clicks", 0) > 0]

# ── Freshness proof ───────────────────────────────────────────────
prev_truth_checksum = None
if os.path.exists(TRUTH_FILE):
    with open(TRUTH_FILE) as f:
        pt = json.load(f)
        prev_truth_checksum = pt.get("checksum")

freshness = "FRESH"
if prev_truth_checksum == page_checksum:
    freshness = "SAME_CHECKSUM_AS_PREVIOUS_PULL"
if os.path.exists(TRUTH_FILE) and str(start_date) == pt.get("date_range", {}).get("start") and str(end_date) == pt.get("date_range", {}).get("end"):
    freshness = "STALE_SAME_DATE_RANGE" if freshness == "SAME_CHECKSUM_AS_PREVIOUS_PULL" else freshness

# ── Save canonical truth ──────────────────────────────────────────
try:
    prev_truth = json.load(open(TRUTH_FILE)) if os.path.exists(TRUTH_FILE) else {}
except:
    prev_truth = {}

truth = {
    "status": "LIVE_API_OK" if page_imp > 0 else "GSC_API_UNAVAILABLE",
    "generated": pull_timestamp.isoformat(),
    "pulled_at": pull_timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "property": SITE,
    "search_type": "web",
    "auth_method": "service_account",
    "service_account_email": "qfinhub-gsc-pipeline@qfinhub-indexing.iam.gserviceaccount.com",
    "date_range": {
        "start": str(start_date),
        "end": str(end_date)
    },
    "previous_7d_range": {
        "start": str(prev_start),
        "end": str(prev_end)
    },
    "dimensions_pulled": ["page", "query", "query+page"],
    "row_limits": 500,
    "metrics_7d": {
        "impressions": page_imp,
        "clicks": page_clicks,
        "ctr_pct": round(page_clicks / max(page_imp, 1) * 100, 1),
        "avg_position": page_pos,
        "pages_with_impressions": page_count,
        "query_count": query_count,
        "query_impressions": query_imp,
        "query_page_rows": qp_count
    },
    "metrics_28d": {
        "impressions": t28_imp,
        "clicks": t28_clicks,
        "pages_with_impressions": len(t28_rows),
        "pages_with_clicks": len(pages_with_clicks),
        "clicked_pages": [r["keys"][0] for r in pages_with_clicks]
    },
    "previous_7d": {
        "start": str(prev_start),
        "end": str(prev_end),
        "impressions": prev_imp
    },
    "change_7d": {
        "impressions": page_imp - prev_imp,
        "impressions_pct": round((page_imp - prev_imp) / max(prev_imp, 1) * 100, 1)
    },
    "freshness_proof": {
        "freshness": freshness,
        "checksum": page_checksum,
        "previous_checksum": prev_truth_checksum,
        "date_range_advanced": str(start_date) != prev_truth.get("date_range", {}).get("start", ""),
        "cache_used": False,
        "source_file": TRUTH_FILE
    },
    "manual_ui_comparison": {
        "available": True,
        "last_check": prev_truth.get("manual_ui_comparison", {}).get("last_check", "never"),
        "note": "FYI ONLY — NOT used in official KPIs"
    },
    "data_source_policy": "RAW_GSC_API_ONLY",
    "correction_factor": "DISABLED — not applied to official metrics per Phase 19.2 normalization"
}

with open(TRUTH_FILE, "w") as f:
    json.dump(truth, f, indent=2)

# ── Save corrected output (correction as documentation only) ──────
correction_baseline = {"factor_impressions": 1.0, "factor_position": 1.0, "last_calibrated": "never", "source": "disabled"}
baseline_path = ".optimizer-data/gsc-correction-baseline.json"
if os.path.exists(baseline_path):
    with open(baseline_path) as f:
        correction_baseline = json.load(f)

corrected = {
    "source": "GSC_API_RAW — CORRECTION DISABLED PER PHASE 19.2",
    "generated": pull_timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "date_range": {"start": str(start_date), "end": str(end_date)},
    "checksum": page_checksum,
    "auth_method": "service_account",
    "api_raw": {
        "impressions": page_imp,
        "clicks": page_clicks,
        "pages_with_impressions": page_count,
        "avg_position": page_pos,
        "query_level_impressions": query_imp
    },
    "correction": {
        "factor_impressions": correction_baseline.get("factor_impressions", 1.0),
        "factor_position": correction_baseline.get("factor_position", 1.0),
        "last_calibrated": correction_baseline.get("last_calibrated", "never"),
        "calibration_source": correction_baseline.get("source", "unknown"),
        "applied_to_official_kpi": False,
        "note": "Correction factor is DOCUMENTATION ONLY."
    },
    "corrected_estimate_fyi": {
        "impressions": round(page_imp * correction_baseline.get("factor_impressions", 1.0)),
        "clicks": page_clicks,
        "avg_position": round(page_pos * correction_baseline.get("factor_position", 1.0), 1),
        "note": "FYI ONLY — NOT official."
    }
}

with open(CORRECTED_OUTPUT, "w") as f:
    json.dump(corrected, f, indent=2)

print(f"GSC Pipeline V3 (Service Account) — {pull_timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}")
print(f"Auth: Service Account (permanent — no refresh_token expiry)")
print(f"Date range: {start_date} to {end_date}")
print(f"API RAW: {page_imp} imp, {page_clicks} clicks, {page_count} pages, pos {page_pos}")
print(f"Queries: {query_count} ({query_imp} query-imp)")
print(f"Freshness: {freshness}")
print(f"Files: {TRUTH_FILE}, {CORRECTED_OUTPUT}")
