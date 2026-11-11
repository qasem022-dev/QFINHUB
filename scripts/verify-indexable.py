#!/usr/bin/env python3
"""Verify HTTP status, robots directives and canonical for a list of URLs (parallel)."""
import json, re, sys
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (compatible; qfinhub-verify/1.0)"


def check(url):
    out = {"url": url, "status": None, "xRobots": "", "meta": [], "canonical": "", "error": ""}
    try:
        req = Request(url, headers={"User-Agent": UA})
        with urlopen(req, timeout=45) as r:
            out["status"] = r.status
            out["xRobots"] = r.headers.get("X-Robots-Tag", "")
            html = r.read().decode("utf-8", errors="replace")
        out["meta"] = re.findall(r"<meta[^>]*(?:noindex|canonical)[^>]*>", html, re.I)[:4]
        c = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', html, re.I)
        if not c:
            c = re.search(r'<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', html, re.I)
        out["canonical"] = c.group(1) if c else ""
        m = re.search(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)', html, re.I)
        out["robotsMeta"] = m.group(1) if m else ""
        t = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
        out["title"] = (t.group(1).strip()[:90] if t else "")
        out["len"] = len(html)
    except Exception as e:
        out["error"] = f"{type(e).__name__}: {e}"
    return out


def main():
    urls = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    with ThreadPoolExecutor(max_workers=6) as ex:
        res = list(ex.map(check, urls))
    json.dump(res, open(sys.argv[2], "w"), indent=2)
    for r in res:
        flag = []
        if r["status"] != 200:
            flag.append(f"HTTP {r['status']}")
        if "noindex" in (r.get("robotsMeta") or "").lower() or "noindex" in r["xRobots"].lower():
            flag.append("NOINDEX")
        if r["canonical"] and r["canonical"].rstrip("/") != r["url"].rstrip("/"):
            flag.append(f"CANON->{r['canonical']}")
        if not r["canonical"]:
            flag.append("NO-CANONICAL")
        print(f"{r['status']} {' '.join(flag) or 'ok'} {r['url']}" + (f" ERR {r['error']}" if r["error"] else ""))


if __name__ == "__main__":
    main()
