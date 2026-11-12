#!/usr/bin/env python3
"""
Sourcing prospects for the calculator-build offer.

Takes search queries (city + niche), visits the resulting business sites, and
extracts a usable contact: a mailto: address or an info@/hello@ address found in
the page text. Writes a CSV you can load into the outreach sender.

Deliberately conservative:
  - only public pages (home, /contact, /about)
  - no forms are submitted
  - one request per page, identifiable User-Agent
  - skips anything that looks like a directory / aggregator / competitor

Usage:
    python3 scripts/find-prospects.py --niche "mortgage broker" --cities Austin,Dallas,Denver
    python3 scripts/find-prospects.py --niche "credit union" --cities "Columbus,Omaha" --out prospects.csv
"""

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (compatible; QFINHUB-research/1.0; +https://www.qfinhub.com)"
OUT_DIR = Path(".optimizer-data")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

# Domains that are never prospects: aggregators, review sites, social, our own.
BLOCK = {
    "yelp.com", "facebook.com", "linkedin.com", "twitter.com", "x.com",
    "instagram.com", "youtube.com", "reddit.com", "zillow.com", "realtor.com",
    "nerdwallet.com", "bankrate.com", "investopedia.com", "wikipedia.org",
    "indeed.com", "glassdoor.com", "bbb.org", "mapquest.com", "yellowpages.com",
    "consumeraffairs.com", "expertise.com", "angi.com", "thumbtack.com",
    "redfin.com", "trulia.com", "homes.com", "movoto.com", "creditkarma.com",
    "lendingtree.com", "quickenloans.com", "rocketmortgage.com", "better.com",
    "qfinhub.com", "google.com", "apple.com", "amazon.com", "microsoft.com",
}

# Junk addresses that appear in page chrome and template footers.
JUNK = {
    "example.com", "domain.com", "email.com", "yourdomain.com", "sentry.io",
    "wixpress.com", "godaddy.com", "squarespace.com", "wordpress.com",
    "cloudflare.com", "googleapis.com", "gstatic.com", "schema.org",
}

PREFERRED = ("info", "hello", "contact", "enquiries", "inquiries", "sales", "office", "admin", "hello")


def fetch(url: str, timeout: int = 20) -> str:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ctype = r.headers.get("Content-Type", "")
            if "html" not in ctype.lower():
                return ""
            return r.read(400_000).decode("utf-8", errors="replace")
    except Exception:
        return ""


def domain_of(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return ""


def is_blocked(domain: str) -> bool:
    return any(domain == b or domain.endswith("." + b) for b in BLOCK)


def extract_emails(html: str) -> list[str]:
    found: list[str] = []
    # mailto links are the highest-signal source
    for m in re.findall(r'href="mailto:([^"?]+)', html, re.I):
        found.append(urllib.parse.unquote(m))
    found.extend(EMAIL_RE.findall(html))
    cleaned = []
    for e in found:
        e = e.strip().strip(".,;:()<>").lower()
        dom = e.split("@")[-1]
        if any(dom == j or dom.endswith("." + j) for j in JUNK):
            continue
        if not re.match(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$", e):
            continue
        if e.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp")):
            continue
        if e not in cleaned:
            cleaned.append(e)
    # prefer role addresses
    cleaned.sort(key=lambda e: (not e.startswith(PREFERRED), len(e)))
    return cleaned


def org_name(html: str, fallback: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
    if m:
        t = re.sub(r"\s+", " ", m.group(1)).strip()
        t = re.split(r"\s[|\-–—]\s", t)[0].strip()
        if 2 < len(t) < 70:
            return t
    return fallback


def probe(url: str) -> dict | None:
    dom = domain_of(url)
    if not dom or is_blocked(dom):
        return None
    home = fetch(url)
    if not home:
        return None
    emails = extract_emails(home)
    if not emails:
        for path in ("/contact", "/contact-us", "/about", "/about-us"):
            page = fetch(url.rstrip("/") + path)
            if page:
                emails = extract_emails(page)
                if emails:
                    break
    if not emails:
        return None
    return {
        "org": org_name(home, dom),
        "domain": dom,
        "email": emails[0],
        "all_emails": ";".join(emails[:4]),
        "website": f"https://{dom}",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--niche", required=True)
    ap.add_argument("--cities", required=True, help="comma separated")
    ap.add_argument("--out", default="")
    ap.add_argument("--per-city", type=int, default=8)
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = Path(args.out) if args.out else OUT_DIR / f"prospects-{args.niche.replace(' ', '-')}.csv"
    cities = [c.strip() for c in args.cities.split(",") if c.strip()]

    seen_domains: set[str] = set()
    rows: list[dict] = []

    if out.exists():
        with out.open() as f:
            for r in csv.DictReader(f):
                seen_domains.add(r["domain"])
                rows.append(r)
        print(f"resuming with {len(rows)} existing rows")

    # Candidate discovery is done by the caller (web_search) and handed over as a
    # URL list file, so this script stays offline-deterministic.
    seed = Path("/tmp/prospect_urls.txt")
    if not seed.exists():
        print(f"No seed URLs at {seed}. Populate it with one URL per line first.", file=sys.stderr)
        return 2

    urls = [u.strip() for u in seed.read_text().splitlines() if u.strip().startswith("http")]
    print(f"probing {len(urls)} candidate URLs across niches/cities: {args.niche} / {len(cities)} cities")

    for i, u in enumerate(urls, 1):
        dom = domain_of(u)
        if dom in seen_domains:
            continue
        rec = probe(u)
        if rec:
            rec["niche"] = args.niche
            rec["city"] = ""
            rows.append(rec)
            seen_domains.add(dom)
            print(f"  [{i}/{len(urls)}] {rec['org'][:40]:40} {rec['email']}")
        time.sleep(0.4)

    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["org", "domain", "email", "all_emails", "website", "niche", "city"])
        w.writeheader()
        w.writerows(rows)

    print(f"\nwrote {len(rows)} prospects -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
