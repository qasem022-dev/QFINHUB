#!/usr/bin/env python3
"""
Phase 39 keyword-mining snapshot — GSC + Google Suggest + (optional) pytrends
in one run. Saves merged JSON for any downstream page planner.

Use this at the START of every page update or new page creation, per the
search-demand-first gate (Jul 2026 protocol).

Outputs:
  /home/admin1/qfinhub/.optimizer-data/phase39-keyword-snapshot-<timestamp>.json
  /home/admin1/qfinhub/.optimizer-data/phase39-keyword-snapshot-latest.json

Usage:
  python3 scripts/phase39-keyword-mining-snapshot.py --queries "401k calculator,401k growth calculator" [--days 28]
  python3 scripts/phase39-keyword-mining-snapshot.py --seeds "investment-return,tax-calculator" [--top 25]

Args:
  --queries  Comma-separated literal queries to mine Google Suggest for
  --seeds    Calculator slugs (fetches their primary keyword automatically)
  --days     Lookback window for GSC (default 28)
  --top      Top N GSC queries per page (default 25)
  --with-trends  Also pull pytrends data (install pytrends first)
"""

import argparse
import importlib.util
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime


# ---------- Auth ----------
def get_token():
    spec = importlib.util.spec_from_file_location(
        'gsc_sa', '/home/admin1/qfinhub/scripts/gsc-service-account-auth.py')
    sa = importlib.util.module_from_spec(spec); spec.loader.exec_module(sa)
    return sa.get_access_token()


# ---------- Google Suggest ----------
def suggest(q):
    try:
        url = 'https://suggestqueries.google.com/complete/search?client=firefox&q=' + urllib.parse.quote(q)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        return data[1] if len(data) > 1 else []
    except Exception as e:
        return []


