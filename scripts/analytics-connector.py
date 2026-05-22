#!/usr/bin/env python3
"""
QFINHUB Analytics Connector — Unified GSC + GA4 + Google Trends
=================================================================
Fetches real performance data from all 3 sources and outputs a
unified JSON report for the Growth Optimizer.

USAGE:
  python3 scripts/analytics-connector.py              # Full report
  python3 scripts/analytics-connector.py --gsc-only   # GSC only
  python3 scripts/analytics-connector.py --trends-only # Trends only
  python3 scripts/analytics-connector.py --days 7      # Custom lookback

OUTPUT: .optimizer-data/traffic-report.json
"""

import json, os, sys, time, urllib.request, urllib.parse, urllib.error
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parent.parent
OAUTH_KEY_PATH = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN_PATH = Path.home() / '.hermes' / 'google-indexing-token.json'
REPORT_PATH = ROOT / '.optimizer-data' / 'traffic-report.json'
SITE_URL = 'https://www.qfinhub.com'
GA4_MEASUREMENT_ID = 'G-ZL2W7KLRK8'

# ═══════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════

def load_oauth_config():
    with open(OAUTH_KEY_PATH) as f:
        config = json.load(f)
    return config.get('installed', config.get('web', config))

def refresh_access_token(config):
    with open(TOKEN_PATH) as f:
        token_data = json.load(f)
    
    refresh_token = token_data.get('refresh_token')
    if not refresh_token:
        return None
    
    data = urllib.parse.urlencode({
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
    }).encode()
    
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    resp = urllib.request.urlopen(req, timeout=15)
    new_token = json.loads(resp.read())
    
    token_data['access_token'] = new_token['access_token']
    token_data['expires_in'] = new_token.get('expires_in', 3600)
    token_data['created_at'] = time.time()
    
    with open(TOKEN_PATH, 'w') as f:
        json.dump(token_data, f)
    
    return new_token['access_token']

def get_access_token():
    if TOKEN_PATH.exists():
        with open(TOKEN_PATH) as f:
            token_data = json.load(f)
        
        created = token_data.get('created_at', 0)
        expires = token_data.get('expires_in', 3600)
        if time.time() - created < expires - 120:
            return token_data['access_token']
    
    config = load_oauth_config()
    return refresh_access_token(config)

def api_get(url, timeout=30):
    """Make an authenticated GET request to a Google API."""
    token = get_access_token()
    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ⚠️ HTTP {e.code}: {body[:300]}", file=sys.stderr)
        return None

def api_post(url, body_dict, timeout=30):
    """Make an authenticated POST request to a Google API."""
    token = get_access_token()
    data = json.dumps(body_dict).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ⚠️ HTTP {e.code}: {body[:300]}", file=sys.stderr)
        return None

# ═══════════════════════════════════════════════
# GOOGLE SEARCH CONSOLE
# ═══════════════════════════════════════════════

