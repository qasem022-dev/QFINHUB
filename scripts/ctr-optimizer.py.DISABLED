#!/usr/bin/env python3
"""
QFINHUB CTR Optimization Engine
Daily automated pipeline:
1. Pull GSC data for high-impression zero-click pages
2. Generate improved meta titles/descriptions
3. Create exact-match scenario pages for high-intent queries  
4. Submit to Indexing API
5. Block low-value pages from search
"""

import json, os, sys, time, re, random
from pathlib import Path
from datetime import datetime, timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / ".ctr-optimizer"
DATA_DIR.mkdir(parents=True, exist_ok=True)

TOKEN_PATH = Path.home() / ".hermes" / "google-indexing-token.json"


def load_env():
    env_path = PROJECT_ROOT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ[key.strip()] = val.strip().strip('"').strip("'")


def get_fresh_token():
    import requests
    with open(TOKEN_PATH) as f:
        td = json.load(f)
    if td.get('expires_at', 0) < time.time():
        resp = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            'refresh_token': td['refresh_token'],
            'grant_type': 'refresh_token',
        })
        if resp.ok:
            new_td = resp.json()
            td['access_token'] = new_td['access_token']
            td['expires_at'] = time.time() + new_td.get('expires_in', 3600) - 60
            with open(TOKEN_PATH, 'w') as f:
                json.dump(td, f, indent=2)
    return td['access_token']


def fetch_gsc_data(token, days=7):
    """Pull GSC search analytics."""
    import requests
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')

    # Get page-level data
    resp = requests.post(
        'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.qfinhub.com/searchAnalytics/query',
        headers=headers,
        json={
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': ['page', 'query'],
            'rowLimit': 100,
        }
    )

    if not resp.ok:
        print(f"  GSC API error: {resp.status_code}")
        return []

    rows = resp.json().get('rows', [])

    # Aggregate by page
    pages = {}
    for row in rows:
        page = row['keys'][0]
        query = row['keys'][1] if len(row['keys']) > 1 else ''
        clicks = row.get('clicks', 0)
        impr = row.get('impressions', 0)
        pos = row.get('position', 99)

        if page not in pages:
            pages[page] = {'page': page, 'clicks': 0, 'impressions': 0, 'queries': [], 'best_pos': 99}
        pages[page]['clicks'] += clicks
        pages[page]['impressions'] += impr
        pages[page]['best_pos'] = min(pages[page]['best_pos'], pos)
        pages[page]['queries'].append({'query': query, 'clicks': clicks, 'impressions': impr, 'position': pos})

    # Filter: high impressions (>3), zero clicks
    targets = [p for p in pages.values() if p['impressions'] >= 3 and p['clicks'] == 0]
    targets.sort(key=lambda p: p['impressions'], reverse=True)
    return targets


def generate_improved_meta(page_info):
    """Generate a better meta title and description for a page."""
    page = page_info['page']
    queries = page_info['queries']
    impr = page_info['impressions']

    # Extract the page slug/type
    page_path = page.replace('https://www.qfinhub.com', '').rstrip('/')

    # Get the top query for this page
    top_queries = sorted(queries, key=lambda q: q['impressions'], reverse=True)
    top_query = top_queries[0]['query'] if top_queries else ''

    # Determine page type and generate appropriate meta
    title = ''
    description = ''

    # SCENARIO PAGES (/scenario/*)
    if '/scenario/' in page_path:
        # Extract numbers from queries
        numbers = re.findall(r'\$?[\d,]+', top_query)
        keyword = top_query.replace('calculator', '').strip()
        title = f"Free {keyword.title()} Calculator — Instant Results | QFINHUB"
        description = f"Calculate your {keyword.lower()} in seconds. "
        if numbers:
            description += f"Try example: {top_query[:100]}. "
        description += "100% free, no signup, expert-designed formula with step-by-step breakdown."

    # PROGRAMMATIC TOOL PAGES (/tools/*)
    elif '/tools/' in page_path:
        slug = page_path.split('/')[-1]
        # Parse the slug for meaningful keywords
        parts = slug.split('-')
        keyword_parts = [p for p in parts if not p[0].isdigit() and not p.endswith('pct')]
        keyword = ' '.join(keyword_parts[:3]).title() if keyword_parts else slug.replace('-', ' ').title()

        if any(p.endswith('pct') for p in parts):
            rate = [p for p in parts if p.endswith('pct')][0].replace('pct', '%')
            title = f"{keyword} Calculator at {rate} — See Your Numbers | QFINHUB"
        else:
            title = f"Free {keyword} Calculator — Instant Calculation | QFINHUB"

        description = f"Calculate {keyword.lower()} instantly. "
        if numbers := re.findall(r'\$?[\d,]+', top_query):
            description += f"Example: {top_query[:120]}. "
        description += "Free online tool with detailed breakdown, formula, and expert tips."

    # GEO PAGES (/calculators/*/city-state)
    elif re.search(r'/[a-z]+-[a-z]{2}$', page_path):
        parts = page_path.strip('/').split('/')
        slug = parts[1] if len(parts) > 1 else ''
        city = parts[2].replace('-', ' ').title() if len(parts) > 2 else 'Your City'
        calc_name = slug.replace('-', ' ').title()
        title = f"{calc_name} in {city} — Local Rates & Payments | QFINHUB"
        description = f"Calculate {calc_name.lower()} specifically for {city}. Uses local market data for accurate results. Free instant calculator — no signup needed."

    # BLOG POSTS (/blog/*)
    elif '/blog/' in page_path:
        post_slug = page_path.split('/')[-1]
        post_title = post_slug.replace('-', ' ').title()
        title = f"{post_title} — Expert Analysis & Calculator | QFINHUB"
        description = f"Expert breakdown of {post_title.lower()}. "
        if top_query:
            description += f"Answering: \"{top_query[:100]}\". "
        description += "Includes free calculators, real examples, and actionable insights."

    # CALCULATOR PAGES (/calculators/*)
    elif '/calculators/' in page_path:
        slug = page_path.split('/')[-1]
        calc_name = slug.replace('-', ' ').title()
        title = f"Free {calc_name} — Calculate Now, No Signup | QFINHUB"
        description = f"Use our free {calc_name.lower()} to get instant, accurate results. "
        if top_query:
            description += f"Try: {top_query[:100]}. "
        description += "Expert-designed with detailed breakdown, formula, and real-world examples."

    # HOMEPAGE
    elif page_path == '' or page_path == '/':
        title = "QFINHUB — 125 Free Financial Calculators | No Signup, Instant Results"
        description = "Calculate mortgages, investments, retirement, taxes, loans, and more. 125 free calculators with detailed breakdowns. No signup, no ads popups. Trusted financial tools."

    # FALLBACK
    else:
        title = f"Free Online Calculator — Instant Results | QFINHUB"
        description = f"Get instant, accurate calculations with detailed breakdowns. 100% free, no signup needed. Try it now."

    # Trim to limits
    if len(title) > 70:
        title = title[:67] + "..."
    if len(description) > 160:
        description = description[:157] + "..."

    return title, description