# ---------- GSC ----------
def gsc_query(token, body):
    req = urllib.request.Request(
        'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.qfinhub.com/searchAnalytics/query',
        data=json.dumps(body).encode(), method='POST',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


# ---------- pytrends (optional) ----------
def trends_safe(*queries):
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl='en-US', tz=360, retries=2, backoff_factor=0.5)
        pytrends.build_payload(list(queries), timeframe='today 12-m')
        df = pytrends.interest_over_time()
        if df.empty:
            return {}
        out = {}
        for q in queries:
            if q in df.columns:
                series = df[q].tolist()
                non_zero = [v for v in series if v > 0]
                if not non_zero:
                    direction = 'flat'
                else:
                    first_half = series[:len(series)//2]
                    second_half = series[len(series)//2:]
                    a = sum(first_half) / max(len([v for v in first_half if v>0]), 1)
                    b = sum(second_half) / max(len([v for v in second_half if v>0]), 1)
                    direction = 'growing' if b > a * 1.15 else ('declining' if b < a * 0.85 else 'flat')
                out[q] = {'direction': direction, 'current': series[-1] if series else 0}
        # Also pull related queries
        try:
            rq = pytrends.related_queries()
            for q in queries:
                if q in rq and rq[q].get('rising') is not None:
                    out.setdefault(q, {})['rising'] = rq[q]['rising']['query'].head(10).tolist()
        except Exception:
            pass
        return out
    except ImportError:
        print('  pytrends not installed — skipping (pip install pytrends)', file=sys.stderr)
        return {}
    except Exception as e:
        print(f'  pytrends failed: {e}', file=sys.stderr)
        return {}


# ---------- Long-Form vs Short-Form classification ----------
def classify_form(query):
    """Return 'long-form' if ≥4 words (excluding stopwords), else 'short-form'."""
    stop = {'a', 'an', 'the', 'with', 'for', 'to', 'of', 'and', 'or', 'in', 'on', 'i', 'my'}
    words = [w for w in query.lower().split() if w not in stop]
    return 'long-form' if len(words) >= 3 else 'short-form'


# ---------- Rank-fast scoring ----------
RANK_FAST_SIGNALS = ['long-form', 'question-intent', 'gsc-impressions', 'position-8-30', 'trends-rising', 'not-navigational', 'weak-competitor']

def rank_fast_signals(query, gsc_imp=None, gsc_pos=None, trends_dir=None):
    """Returns list of satisfied signals."""
    q_lower = query.lower()
    nav_terms = ['app', 'excel', 'sheets', 'reddit', 'download', 'login', 'free trial']
    signals = []
    if classify_form(query) == 'long-form':
        signals.append('long-form')
    if any(q_lower.startswith(w) for w in ('how ', 'what ', 'why ', 'when ', 'can ', 'should ', 'will ', 'is ', 'are ')):
        signals.append('question-intent')
    if gsc_imp is not None and gsc_imp >= 5:
        signals.append('gsc-impressions')
    if gsc_pos is not None and 8 <= gsc_pos <= 30:
        signals.append('position-8-30')
    if trends_dir == 'growing':
        signals.append('trends-rising')
    if not any(t in q_lower for t in nav_terms):
        signals.append('not-navigational')
    signals.append('weak-competitor')  # default true for QFINHUB's niche (finance calc)
    return signals


# ---------- Main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--queries', help='Comma-separated literal queries to mine Google Suggest for')
    ap.add_argument('--seeds', help='Comma-separated calculator slugs to derive primary keywords from')
    ap.add_argument('--days', type=int, default=28)
    ap.add_argument('--top', type=int, default=25)
    ap.add_argument('--with-trends', action='store_true')
    args = ap.parse_args()

    seed_queries = []
    if args.queries:
        seed_queries.extend([q.strip() for q in args.queries.split(',') if q.strip()])
    if args.seeds:
        # Load calculator slugs
        with open('/home/admin1/qfinhub/src/lib/calculators/index.ts') as f:
            src = f.read()
        import re
        for slug in [s.strip() for s in args.seeds.split(',') if s.strip()]:
            m = re.search(rf'slug:\s*"{re.escape(slug)}",[^}}]*?title:\s*"([^"]+)"', src, re.S)
            if m:
                seed_queries.append(m.group(1).lower())

    if not seed_queries:
        print('Provide --queries or --seeds', file=sys.stderr); sys.exit(1)

    print(f'Snapshot for {len(seed_queries)} queries: {seed_queries}', file=sys.stderr)

    # 1) GSC truth
    token = get_token()
    end_dt = datetime.now()
    start_dt = end_dt - __import__('datetime').timedelta(days=args.days)
    gsc_data = gsc_query(token, {
        'startDate': start_dt.strftime('%Y-%m-%d'),
        'endDate': end_dt.strftime('%Y-%m-%d'),
        'dimensions': ['query'],
        'rowLimit': 500,
    })
    gsc_rows = gsc_data.get('rows', [])
    gsc_by_query = {r['keys'][0]: r for r in gsc_rows}

    # 2) Google Suggest for each seed + variations
    all_suggest = set()
    seed_data = {}
    for q in seed_queries:
        results = []
        for variant in [q, f'{q} 2026', f'how to {q}', f'{q} formula', f'{q} calculator']:
            results.extend(suggest(variant))
            time.sleep(0.18)
        unique = sorted(set(results), key=lambda x: x.lower())
        seed_data[q] = unique
        all_suggest.update(unique)

    # 3) pytrends (optional)
    trends_data = {}
    if args.with_trends:
        # Only run on top 5 suggested + 3 seeds
        sample = list(all_suggest)[:5] + seed_queries[:3]
        trends_data = trends_safe(*sample[:5])

    # 4) Build output
    per_seed = {}
    for seed, suggests in seed_data.items():
        per_suggest = []
        for s in suggests:
            gsc = gsc_by_query.get(s, {})
            imp = gsc.get('impressions', 0)
            pos = gsc.get('position')
            clk = gsc.get('clicks', 0)
            t_dir = trends_data.get(s, {}).get('direction') if s in trends_data else None
            signals = rank_fast_signals(s, imp, pos, t_dir)
            per_suggest.append({
                'query': s,
                'form': classify_form(s),
                'gscImpressions28d': imp,
                'gscClicks28d': clk,
                'gscAvgPosition': pos,
                'trends12moDirection': t_dir,
                'rankFastSignals': signals,
                'rankFastScore': len(signals),
                'isRankFast': len(signals) >= 5,
            })
        per_suggest.sort(key=lambda x: (-x['gscImpressions28d'], -x['rankFastScore']))
        per_seed[seed] = {
            'queries': per_suggest[:args.top],
            'rankFastCount': sum(1 for x in per_suggest if x['isRankFast']),
        }

    out = {
        'generated_at': datetime.now().isoformat() + 'Z',
        'gsc_window_days': args.days,
        'seeds': seed_queries,
        'trends_collected': bool(trends_data),
        'per_seed': per_seed,
    }

    out_dir = '/home/admin1/qfinhub/.optimizer-data'
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    p1 = os.path.join(out_dir, f'phase39-keyword-snapshot-{ts}.json')
    p2 = os.path.join(out_dir, 'phase39-keyword-snapshot-latest.json')
    for p in (p1, p2):
        with open(p, 'w') as f:
            json.dump(out, f, indent=2)

    # Summary
    print(f'\n=== SUMMARY ===', file=sys.stderr)
    for seed, data in per_seed.items():
        print(f'\n{seed}: {len(data["queries"])} queries, {data["rankFastCount"]} rank-fast', file=sys.stderr)
        for q in data['queries'][:5]:
            mark = '⚡' if q['isRankFast'] else '  '
            pos_str = str(q['gscAvgPosition'])[:5] if q['gscAvgPosition'] else '-'
            print('  ' + mark + ' ' + q['query'][:60].ljust(60) + ' form=' + q['form'][:10].ljust(10) + ' imp=' + str(q['gscImpressions28d']).rjust(4) + ' pos=' + pos_str.rjust(5) + ' signals=' + str(q['rankFastScore']) + '/7', file=sys.stderr)
    print(f'\nSaved: {p1}', file=sys.stderr)
    print(f'Latest: {p2}', file=sys.stderr)


if __name__ == '__main__':
    main()
