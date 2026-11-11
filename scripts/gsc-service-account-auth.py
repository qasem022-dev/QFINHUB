#!/usr/bin/env python3
"""
GSC Service Account Auth Module
Uses Google service account JSON key — no refresh tokens, no expiry, no OAuth.
Simply generates a JWT and exchanges it for an access token (valid 1 hour).
Auto-refreshes when token expires.

Key file: ~/.hermes/gsc-service-account-key.json
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

# Try google-auth first (cleanest), fallback to stdlib JWT
try:
    from google.oauth2 import service_account
    import google.auth.transport.requests
    HAS_GOOGLE_AUTH = True
except ImportError:
    HAS_GOOGLE_AUTH = False

KEY_PATH = os.path.expanduser("~/.hermes/gsc-service-account-key.json")
OAUTH_TOKEN_PATH = os.path.expanduser("~/.hermes/gsc-oauth-token.json")
SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/indexing",
    "https://www.googleapis.com/auth/analytics.readonly",
]

# Cached credentials (module-level, refreshed as needed)
_cached_token = None
_cached_expiry = 0


def get_access_token():
    """Return a valid access token for GSC API calls. Handles caching and refresh."""
    global _cached_token, _cached_expiry

    # Return cached token if still valid (with 60s buffer)
    if _cached_token and time.time() < (_cached_expiry - 60):
        return _cached_token

    # Route: try service-account key first, fall back to user OAuth on any failure
    if os.path.exists(KEY_PATH):
        try:
            if HAS_GOOGLE_AUTH:
                _cached_token, _cached_expiry = _get_token_google_auth()
            else:
                _cached_token, _cached_expiry = _get_token_stdlib()
            return _cached_token
        except Exception as e:
            print(
                f"WARN: service-account auth failed ({type(e).__name__}: {e}); "
                f"falling back to OAuth",
                file=sys.stderr,
            )

    _cached_token, _cached_expiry = _get_token_oauth()

    return _cached_token


def _get_token_google_auth():
    """Use google-auth library — handles JWT signing, exchange, caching."""
    credentials = service_account.Credentials.from_service_account_file(
        KEY_PATH, scopes=SCOPES
    )
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    # google-auth handles expiry internally; we just extract for our cache
    return credentials.token, credentials.expiry.timestamp() if credentials.expiry else time.time() + 3599


def _get_token_oauth():
    """
    Use the user OAuth token at ~/.hermes/gsc-oauth-token.json.

    Fallback used when no service-account key exists (e.g. Google Cloud org
    policy blocks key creation). Refreshes via the stored refresh_token and
    persists the new access token.
    """
    if not os.path.exists(OAUTH_TOKEN_PATH):
        raise RuntimeError(
            f"No credentials found. Need either a service-account key at {KEY_PATH} "
            f"or an OAuth token at {OAUTH_TOKEN_PATH}. "
            f"Run: python3 scripts/gsc-oauth-setup.py --auth-url"
        )

    with open(OAUTH_TOKEN_PATH) as f:
        data = json.load(f)

    if not data.get("refresh_token"):
        raise RuntimeError(
            f"OAuth token at {OAUTH_TOKEN_PATH} has no refresh_token; re-run "
            f"scripts/gsc-oauth-setup.py --auth-url with access_type=offline."
        )

    body = urllib.parse.urlencode({
        "client_id": data["client_id"],
        "client_secret": data["client_secret"],
        "refresh_token": data["refresh_token"],
        "grant_type": "refresh_token",
    }).encode()

    req = urllib.request.Request(
        data["token_uri"],
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            tok = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(
            f"OAuth refresh failed: HTTP {e.code} — {e.read().decode()[:300]}\n"
            f"Re-run: python3 scripts/gsc-oauth-setup.py --auth-url"
        )

    access_token = tok["access_token"]
    expiry = time.time() + tok.get("expires_in", 3599)

    # persist refreshed access token (best-effort)
    try:
        data["token"] = access_token
        with open(OAUTH_TOKEN_PATH, "w") as f:
            json.dump(data, f, indent=2)
    except OSError:
        pass

    return access_token, expiry


def _get_token_stdlib():
    """
    Pure stdlib JWT-based auth. Builds a JWT, signs with RSA,
    exchanges at Google's token endpoint. No external dependencies.
    """
    import base64
    import hashlib

    with open(KEY_PATH) as f:
        key_data = json.load(f)

    # Build JWT header + claim set
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    claim_set = {
        "iss": key_data["client_email"],
        "scope": " ".join(SCOPES),
        "aud": key_data["token_uri"],
        "exp": now + 3600,
        "iat": now,
    }

    # Encode header + claim
    def b64url_encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header_b64 = b64url_encode(json.dumps(header).encode())
    claim_b64 = b64url_encode(json.dumps(claim_set).encode())
    signing_input = f"{header_b64}.{claim_b64}"

    # Sign with private key
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding

        private_key = serialization.load_pem_private_key(
            key_data["private_key"].encode(), password=None
        )
        signature = private_key.sign(
            signing_input.encode(),
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
    except ImportError:
        raise RuntimeError(
            "Neither google-auth nor cryptography is installed. "
            "Install one: pip install google-auth or pip install cryptography"
        )

    signature_b64 = b64url_encode(signature)
    jwt = f"{signing_input}.{signature_b64}"

    # Exchange JWT for access token
    body = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    }).encode()

    req = urllib.request.Request(key_data["token_uri"], data=body)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        token_data = json.loads(resp.read())
        access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3599)
        expiry = time.time() + expires_in
        return access_token, expiry
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        raise RuntimeError(
            f"Token exchange failed: HTTP {e.code} — {err_body[:300]}\n"
            f"Verify the key file at {KEY_PATH} is valid and not expired."
        )


def test_token():
    """Verify the token works with a lightweight GSC API call."""
    token = get_access_token()
    site_enc = urllib.parse.quote("https://www.qfinhub.com", safe="")

    from datetime import datetime, timedelta
    end = (datetime.utcnow() - timedelta(days=3)).date()
    start = end - timedelta(days=6)

    body = json.dumps({
        "startDate": str(start),
        "endDate": str(end),
        "dimensions": ["page"],
        "rowLimit": 5,
        "searchType": "web",
    }).encode()

    req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_enc}/searchAnalytics/query",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        rows = data.get("rows", [])
        imp = sum(r.get("impressions", 0) for r in rows)
        print(f"✅ Service account token WORKS — {imp} imp, {len(rows)} pages (test query)")
        return True
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"❌ Token test FAILED: HTTP {e.code} — {err[:300]}")
        return False


if __name__ == "__main__":
    try:
        with open(KEY_PATH) as f:
            key_data = json.load(f)
        print(f"GSC Service Account Auth — {key_data['client_email']}")
    except Exception:
        print(f"GSC Service Account Auth (key at {KEY_PATH})")
    print(f"Has google-auth: {HAS_GOOGLE_AUTH}")
    test_token()