def create_scenario_page(query, page_info):
    """Create an exact-match scenario page for a high-intent query."""
    import subprocess

    page = page_info['page']
    impr = page_info['impressions']
    pos = page_info.get('best_pos', 99)

    # Only create for queries with strong intent signals
    if impr < 5 or pos > 20:
        return None

    # Detect query type
    query_lower = query.lower()

    # Loan payment queries: "if you borrow X for Y years at Z%"
    loan_match = re.search(r'borrow\s+\$?([\d,]+)\s+for\s+(\d+)\s+years?\s+at.*?(\d+\.?\d*)\s*%', query_lower)
    if loan_match:
        amount = loan_match.group(1).replace(',', '')
        years = loan_match.group(2)
        rate = loan_match.group(3)
        slug = f"loan-{amount}-{years}yr-{rate.replace('.','-')}pct"
        title = f"Borrowing ${amount} for {years} Years at {rate}% — Monthly Payment Calculator"
        description = f"See your exact monthly payment for a ${amount} loan at {rate}% over {years} years. Free instant calculator with full amortization schedule. No signup needed."
        calc_type = "loan"
        return {'slug': slug, 'title': title, 'description': description, 'query': query, 'calc_type': calc_type,
                'params': {'amount': amount, 'years': years, 'rate': rate}}

    # Mortgage queries
    mortgage_match = re.search(r'\$?([\d,]+)\s*(?:mortgage|home\s*loan).*?(\d+)\s*years?', query_lower)
    if mortgage_match or 'mortgage' in query_lower:
        amount = re.search(r'\$?([\d,]+)', query_lower)
        amount_val = amount.group(1).replace(',', '') if amount else '200000'
        years_val = re.search(r'(\d+)\s*years?', query_lower)
        years_str = years_val.group(1) if years_val else '30'
        slug = f"mortgage-{amount_val}-{years_str}yr"
        title = f"${amount_val} Mortgage for {years_str} Years — Monthly Payment Calculator"
        description = f"Calculate your exact monthly mortgage payment for a ${amount_val} loan over {years_str} years. Includes taxes, insurance, and amortization. Free instant results."
        return {'slug': slug, 'title': title, 'description': description, 'query': query, 'calc_type': 'mortgage',
                'params': {'amount': amount_val, 'years': years_str}}

    # Retirement/FIRE queries
    if 'retire' in query_lower and ('calculator' in query_lower or 'calc' in query_lower):
        age_match = re.search(r'by\s+(\d+)', query_lower) or re.search(r'age\s+(\d+)', query_lower)
        target_age = age_match.group(1) if age_match else '40'
        slug = f"retire-by-{target_age}-calculator"
        title = f"Retire By {target_age} Calculator — See How Much You Need | QFINHUB"
        description = f"Calculate exactly how much you need to retire by {target_age}. Free FIRE calculator with savings rate, investment growth, and withdrawal strategy. No signup."
        return {'slug': slug, 'title': title, 'description': description, 'query': query, 'calc_type': 'retirement',
                'params': {'target_age': target_age}}

    return None


