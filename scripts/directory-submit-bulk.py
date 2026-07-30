#!/usr/bin/env python3
"""
QFINHUB Bulk Free Directory Submitter — Phase 50
Submits QFINHUB to as many free directories as possible via curl-first,
CloakBrowser fallback for JS-required forms.

Coverage targets:
  - AI tool directories (10+)
  - Web tool / SaaS directories (10+)
  - Finance-specific directories (5+)
  - General web directories (10+)
  - Startup launch directories (5+)
  - Calculator/tool directories (5+)
  - Free blog directories (5+)
  - Niche community directories (5+)
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from pathlib import Path

PROJECT = Path("/home/admin1/qfinhub")
LOG_DIR = PROJECT / ".optimizer-data" / "directory-submissions"
LOG_DIR.mkdir(parents=True, exist_ok=True)

SITE = {
    "name": "QFINHUB",
    "tagline": "126 Free Financial Calculators - No Signup Required",
    "url": "https://www.qfinhub.com",
    "alt_url": "https://qfinhub.com",
    "description": "Free personal finance calculators for mortgages, loans, investments, retirement, taxes, and business finance. Instant results, no signup required, mobile-friendly.",
    "short_desc": "126 free financial calculators - instant results, no signup.",
    "category": "Finance",
    "tags": "finance,calculator,mortgage,investment,retirement,tax,loan,free",
    "email": "q.finhub@gmail.com",
    "twitter": "@qfinhub",
}

DIRECTORIES = [
    # === AI Tool Directories (best fit since calculators are tech tools) ===
    {"id": "toolify", "name": "Toolify.ai", "url": "https://www.toolify.ai/submit", "method": "browser", "dr": 75},
    {"id": "futurepedia", "name": "Futurepedia.io", "url": "https://www.futurepedia.io/submit-tool", "method": "browser", "dr": 72},
    {"id": "theresanaiforthat", "name": "Theresanaiforthat", "url": "https://theresanaiforthat.com/submit", "method": "browser", "dr": 68},
    {"id": "findmyaitool", "name": "FindMyAITool", "url": "https://www.findmyaitool.com/submit", "method": "browser", "dr": 45},
    {"id": "toolbankai", "name": "ToolBankAI", "url": "https://www.toolbankai.com/submit", "method": "browser", "dr": 40},
    {"id": "aitoolstome", "name": "AIToolsToMe", "url": "https://aitoolstome.com/submit", "method": "browser", "dr": 42},
    {"id": "topaitools", "name": "TopAI.tools", "url": "https://topai.tools/submit", "method": "browser", "dr": 65},
    {"id": "opentools", "name": "OpenTools.ai", "url": "https://opentools.ai/", "method": "browser", "dr": 50},
    {"id": "aivalley", "name": "AIV alley", "url": "https://aivalley.ai/submit-a-tool/", "method": "browser", "dr": 55, "status_check": "https://aivalley.ai/?s=qfinhub"},
    {"id": "producthunt", "name": "Product Hunt", "url": "https://www.producthunt.com/posts/new", "method": "browser", "dr": 91, "note": "login required"},

    # === Web/SaaS Tool Directories ===
    {"id": "saashub", "name": "SaaSHub", "url": "https://www.saashub.com/submit", "method": "browser", "dr": 70},
    {"id": "capterra", "name": "Capterra", "url": "https://www.capterra.com/submit-software/", "method": "browser", "dr": 92, "note": "manual review"},
    {"id": "g2", "name": "G2", "url": "https://www.g2.com/products/new", "method": "browser", "dr": 93, "note": "manual review"},
    {"id": "getapp", "name": "GetApp", "url": "https://www.getapp.com/submit", "method": "browser", "dr": 80},
    {"id": "sourceforge", "name": "SourceForge", "url": "https://sourceforge.net/software/submit/", "method": "browser", "dr": 92},
    {"id": "alternative_to", "name": "AlternativeTo", "url": "https://alternativeto.net/add", "method": "browser", "dr": 90},
    {"id": "slant_co", "name": "Slant.co", "url": "https://www.slant.co/items/new", "method": "browser", "dr": 80},
    {"id": "producthunt_alts", "name": "BetaList", "url": "https://betalist.com/submit", "method": "browser", "dr": 78},

    # === Finance Calculators Niche ===
    {"id": "investopedia_dir", "name": "Investopedia Submit", "url": "https://www.investopedia.com/submit-link", "method": "browser", "dr": 92, "note": "manual review"},
    {"id": "nerdwallet_dir", "name": "NerdWallet Submit", "url": "https://www.nerdwallet.com/about/contact", "method": "browser", "dr": 89, "note": "manual review"},
    {"id": "bankrate_dir", "name": "Bankrate Submit", "url": "https://www.bankrate.com/contact-us/", "method": "browser", "dr": 86, "note": "manual review"},

    # === Web Directories (older but free) ===
    {"id": "dmoz_alts", "name": "Curlie", "url": "https://curlie.org/add-url", "method": "browser", "dr": 75},
    {"id": "best_of_web", "name": "Best of the Web", "url": "https://botw.org/contact/", "method": "browser", "dr": 70},
    {"id": "jimtools", "name": "JimTools", "url": "https://www.jimtools.com/submit.php", "method": "browser", "dr": 50},

    # === Startup/Launch Directories ===
    {"id": "betalist", "name": "BetaList", "url": "https://betalist.com/submit", "method": "browser", "dr": 78},
    {"id": "startupstash", "name": "Startup Stash", "url": "https://startupstash.com/submit/", "method": "browser", "dr": 55},
    {"id": "launchingnext", "name": "Launching Next", "url": "https://www.launchingnext.com/submit/", "method": "browser", "dr": 50},
    {"id": "f6s", "name": "F6S", "url": "https://www.f6s.com/about/submit", "method": "browser", "dr": 65},
    {"id": "crunchbase_company", "name": "Crunchbase", "url": "https://www.crunchbase.com/add-company-profile", "method": "browser", "dr": 91},

    # === Free Blog/Article Submission (often pass DR) ===
    {"id": "medium_archive", "name": "Medium @q.finhub", "url": "https://medium.com/@q.finhub", "method": "browser", "dr": 95},
    {"id": "hashnode_pub", "name": "Hashnode", "url": "https://hashnode.com/onboard", "method": "browser", "dr": 78},
    {"id": "dev_to", "name": "DEV.to", "url": "https://dev.to/enter", "method": "browser", "dr": 89},
    {"id": "substack_pub", "name": "Substack", "url": "https://substack.com/signup", "method": "browser", "dr": 93},

    # === Calculator/Utility Directories ===
    {"id": "calculatornet", "name": "Calculator.net", "url": "https://www.calculator.net/submit-calculator", "method": "browser", "dr": 85, "note": "manual review"},
    {"id": "calculator_1", "name": "Calculator-1.com", "url": "https://www.calculator-1.com/submit.php", "method": "browser", "dr": 40},

    # === Bookmark/Submission sites (free) ===
    {"id": "reddit_save", "name": "Reddit r/calculators", "url": "https://www.reddit.com/r/calculators/submit", "method": "browser", "dr": 99, "note": "karma minimum"},
    {"id": "mix", "name": "Mix.com", "url": "https://mix.com/add", "method": "browser", "dr": 88},
    {"id": "diigo", "name": "Diigo", "url": "https://www.diigo.com/submit", "method": "browser", "dr": 86},
    {"id": "scoop_it", "name": "Scoop.it", "url": "https://www.scoop.it/submit", "method": "browser", "dr": 90},
    {"id": "pinterest_pin", "name": "Pinterest", "url": "https://www.pinterest.com/pin-builder/", "method": "browser", "dr": 95},
    {"id": "flipboard", "name": "Flipboard", "url": "https://about.flipboard.com/submit", "method": "browser", "dr": 92},
    {"id": "folkd", "name": "Folkd.com", "url": "https://www.folkd.com/page/add.html", "method": "browser", "dr": 60},

    # === Q&A / Forum (signature/profile links) ===
    {"id": "quora_ans", "name": "Quora", "url": "https://www.quora.com/", "method": "browser", "dr": 93},

    # === More Niche ===
    {"id": "tptv_directory", "name": "TPTV Directory", "url": "https://www.theproducttool.com/submit", "method": "browser", "dr": 30},
    {"id": "aichorus", "name": "AI Chorus", "url": "https://aichorus.com/submit/", "method": "browser", "dr": 40},
    {"id": "toolscout", "name": "ToolScout", "url": "https://toolscout.ai/submit", "method": "browser", "dr": 35},
    {"id": "stackshare", "name": "StackShare", "url": "https://stackshare.io/submit-a-tool", "method": "browser", "dr": 70},
    {"id": "toolfinder", "name": "ToolFinder", "url": "https://toolfinder.co/submit", "method": "browser", "dr": 45},
    {"id": "toolshunt", "name": "ToolsHunt", "url": "https://toolshunt.com/submit", "method": "browser", "dr": 38},
    {"id": "aitools_fyi", "name": "AITools.fyi", "url": "https://aitools.fyi/submit", "method": "browser", "dr": 35},
]


def curl_check(url, timeout=8):
    """Quick HTTP check."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return f"ERR: {type(e).__name__}"


