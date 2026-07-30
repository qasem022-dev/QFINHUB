#!/bin/bash
# QFINHUB AdSense Pre-Audit (10 mandatory checks)
# Usage: bash pre-audit.sh
# Exits 0 = READY TO SUBMIT, non-zero = fixes required

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
FAIL=0

echo "=== QFINHUB ADSENSE PRE-AUDIT ==="
echo "Date: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo ""

# 1. ads.txt
echo "[1] ads.txt publisher ID integrity"
ADSTXT=$(curl -s https://www.qfinhub.com/ads.txt)
EXPECTED='google.com, pub-1102790706635466, DIRECT, f08c47fec0942fa0'
if [ "$ADSTXT" = "$EXPECTED" ]; then
  echo -e "  ${GREEN}PASS${NC}: $ADSTXT"
else
  echo -e "  ${RED}FAIL${NC}: got '$ADSTXT'"
  FAIL=1
fi
echo ""

# 2. Required legal pages — 200 status
echo "[2] Required legal pages — HTTP 200"
LEGAL_PAGES="privacy terms cookies contact about methodology editorial-policy disclaimer"
LEGAL_OK=0
for p in $LEGAL_PAGES; do
  code=$(curl -sI --max-time 8 "https://www.qfinhub.com/$p" 2>/dev/null | head -1 | awk '{print $2}')
  if [ "$code" = "200" ]; then
    LEGAL_OK=$((LEGAL_OK+1))
  else
    echo -e "  ${RED}FAIL${NC}: /$p returned $code"
    FAIL=1
  fi
done
echo "  $LEGAL_OK/8 legal pages return 200"
echo ""

# 3. Required legal pages — no accidental noindex
echo "[3] Required legal pages — no noindex"
NOINDEX_OK=0
for p in $LEGAL_PAGES; do
  cnt=$(curl -s "https://www.qfinhub.com/$p" | grep -ci 'noindex' || true)
  if [ "$cnt" = "0" ]; then
    NOINDEX_OK=$((NOINDEX_OK+1))
  else
    echo -e "  ${RED}FAIL${NC}: /$p has $cnt noindex tag(s) — REMOVE IMMEDIATELY"
    FAIL=1
  fi
done
echo "  $NOINDEX_OK/8 legal pages are indexable"
echo ""

# 4. Required legal pages — canonical tag present
echo "[4] Required legal pages — canonical tag present"
CANON_OK=0
for p in $LEGAL_PAGES; do
  cnt=$(curl -s "https://www.qfinhub.com/$p" | grep -c 'rel="canonical"' || true)
  if [ "$cnt" -ge "1" ]; then
    CANON_OK=$((CANON_OK+1))
  else
    echo -e "  ${YELLOW}FAIL${NC}: /$p has no canonical tag"
    FAIL=1
  fi
done
echo "  $CANON_OK/8 legal pages have canonical"
echo ""

# 5. AdSense meta global
echo "[5] AdSense meta tag global (ca-pub-1102790706635466)"
ADS_META=$(curl -s https://www.qfinhub.com/ | grep -c 'ca-pub-1102790706635466' || true)
if [ "$ADS_META" -ge "1" ]; then
  echo -e "  ${GREEN}PASS${NC}: meta tag present"
else
  echo -e "  ${RED}FAIL${NC}: missing ca-pub-1102790706635466 meta tag"
  FAIL=1
fi
echo ""

# 6. Word counts
echo "[6] Word count floors (policy:1000, contact/cookies:500, disclaimer:500, index:400, calc:600)"
python3 -c "
import re, urllib.request
PAGES = [
    ('/about', 1000), ('/methodology', 1000), ('/editorial-policy', 1000),
    ('/privacy', 1000), ('/terms', 1000), ('/contact', 500),
    ('/cookies', 500), ('/disclaimer', 500),
    ('/calculators', 400), ('/blog', 400), ('/guides', 400),
    ('/decision', 400), ('/tools', 400),
]
fails = []
for p, threshold in PAGES:
    try:
        html = urllib.request.urlopen(f'https://www.qfinhub.com{p}', timeout=15).read().decode('utf-8', errors='ignore')
        text = re.sub(r'<[^>]+>', ' ', re.sub(r'<script[^>]*>.*?</script>|<style[^>]*>.*?</style>', '', html, flags=re.DOTALL))
        wc = len(re.sub(r'\s+', ' ', text).split())
        ok = wc >= threshold
        marker = 'OK' if ok else 'BELOW'
        print(f'  [{marker}] {wc:>5}w (>= {threshold})  {p}')
        if not ok: fails.append(p)
    except Exception as e:
        print(f'  [ERR] {p}: {e}')
        fails.append(p)
if fails:
    print(f'  {len(fails)} page(s) below floor: {fails}')
    import sys; sys.exit(1)
"

# 7. robots.txt
echo ""
echo "[7] robots.txt — sitemap declared, no blocking"
ROBOTS=$(curl -s https://www.qfinhub.com/robots.txt)
echo "$ROBOTS" | grep -q "Sitemap: https://www.qfinhub.com/sitemap.xml" && echo -e "  ${GREEN}PASS${NC}: sitemap declared" || { echo -e "  ${RED}FAIL${NC}: sitemap not declared"; FAIL=1; }
echo "$ROBOTS" | grep -q "^Disallow: /$" && { echo -e "  ${RED}FAIL${NC}: blocking entire site"; FAIL=1; } || echo -e "  ${GREEN}PASS${NC}: site is crawlable"
echo ""

# 8. noindex audit (informational)
echo "[8] noindex audit — every index: false is intentional"
NOINDEX_LOC=$(grep -rn 'index: false\|noindex' src/ --include='*.tsx' --include='*.ts' 2>/dev/null | grep -v node_modules | wc -l)
echo "  $NOINDEX_LOC occurrences in src/"
echo "  Expected (legitimate): embed/*, all-pages, scenario/*, geo variants, tools formula variants, NOINDEX_DUPLICATE_SLUGS"
echo ""

# 9. Sitemap-vs-noindex conflicts
echo "[9] Sitemap-vs-noindex conflicts"
curl -s https://www.qfinhub.com/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed 's|<loc>||;s|</loc>||' > /tmp/sitemap-urls.txt
SITEMAP_COUNT=$(wc -l < /tmp/sitemap-urls.txt)
echo "  Sitemap has $SITEMAP_COUNT URLs"
# Allow-list: /all-pages is intentionally noindex (sitemap listing) — known duplicate
ALLOWLIST="qfinhub.com/all-pages"
CONFLICTS=0
while read url; do
  if echo "$url" | grep -qE "($ALLOWLIST)"; then continue; fi
  noidx=$(curl -s "$url" | grep -ci 'noindex' || true)
  if [ "$noidx" -gt 0 ]; then
    echo -e "  ${YELLOW}CONFLICT${NC}: $url is noindex but in sitemap"
    CONFLICTS=$((CONFLICTS+1))
  fi
done < /tmp/sitemap-urls.txt
if [ "$CONFLICTS" = "0" ]; then
  echo -e "  ${GREEN}PASS${NC}: no conflicts (allowed: /all-pages)"
fi
echo ""

# 10. AdSense meta on homepage
echo "[10] AdSense meta on homepage"
if [ "$ADS_META" -ge "1" ]; then
  echo -e "  ${GREEN}PASS${NC}: ca-pub-1102790706635466 present"
fi
echo ""

echo "=== SUMMARY ==="
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}READY TO SUBMIT ADSENSE REVIEW${NC}"
  exit 0
else
  echo -e "${RED}FIXES REQUIRED — DO NOT SUBMIT YET${NC}"
  exit 1
fi