def fetch_gsc_data(days=7):
    """Fetch clicks, impressions, CTR, position from Search Console."""
    print("📊 Fetching Google Search Console data...")
    
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    result = {
        'summary': {},
        'top_queries': [],
        'top_pages': [],
        'daily_trend': [],
        'queries_by_position': {'top3': [], 'top10': [], 'top20': [], 'top50': []},
    }
    
    # --- Query 1: Overall summary ---
    url = 'https://www.googleapis.com/webmasters/v3/sites/' + urllib.parse.quote(SITE_URL, safe='') + '/searchAnalytics/query'
    body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': [],
        'rowLimit': 1,
        'aggregationType': 'auto',
    }
    
    data = api_post(url, body)
    if data and 'rows' in data and data['rows']:
        row = data['rows'][0]
        result['summary'] = {
            'clicks': row.get('clicks', 0),
            'impressions': row.get('impressions', 0),
            'ctr': round(row.get('ctr', 0) * 100, 2),
            'position': round(row.get('position', 999), 1),
            'period_days': days,
        }
        print(f"  Clicks: {result['summary']['clicks']} | Impressions: {result['summary']['impressions']} | CTR: {result['summary']['ctr']}% | Pos: {result['summary']['position']}")
    else:
        print("  ⚠️ No GSC data returned — site may be too new or not yet indexed")
        result['summary'] = {'clicks': 0, 'impressions': 0, 'ctr': 0, 'position': 999, 'note': 'No data yet'}
    
    # --- Query 2: Top queries ---
    body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['query'],
        'rowLimit': 25,
        'orderBy': [{'field': 'clicks', 'direction': 'DESCENDING'}],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['top_queries'] = [
            {
                'query': r['keys'][0],
                'clicks': r['clicks'],
                'impressions': r['impressions'],
                'ctr': round(r['ctr'] * 100, 2),
                'position': round(r['position'], 1),
            }
            for r in data['rows'][:25]
        ]
        print(f"  Top queries: {len(result['top_queries'])} retrieved")
    
    # --- Query 3: Top pages ---
    body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['page'],
        'rowLimit': 25,
        'orderBy': [{'field': 'clicks', 'direction': 'DESCENDING'}],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['top_pages'] = [
            {
                'page': r['keys'][0],
                'clicks': r['clicks'],
                'impressions': r['impressions'],
                'ctr': round(r['ctr'] * 100, 2),
                'position': round(r['position'], 1),
            }
            for r in data['rows'][:25]
        ]
        print(f"  Top pages: {len(result['top_pages'])} retrieved")
    
    # --- Query 4: Daily trend ---
    body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['date'],
        'rowLimit': days,
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['daily_trend'] = [
            {
                'date': r['keys'][0],
                'clicks': r['clicks'],
                'impressions': r['impressions'],
                'ctr': round(r['ctr'] * 100, 2),
                'position': round(r['position'], 1),
            }
            for r in data['rows']
        ]
        print(f"  Daily trend: {len(result['daily_trend'])} days")
    
    # --- Query 5: Best-positioned queries (closest to page 1) ---
    body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['query'],
        'rowLimit': 25,
        'orderBy': [{'field': 'position', 'direction': 'ASCENDING'}],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        # Categorize by position manually
        for r in data['rows']:
            pos = r['position']
            q = r['keys'][0]
            if pos <= 3:
                result['queries_by_position']['top3'].append(q)
            elif pos <= 10:
                result['queries_by_position']['top10'].append(q)
            elif pos <= 20:
                result['queries_by_position']['top20'].append(q)
            elif pos <= 50:
                result['queries_by_position']['top50'].append(q)
        # Keep only top 5 per bracket
        for bracket in ['top3', 'top10', 'top20', 'top50']:
            result['queries_by_position'][bracket] = result['queries_by_position'][bracket][:5]
        print(f"  Position brackets: top3={len(result['queries_by_position']['top3'])}, top10={len(result['queries_by_position']['top10'])}, top20={len(result['queries_by_position']['top20'])}, top50={len(result['queries_by_position']['top50'])}")
    
    return result


# ═══════════════════════════════════════════════
# GOOGLE ANALYTICS 4
# ═══════════════════════════════════════════════

def discover_ga4_property():
    """Discover the GA4 property ID from the measurement ID G-ZL2W7KLRK8."""
    print("\n📈 Discovering GA4 property...")
    
    # Use Analytics Admin API to list account summaries
    url = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries'
    data = api_get(url)
    
    if not data or 'accountSummaries' not in data:
        print("  ⚠️ Could not list Analytics accounts")
        return None
    
    for account in data.get('accountSummaries', []):
        for prop in account.get('propertySummaries', []):
            # Check if this property has our measurement ID
            prop_name = prop.get('property', '')
            display = prop.get('displayName', '')
            
            # The property name is like "properties/123456789"
            if 'properties/' in prop_name:
                property_id = prop_name.split('/')[-1]
                
                # Try to find the data stream with our measurement ID
                streams_url = f'https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}/dataStreams'
                streams_data = api_get(streams_url)
                
                if streams_data and 'dataStreams' in streams_data:
                    for stream in streams_data['dataStreams']:
                        web_data = stream.get('webStreamData', {})
                        stream_mid = web_data.get('measurementId', '')
                        if stream_mid == GA4_MEASUREMENT_ID:
                            print(f"  ✅ Found: {display} → properties/{property_id}")
                            return property_id
    
    # Fallback: return first property (most likely the right one)
    for account in data.get('accountSummaries', []):
        for prop in account.get('propertySummaries', []):
            prop_name = prop.get('property', '')
            if 'properties/' in prop_name:
                property_id = prop_name.split('/')[-1]
                print(f"  ⚠️ Measurement ID {GA4_MEASUREMENT_ID} not matched — using first property: {prop.get('displayName')} ({property_id})")
                return property_id
    
    print("  ❌ No GA4 properties found")
    return None