def probe_all():
    """Probe all directories via curl to filter out dead ones."""
    print(f"\nProbing {len(DIRECTORIES)} directories via curl…\n")
    results = []
    for d in DIRECTORIES:
        code = curl_check(d["url"])
        d["probe_code"] = code
        d["probe_status"] = "reachable" if code in (200, 301, 302) else ("needs_login" if code in (401, 403) else ("not_found" if code == 404 else ("rate_limited" if code == 429 else f"http_{code}")))
        results.append(d)
        print(f"  [{d['dr']:>3}] {code:>3} {d['probe_status']:<15} {d['name']:<25} {d['url']}")
    return results


def save_log(data, name):
    path = LOG_DIR / f"{name}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    return path


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--probe", action="store_true", help="Just probe directories")
    p.add_argument("--dry-run", action="store_true", help="Show what would be submitted")
    p.add_argument("--platform", help="Submit only this platform id")
    p.add_argument("--min-dr", type=int, default=0, help="Minimum DR to consider")
    args = p.parse_args()

    if args.probe:
        probed = probe_all()
        save_log(probed, "probe")
        reachable = [d for d in probed if d["probe_status"] in ("reachable", "needs_login")]
        print(f"\n✓ {len(reachable)}/{len(probed)} directories reachable")
        return

    print(f"=== QFINHUB Directory Submission Plan ===")
    print(f"Total: {len(DIRECTORIES)} directories")
    print(f"Min DR filter: {args.min_dr}")
    print(f"Site: {SITE['name']} - {SITE['url']}")
    print(f"\nThis is a PROBE-AND-PLAN script. Actual submissions require per-directory")
    print(f"browser flows. Run individual directory scripts or use CloakBrowser harness.")


if __name__ == "__main__":
    main()