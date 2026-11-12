#!/usr/bin/env python3
"""
Merge, validate and enrich prospect lists into a single outreach-ready CSV.

Pipeline:
  1. merge prospects-brokers.csv + prospects-clean.csv, dedupe on domain
  2. drop role addresses that cannot buy (support@, customercare@, noreply@ ...)
  3. MX-validate every domain (bounces are what damage a young sending domain)
  4. fetch each homepage and detect whether it already has a calculator
     -> the outreach email references the real finding instead of guessing

Output: .optimizer-data/prospects-final.csv

Usage:
    python3 scripts/prepare-outreach.py
    python3 scripts/prepare-outreach.py --no-fetch     # skip calculator detection
"""

import argparse
import csv
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

DATA = Path(".optimizer-data")
SOURCES = [
    DATA / "prospects-brokers.csv",
    DATA / "prospects-expanded.csv",
    DATA / "prospects-clean.csv",
]
OUT = DATA / "prospects-final.csv"
UA = "Mozilla/5.0 (compatible; QFINHUB-research/1.0; +https://www.qfinhub.com)"

# Local parts that indicate a support desk or a robot, not a decision maker.
BAD_LOCAL = {
    "noreply", "no-reply", "donotreply", "do-not-reply", "support", "helpdesk",
    "customercare", "care", "abuse", "postmaster", "webmaster", "hostmaster",
    "bugreport", "privacy", "legal", "billing", "accounting", "careers", "jobs",
    "hr", "unsubscribe", "mailer-daemon",
}

# Domains that are lenders too large to buy, or are not buyers at all.
BAD_DOMAIN = (
    "gatewayloan.com", "cardinalfinancial.com", "crosscountrymortgage.com",
    "fairwaymc.com", "bankofoklahoma.com", "statesman.com", "austinhomemag.com",
    "americascreditunions.org", "mycreditunion.gov", "realty.com", "firstteam.com",
    "keenable.ai", "homeshow.ai", "moatable.com", "rate.com",
    # Analytics/tag-manager vendors that leak into scraped pages as support or
    # sales addresses. They are never the business being prospected.
    "keen.io", "segment.io", "segment.com", "mixpanel.com", "amplitude.com",
    "hotjar.com", "fullstory.com", "intercom.io", "intercom.com", "drift.com",
)

CALC_PATTERNS = (
    r'href="[^"]*calculat', r'href="[^"]*/calc(?:ulator)?s?\b',
    r'>\s*[^<]{0,40}calculator[^<]{0,40}<',
)


def mx_ok(domain: str) -> bool:
    try:
        out = subprocess.run(
            ["dig", "+short", "MX", domain], capture_output=True, text=True, timeout=8
        ).stdout
        return bool(out.strip())
    except Exception:
        return False


def fetch(url: str, timeout: int = 15) -> str:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if "html" not in r.headers.get("Content-Type", "").lower():
                return ""
            return r.read(300_000).decode("utf-8", errors="replace")
    except Exception:
        return ""


def has_calculator(html: str) -> bool:
    low = html.lower()
    return any(re.search(p, low, re.I) for p in CALC_PATTERNS)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true", help="skip calculator detection")
    args = ap.parse_args()

    rows: list[dict] = []
    seen: set[str] = set()
    for src in SOURCES:
        if not src.exists():
            print(f"  (missing {src}, skipping)")
            continue
        for r in csv.DictReader(src.open()):
            dom = r.get("domain", "").strip().lower()
            if not dom or dom in seen:
                continue
            seen.add(dom)
            rows.append(r)
    print(f"merged unique domains: {len(rows)}")

    kept, rejected = [], []
    seen_emails: set[str] = set()
    for r in rows:
        email = r["email"].strip().lower()
        local, _, dom = email.partition("@")
        if local in BAD_LOCAL:
            rejected.append((email, f"role address: {local}@")); continue
        if email in seen_emails:
            rejected.append((email, "duplicate address")); continue
        if any(b in dom for b in BAD_DOMAIN):
            rejected.append((email, "not a buyer / too large")); continue
        if not mx_ok(dom):
            rejected.append((email, "no MX record")); continue
        seen_emails.add(email)
        kept.append(r)

    print(f"\nrejected {len(rejected)}:")
    for e, why in rejected:
        print(f"   {e:44} {why}")

    if not args.no_fetch:
        print(f"\ndetecting calculators on {len(kept)} sites...")
        for i, r in enumerate(kept, 1):
            html = fetch(r["website"] or f"https://{r['domain']}")
            r["has_calculator"] = "yes" if has_calculator(html) else "no"
            flag = "HAS" if r["has_calculator"] == "yes" else "none"
            print(f"   [{i}/{len(kept)}] {r['domain'][:38]:38} {flag}")
            time.sleep(0.3)
    else:
        for r in kept:
            r["has_calculator"] = "unknown"

    fields = ["org", "domain", "email", "has_calculator", "website", "niche"]
    with OUT.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader(); w.writerows(kept)

    with_calc = sum(1 for r in kept if r["has_calculator"] == "yes")
    without = sum(1 for r in kept if r["has_calculator"] == "no")
    print(f"\nfinal: {len(kept)} sendable "
          f"({with_calc} already have a calculator, {without} have none)")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
