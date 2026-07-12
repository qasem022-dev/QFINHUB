#!/usr/bin/env python3
"""Quick test: confirm Service Account now has Owner access to GSC.
Tests BOTH trailing-slash variants to identify the correct siteUrl format.
"""
import json
import time
import urllib.request
import urllib.error
import jwt
import requests

KEY_FILE = "/home/admin1/.hermes/gsc-service-account-key.json"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

with open(KEY_FILE) as f:
    sa_key = json.load(f)

def get_access_token() -> str:
    now = int(time.time())
    payload = {
        "iss": sa_key["client_email"],
        "scope": " ".join(SCOPES),
        "aud": sa_key["token_uri"],
        "iat": now,
        "exp": now + 3600,
    }
    assertion = jwt.encode(payload, sa_key["private_key"], algorithm="RS256")
    r = requests.post(
        sa_key["token_uri"],
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["access_token"]

print("Getting Service Account access token...")
token = get_access_token()
print(f"✓ Got token (length: {len(token)})\n")

# Test 1: List sites (proves basic access)
print("=" * 60)
print("TEST 1: List sites via Search Console API")
print("=" * 60)
r = requests.get(
    "https://www.googleapis.com/webmasters/v3/sites",
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,
)
print(f"Status: {r.status_code}")
print(f"Body: {r.text[:500]}")
print()

# Test 2: URL Inspection with BOTH siteUrl variants
for site_url in ["https://www.qfinhub.com/", "https://www.qfinhub.com"]:
    print("=" * 60)
    print(f"TEST 2: URL Inspection API with siteUrl = '{site_url}'")
    print("=" * 60)
    body = {
        "inspectionUrl": "https://www.qfinhub.com/",
        "siteUrl": site_url,
        "languageCode": "en-US",
    }
    r = requests.post(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=30,
    )
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        result = data.get("inspectionResult", {})
        idx = result.get("indexStatusResult", {})
        print(f"  verdict: {idx.get('verdict')}")
        print(f"  coverage: {idx.get('coverageState')}")
        print(f"  lastCrawl: {idx.get('lastCrawlTime')}")
    else:
        print(f"  Error: {r.text[:300]}")
    print()

# Test 3: Sitemap list (proves owner-level access)
print("=" * 60)
print("TEST 3: List sitemaps (owner-level API)")
print("=" * 60)
r = requests.get(
    "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.qfinhub.com/sitemaps",
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,
)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    smaps = data.get("sitemap", [])
    print(f"Found {len(smaps)} sitemaps:")
    for s in smaps[:5]:
        print(f"  - {s.get('path')} (lastSubmitted: {s.get('lastSubmitted')})")
else:
    print(f"  Error: {r.text[:300]}")