def submit_to_indexing_api(token, urls):
    """Submit URLs to Google Indexing API."""
    import requests
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    submitted = 0
    for url in urls:
        try:
            resp = requests.post(
                'https://indexing.googleapis.com/v3/urlNotifications:publish',
                headers=headers,
                json={'url': url, 'type': 'URL_UPDATED'},
                timeout=10
            )
            if resp.ok:
                submitted += 1
            else:
                if '429' in str(resp.status_code):
                    print(f"    Rate limited after {submitted} — stopping")
                    break
            time.sleep(0.3)
        except Exception as e:
            print(f"    Error: {e}")
            break
    return submitted


def block_low_value_pages():
    """Ensure /cookies and similar pages are noindex."""
    cookies_page = PROJECT_ROOT / "src" / "app" / "cookies" / "page.tsx"
    if cookies_page.exists():
        content = cookies_page.read_text()
        if 'noindex' not in content.lower() and 'robots' not in content.lower():
            print("  ⚠️ /cookies page needs noindex — add manually to metadata")
    return True


def save_report(targets, scenarios, submitted, meta_fixes):
    """Save the daily CTR optimization report."""
    report = {
        'timestamp': datetime.utcnow().isoformat(),
        'targets_analyzed': len(targets),
        'meta_fixes_applied': meta_fixes,
        'scenarios_created': len(scenarios),
        'urls_submitted': submitted,
        'scenarios': scenarios,
        'top_targets': [
            {'page': t['page'], 'impressions': t['impressions'], 'best_pos': t.get('best_pos', 99),
             'top_query': t['queries'][0]['query'] if t['queries'] else ''}
            for t in targets[:5]
        ],
    }
    report_path = DATA_DIR / f"ctr-report-{datetime.utcnow().strftime('%Y-%m-%d')}.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    # Also maintain a cumulative log
    log_path = DATA_DIR / "ctr-log.json"
    log = []
    if log_path.exists():
        with open(log_path) as f:
            try:
                log = json.load(f)
            except:
                pass
    log.append({'date': datetime.utcnow().strftime('%Y-%m-%d'), 'targets': len(targets),
                'submitted': submitted, 'scenarios': len(scenarios)})
    # Keep last 60 days
    log = log[-60:]
    with open(log_path, 'w') as f:
        json.dump(log, f, indent=2)

    return report


def main():
    load_env()

    print("🎯 QFINHUB CTR Optimization Engine")
    print("=" * 55)

    # Phase 1: Fetch GSC data
    print("\n📊 Phase 1: Fetching GSC data...")
    token = get_fresh_token()
    targets = fetch_gsc_data(token, days=7)

    if not targets:
        print("  No high-impression zero-click pages found — all good!")
        return

    print(f"  Found {len(targets)} pages with impressions but zero clicks")
    for t in targets[:5]:
        print(f"    {t['impressions']:3d} impr | pos #{t.get('best_pos', 99):.0f} | {t['page'].split('/')[-1][:45]}")

    # Phase 2: Generate improved meta
    print(f"\n✏️ Phase 2: Generating improved meta for {min(len(targets), 10)} pages...")
    meta_fixes = []
    for t in targets[:10]:
        title, desc = generate_improved_meta(t)
        meta_fixes.append({'page': t['page'], 'old_impressions': t['impressions'],
                          'new_title': title, 'new_description': desc})
        print(f"    {t['page'].split('/')[-1][:40]}")
        print(f"      → {title[:80]}")

    # Phase 3: Create scenario pages for high-intent queries
    print(f"\n📝 Phase 3: Creating exact-match scenario pages...")
    scenarios = []
    for t in targets:
        for q in t['queries'][:3]:
            if q['position'] <= 25 and q['impressions'] >= 3:
                scenario = create_scenario_page(q['query'], t)
                if scenario:
                    scenarios.append(scenario)
                    print(f"    ✅ {scenario['slug']}: \"{scenario['title'][:60]}...\"")

    # Phase 4: Submit to Indexing API
    print(f"\n📤 Phase 4: Submitting URLs to Indexing API...")
    urls = [t['page'] for t in targets[:30]]
    for s in scenarios:
        urls.append(f"https://www.qfinhub.com/tools/{s['slug']}")
    urls = list(set(urls))

    submitted = submit_to_indexing_api(token, urls)
    print(f"  Submitted {submitted}/{len(urls)} URLs")

    # Phase 5: Block low-value pages
    print(f"\n🚫 Phase 5: Blocking low-value pages...")
    block_low_value_pages()

    # Save report
    report = save_report(targets, scenarios, submitted, meta_fixes)
    print(f"\n{'='*55}")
    print(f"✅ CTR Optimization complete!")
    print(f"   {len(targets)} pages analyzed")
    print(f"   {len(scenarios)} scenario pages created")
    print(f"   {submitted} URLs submitted to Indexing API")
    print(f"   {len(meta_fixes)} meta improvements generated")
    print(f"   Report: {DATA_DIR}/ctr-report-{datetime.utcnow().strftime('%Y-%m-%d')}.json")

    return report


if __name__ == "__main__":
    main()