def fetch_ga4_data(property_id, days=7):
    """Fetch users, sessions, pageviews, sources from GA4."""
    print("\n📈 Fetching Google Analytics data...")
    
    if not property_id:
        print("  ⚠️ No GA4 property ID — skipping")
        return None
    
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    result = {}
    
    url = f'https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport'
    
    # --- Traffic summary ---
    body = {
        'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
        'metrics': [
            {'name': 'totalUsers'},
            {'name': 'sessions'},
            {'name': 'screenPageViews'},
            {'name': 'averageSessionDuration'},
            {'name': 'bounceRate'},
            {'name': 'engagedSessions'},
        ],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        metrics = data['rows'][0]['metricValues']
        result['summary'] = {
            'users': int(metrics[0]['value']),
            'sessions': int(metrics[1]['value']),
            'pageviews': int(metrics[2]['value']),
            'avg_session_duration_sec': round(float(metrics[3]['value']), 1),
            'bounce_rate': round(float(metrics[4]['value']) * 100, 1),
            'engaged_sessions': int(metrics[5]['value']),
            'period_days': days,
        }
        print(f"  Users: {result['summary']['users']} | Sessions: {result['summary']['sessions']} | Pageviews: {result['summary']['pageviews']}")
    else:
        print("  ⚠️ No GA4 traffic data — may be too new")
        result['summary'] = {'note': 'No data yet'}
        return result
    
    # --- Traffic sources ---
    body = {
        'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
        'dimensions': [{'name': 'sessionSourceMedium'}],
        'metrics': [
            {'name': 'sessions'},
            {'name': 'totalUsers'},
        ],
        'orderBys': [{'metric': {'metricName': 'sessions'}, 'desc': True}],
        'limit': 10,
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['sources'] = [
            {
                'source': r['dimensionValues'][0]['value'],
                'sessions': int(r['metricValues'][0]['value']),
                'users': int(r['metricValues'][1]['value']),
            }
            for r in data['rows']
        ]
        # Categorize
        organic = sum(s['sessions'] for s in result['sources'] if 'google / organic' in s['source'])
        direct = sum(s['sessions'] for s in result['sources'] if 'direct' in s['source'])
        referral = sum(s['sessions'] for s in result['sources'] if 'referral' in s['source'])
        social = sum(s['sessions'] for s in result['sources'] if any(x in s['source'] for x in ['twitter', 'facebook', 'pinterest', 'reddit', 'linkedin']))
        result['source_summary'] = {
            'organic_search': organic,
            'direct': direct,
            'referral': referral,
            'social': social,
            'other': result['summary']['sessions'] - organic - direct - referral - social,
        }
        print(f"  Sources: Organic={organic} | Direct={direct} | Referral={referral} | Social={social}")
    
    # --- Top pages ---
    body = {
        'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
        'dimensions': [{'name': 'pagePath'}],
        'metrics': [
            {'name': 'screenPageViews'},
            {'name': 'totalUsers'},
            {'name': 'averageSessionDuration'},
        ],
        'orderBys': [{'metric': {'metricName': 'screenPageViews'}, 'desc': True}],
        'limit': 20,
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['top_pages'] = [
            {
                'path': r['dimensionValues'][0]['value'],
                'pageviews': int(r['metricValues'][0]['value']),
                'users': int(r['metricValues'][1]['value']),
                'avg_time_sec': round(float(r['metricValues'][2]['value']), 1),
            }
            for r in data['rows'][:20]
        ]
    
    # --- Device breakdown ---
    body = {
        'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
        'dimensions': [{'name': 'deviceCategory'}],
        'metrics': [{'name': 'sessions'}],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['devices'] = {
            r['dimensionValues'][0]['value']: int(r['metricValues'][0]['value'])
            for r in data['rows']
        }
        total = sum(result['devices'].values())
        device_pct = {k: round(v/total*100, 1) for k, v in result['devices'].items()}
        print(f"  Devices: {device_pct}")
    
    # --- Daily trend ---
    body = {
        'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
        'dimensions': [{'name': 'date'}],
        'metrics': [
            {'name': 'totalUsers'},
            {'name': 'sessions'},
            {'name': 'screenPageViews'},
        ],
        'orderBys': [{'dimension': {'dimensionName': 'date'}}],
    }
    data = api_post(url, body)
    if data and 'rows' in data:
        result['daily_trend'] = [
            {
                'date': r['dimensionValues'][0]['value'],
                'users': int(r['metricValues'][0]['value']),
                'sessions': int(r['metricValues'][1]['value']),
                'pageviews': int(r['metricValues'][2]['value']),
            }
            for r in data['rows']
        ]
    
    return result


# ═══════════════════════════════════════════════
# GOOGLE TRENDS
# ═══════════════════════════════════════════════

def fetch_google_trends():
    """Fetch trending keywords across ALL calculator/finance/tool categories.
    Uses Google Suggestions API, related topics, multiple timeframes, and broad
    keyword discovery. 6-hour caching to avoid 429 rate limits."""
    print("\n🔍 Fetching Google Trends data (enhanced discovery)...")
    
    CACHE_PATH = ROOT / '.optimizer-data' / 'trends-cache.json'
    CACHE_HOURS = 6
    
    # Return cached data if fresh enough
    if CACHE_PATH.exists():
        try:
            with open(CACHE_PATH) as f:
                cache = json.load(f)
            cache_age = time.time() - cache.get('cached_at', 0)
            if cache_age < CACHE_HOURS * 3600:
                print(f"  ✅ Using cached Trends data ({cache_age/3600:.1f}h old)")
                return cache.get('data')
        except:
            pass
    
    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("  ⚠️ pytrends not installed")
        return None
    
    result = {
        'trending_searches': [],
        'suggestions': {},           # Google autocomplete suggestions
        'keyword_interest': {},
        'keyword_interest_7d': {},   # Short-term spikes
        'keyword_interest_12m': {},  # Long-term trends
        'rising_related': [],
        'top_related': [],
        'rising_broad': {},
        'related_topics': {},
        'opportunities': [],
    }
    
    pytrends = TrendReq(hl='en-US', tz=180, timeout=(10, 25))
    
    # ═══════════════════════════════════════════
    # 1. GOOGLE SUGGESTIONS API — Autocomplete discovery
    # ═══════════════════════════════════════════
    print("  📝 Fetching Google Suggestions (autocomplete)...")
    suggestion_seeds = [
        'mortgage calculator',
        'loan calculator',
        'tax calculator',
        'retirement calculator',
        'investment calculator',
        'savings calculator',
        'budget calculator',
        'debt calculator',
        'credit calculator',
        'calculator for',
        'how to calculate',
        'free calculator',
        'online calculator',
        'financial calculator',
        'payment calculator',
    ]
    
    all_suggestions = {}
    for seed in suggestion_seeds[:10]:  # Limit to avoid rate limiting
        try:
            suggs = pytrends.suggestions(seed)
            if suggs:
                all_suggestions[seed] = [
                    {'title': s.get('title', s.get('value', '')), 
                     'type': s.get('type', ''), 
                     'mid': s.get('mid', '')}
                    for s in suggs[:10]
                ]
            time.sleep(0.3)
        except Exception as e:
            print(f"    ⚠️ Suggestions for '{seed}': {e}")
    
    result['suggestions'] = all_suggestions
    suggestion_count = sum(len(v) for v in all_suggestions.values())
    print(f"    → {suggestion_count} suggestions from {len(all_suggestions)} seeds")
    
    # ═══════════════════════════════════════════
    # 2. BROAD KEYWORD CATEGORIES — All calculator types
    # ═══════════════════════════════════════════
    all_keywords = [
        # Calculator types (core)
        'mortgage calculator', 'loan calculator', 'tax calculator',
        'retirement calculator', 'investment calculator', 'savings calculator',
        'budget calculator', 'debt calculator', 'credit score',
        'compound interest calculator', 'payoff calculator', 'amortization calculator',
        # Calculator types (extended)
        'auto loan calculator', 'student loan calculator', 'personal loan calculator',
        'refinance calculator', '401k calculator', 'IRA calculator',
        'ROI calculator', 'inflation calculator', 'net worth calculator',
        'credit card calculator', 'CD calculator', 'annuity calculator',
        'dividend calculator', 'capital gains calculator', 'salary calculator',
        # Generic calculator searches
        'online calculator', 'free calculator', 'calculator tool',
        'financial calculator', 'payment calculator', 'monthly payment calculator',
        # Problem-based queries
        'how to calculate mortgage', 'calculate monthly payment',
        'how much house can I afford', 'calculate interest',
        'retirement planning', 'how to save money',
        'debt payoff plan', 'budget planning',
        # Tool categories
        'budget planner', 'retirement planner', 'savings goal calculator',
        'emergency fund calculator', 'debt snowball calculator',
        'mortgage affordability calculator', 'rent vs buy calculator',
        # Broader finance
        'personal finance', 'investing', 'real estate',
        'stock market', 'cryptocurrency', 'tax planning',
        'credit cards', 'home buying', 'refinancing',
    ]
    
    # --- Interest over time (90-day) ---
    print("  📊 Fetching interest over time (90-day)...")
    interest_90d = {}
    for i in range(0, len(all_keywords), 5):
        chunk = all_keywords[i:i+5]
        try:
            pytrends.build_payload(chunk, cat=0, timeframe='today 3-m', geo='US')
            interest = pytrends.interest_over_time()
            if not interest.empty:
                for kw in chunk:
                    if kw in interest.columns:
                        avg = interest[kw].mean()
                        if avg > 0:
                            interest_90d[kw] = round(avg, 1)
            time.sleep(0.3)
        except Exception as e:
            if '429' in str(e):
                print(f"    ⚠️ Rate limited at chunk {i//5+1} — pausing 10s")
                time.sleep(10)
            else:
                print(f"    ⚠️ Chunk {i//5+1}: {str(e)[:80]}")
    
    result['keyword_interest'] = dict(
        sorted(interest_90d.items(), key=lambda x: x[1], reverse=True)
    )
    print(f"    → {len(result['keyword_interest'])} keywords with data")
    
    # --- Short-term spikes (7-day) for top keywords ---
    print("  ⚡ Fetching 7-day spikes...")
    top_20 = list(result['keyword_interest'].keys())[:20]
    interest_7d = {}
    for i in range(0, len(top_20), 5):
        chunk = top_20[i:i+5]
        try:
            pytrends.build_payload(chunk, cat=0, timeframe='now 7-d', geo='US')
            interest = pytrends.interest_over_time()
            if not interest.empty:
                for kw in chunk:
                    if kw in interest.columns:
                        vals = interest[kw].values
                        recent_avg = vals[-3:].mean() if len(vals) >= 3 else vals.mean()
                        older_avg = vals[:3].mean() if len(vals) >= 6 else vals.mean()
                        if older_avg > 0:
                            spike = round((recent_avg / older_avg - 1) * 100, 1)
                            if spike > 10:  # Only meaningful spikes
                                interest_7d[kw] = {
                                    'avg': round(recent_avg, 1),
                                    'spike_pct': spike
                                }
            time.sleep(0.3)
        except:
            pass
    
    result['keyword_interest_7d'] = dict(
        sorted(interest_7d.items(), key=lambda x: x[1]['spike_pct'], reverse=True)
    )
    print(f"    → {len(result['keyword_interest_7d'])} with spikes >10%")
    
    # --- Long-term trend (12-month) for top keywords ---
    print("  📅 Fetching 12-month trends...")
    top_10 = list(result['keyword_interest'].keys())[:10]
    interest_12m = {}
    for i in range(0, len(top_10), 5):
        chunk = top_10[i:i+5]
        try:
            pytrends.build_payload(chunk, cat=0, timeframe='today 12-m', geo='US')
            interest = pytrends.interest_over_time()
            if not interest.empty:
                for kw in chunk:
                    if kw in interest.columns:
                        vals = interest[kw].values
                        first_half = vals[:len(vals)//2].mean()
                        second_half = vals[len(vals)//2:].mean()
                        if first_half > 0:
                            trend = round((second_half / first_half - 1) * 100, 1)
                            interest_12m[kw] = {
                                'avg': round(vals.mean(), 1),
                                'trend_pct': trend,
                                'direction': 'up' if trend > 5 else 'down' if trend < -5 else 'flat'
                            }
            time.sleep(0.3)
        except:
            pass
    
    result['keyword_interest_12m'] = interest_12m
    longterm_up = sum(1 for v in interest_12m.values() if v['direction'] == 'up')
    print(f"    → {len(interest_12m)} keywords, {longterm_up} trending up long-term")
    
    # ═══════════════════════════════════════════
    # 3. RELATED QUERIES — For top keywords
    # ═══════════════════════════════════════════
    print("  🔗 Fetching related queries...")
    top_seeds = ['mortgage calculator', 'loan calculator', 'tax calculator', 
                 'retirement calculator', 'investment calculator', 'savings calculator',
                 'budget calculator', 'debt calculator']
    
    all_rising = []
    all_top = []
    
    for seed in top_seeds[:6]:
        try:
            pytrends.build_payload([seed], cat=0, timeframe='today 3-m', geo='US')
            related = pytrends.related_queries()
            if related and seed in related:
                rising = related[seed].get('rising', None)
                top = related[seed].get('top', None)
                if rising is not None and not rising.empty:
                    for _, r in rising.head(8).iterrows():
                        all_rising.append({
                            'seed': seed,
                            'query': r['query'],
                            'value': int(r['value'])
                        })
                if top is not None and not top.empty:
                    for _, r in top.head(8).iterrows():
                        all_top.append({
                            'seed': seed,
                            'query': r['query'],
                            'value': int(r['value'])
                        })
            time.sleep(0.5)
        except Exception as e:
            print(f"    ⚠️ Related for '{seed}': {str(e)[:60]}")
    
    # Deduplicate and sort
    seen = set()
    result['rising_related'] = []
    for r in sorted(all_rising, key=lambda x: x['value'], reverse=True):
        if r['query'].lower() not in seen:
            seen.add(r['query'].lower())
            result['rising_related'].append(r)
    
    seen = set()
    result['top_related'] = []
    for r in sorted(all_top, key=lambda x: x['value'], reverse=True):
        if r['query'].lower() not in seen:
            seen.add(r['query'].lower())
            result['top_related'].append(r)
    
    print(f"    → {len(result['rising_related'])} rising, {len(result['top_related'])} top queries")
    
    # ═══════════════════════════════════════════
    # 4. RELATED TOPICS — Broader theme discovery
    # ═══════════════════════════════════════════
    print("  🏷️ Fetching related topics...")
    topic_seeds = ['mortgage calculator', 'loan calculator', 'personal finance', 
                   'investing', 'real estate', 'tax calculator']
    
    for seed in topic_seeds[:4]:
        try:
            pytrends.build_payload([seed], cat=0, timeframe='today 3-m', geo='US')
            topics = pytrends.related_topics()
            if topics and seed in topics:
                rising = topics[seed].get('rising', None)
                top = topics[seed].get('top', None)
                result['related_topics'][seed] = {}
                if rising is not None and not rising.empty:
                    result['related_topics'][seed]['rising'] = [
                        {'title': r['topic_title'], 'type': r['topic_type'], 
                         'value': int(r['value'])}
                        for _, r in rising.head(6).iterrows()
                    ]
                if top is not None and not top.empty:
                    result['related_topics'][seed]['top'] = [
                        {'title': r['topic_title'], 'type': r['topic_type'], 
                         'value': int(r['value'])}
                        for _, r in top.head(6).iterrows()
                    ]
            time.sleep(0.5)
        except Exception as e:
            print(f"    ⚠️ Topics for '{seed}': {str(e)[:60]}")
    
    topic_count = sum(
        len(v.get('rising', [])) + len(v.get('top', [])) 
        for v in result['related_topics'].values()
    )
    print(f"    → {topic_count} related topics across {len(result['related_topics'])} seeds")
    
    # ═══════════════════════════════════════════
    # 5. BROAD NICHE RISING QUERIES
    # ═══════════════════════════════════════════
    broad_terms = ['personal finance', 'investing', 'real estate', 'cryptocurrency', 
                   'stock market', 'retirement planning', 'credit cards', 'tax planning',
                   'home buying', 'saving money']
    result['rising_broad'] = {}
    
    for term in broad_terms[:5]:
        try:
            pytrends.build_payload([term], cat=0, timeframe='today 3-m', geo='US')
            related = pytrends.related_queries()
            if related and term in related:
                rising = related[term].get('rising', None)
                if rising is not None and not rising.empty:
                    result['rising_broad'][term] = [
                        {'query': r['query'], 'value': int(r['value'])}
                        for _, r in rising.head(8).iterrows()
                    ]
            time.sleep(0.5)
        except Exception as e:
            pass
    
    # ═══════════════════════════════════════════
    # 6. GENERATE ACTIONABLE OPPORTUNITIES
    # ═══════════════════════════════════════════
    print("  💡 Generating opportunities...")
    result['opportunities'] = []
    
    # A) Short-term spikes (7-day) — urgent opportunities
    for kw, data in list(result['keyword_interest_7d'].items())[:5]:
        if data['spike_pct'] > 20:
            result['opportunities'].append({
                'type': 'short_term_spike',
                'priority': 'urgent',
                'keyword': kw,
                'spike_pct': data['spike_pct'],
                'action': f'🚨 {data["spike_pct"]}% spike on "{kw}" — create content TODAY',
            })
    
    # B) Rising related queries — trending searches
    for rq in result['rising_related'][:8]:
        if rq['value'] >= 50:
            result['opportunities'].append({
                'type': 'rising_related',
                'priority': 'high',
                'seed': rq['seed'],
                'query': rq['query'],
                'growth': rq['value'],
                'action': f'Target rising query: "{rq["query"]}" (related to {rq["seed"]}, +{rq["value"]}%)',
            })
    
    # C) High-interest keywords (90-day avg) — consistent demand
    for kw, score in list(result['keyword_interest'].items())[:10]:
        # Check if we have this keyword's 12-month trend
        trend_info = result['keyword_interest_12m'].get(kw, {})
        direction = trend_info.get('direction', 'unknown')
        trend_pct = trend_info.get('trend_pct', 0)
        
        priority = 'high' if score > 70 else 'medium'
        if direction == 'up' and trend_pct > 10:
            priority = 'high'  # Rising long-term + high demand = top priority
        
        result['opportunities'].append({
            'type': 'high_demand',
            'priority': priority,
            'keyword': kw,
            'interest_score': score,
            'long_term_trend': direction,
            'trend_pct': trend_pct,
            'action': f'Target "{kw}" (score: {score}, {direction} {trend_pct}% over 12m)',
        })
    
    # D) New keywords from Suggestions — undiscovered gems
    for seed, suggs in list(result['suggestions'].items())[:5]:
        for s in suggs[:3]:
            title = s['title'].lower()
            # Filter out ones we already track
            if title not in result['keyword_interest'] and 'calculator' in title:
                result['opportunities'].append({
                    'type': 'suggestion_discovery',
                    'priority': 'medium',
                    'keyword': title,
                    'from_seed': seed,
                    'action': f'New keyword via autocomplete: "{title}" — consider content',
                })
    
    # E) Related topics — broader themes
    for seed, topics in result['related_topics'].items():
        for t in topics.get('rising', [])[:3]:
            if t['value'] >= 50:
                result['opportunities'].append({
                    'type': 'rising_topic',
                    'priority': 'medium',
                    'topic': t['title'],
                    'topic_type': t['type'],
                    'growth': t['value'],
                    'action': f'Related topic rising: "{t["title"]}" ({t["type"]}, +{t["value"]}%)',
                })
    
    # Deduplicate opportunities by keyword
    seen_opps = set()
    unique_opps = []
    for opp in result['opportunities']:
        key = opp.get('keyword') or opp.get('query') or opp.get('topic', '')
        if key and key not in seen_opps:
            seen_opps.add(key)
            unique_opps.append(opp)
    result['opportunities'] = unique_opps
    
    # Sort: urgent → high → medium
    priority_order = {'urgent': 0, 'high': 1, 'medium': 2}
    result['opportunities'].sort(
        key=lambda x: priority_order.get(x.get('priority', 'medium'), 3)
    )
    
    print(f"    → {len(result['opportunities'])} unique opportunities ({sum(1 for o in result['opportunities'] if o['priority']=='urgent')} urgent)")
    
    # ═══════════════════════════════════════════
    # SAVE CACHE
    # ═══════════════════════════════════════════
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_PATH, 'w') as f:
            json.dump({'cached_at': time.time(), 'data': result}, f, indent=2)
        print(f"  💾 Trends cached for {CACHE_HOURS}h")
    except Exception as e:
        print(f"  ⚠️ Cache save failed: {e}")
    
    return result


# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════

def main():
    import argparse
    parser = argparse.ArgumentParser(description='QFINHUB Analytics Connector')
    parser.add_argument('--gsc-only', action='store_true', help='GSC data only')
    parser.add_argument('--ga-only', action='store_true', help='GA4 data only')
    parser.add_argument('--trends-only', action='store_true', help='Trends only')
    parser.add_argument('--days', type=int, default=7, help='Lookback period (default: 7)')
    args = parser.parse_args()
    
    print("═" * 50)
    print("  QFINHUB Analytics Connector")
    print(f"  {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print("═" * 50)
    
    report = {
        'generated_at': datetime.utcnow().isoformat(),
        'period_days': args.days,
    }
    
    # 1. GSC Data
    if not args.ga_only and not args.trends_only:
        report['search_console'] = fetch_gsc_data(days=args.days)
    
    # 2. GA4 Data
    if not args.gsc_only and not args.trends_only:
        property_id = discover_ga4_property()
        report['analytics'] = fetch_ga4_data(property_id, days=args.days) if property_id else {'error': 'No GA4 property found'}
    else:
        report['analytics'] = None
    
    # 3. Google Trends
    if not args.gsc_only and not args.ga_only:
        report['google_trends'] = fetch_google_trends()
    else:
        report['google_trends'] = None
    
    # Save report
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n✅ Report saved to {REPORT_PATH}")
    
    # Print summary
    print("\n" + "═" * 50)
    print("  📋 SUMMARY")
    print("═" * 50)
    
    gsc = report.get('search_console', {}).get('summary', {})
    if gsc:
        print(f"  🔍 GSC: {gsc.get('clicks', 0)} clicks | {gsc.get('impressions', 0)} impressions | CTR {gsc.get('ctr', 0)}%")
    
    ga = report.get('analytics', {})
    if ga and ga.get('summary'):
        s = ga['summary']
        print(f"  📈 GA4: {s.get('users', 0)} users | {s.get('sessions', 0)} sessions | {s.get('pageviews', 0)} pageviews")
    
    trends = report.get('google_trends', {})
    if trends and trends.get('opportunities'):
        print(f"  🔥 Trends: {len(trends['opportunities'])} content opportunities identified")
        for opp in trends['opportunities'][:3]:
            print(f"      → {opp['action']}")
    
    return report

if __name__ == '__main__':
    main()
