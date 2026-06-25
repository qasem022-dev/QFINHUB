#!/usr/bin/env python3
"""
GSC Token Refresh — Service Account Edition
No more OAuth refresh tokens. Uses service account key for permanent auth.
This script now just tests/prints the current access token status.
"""
import json, os

KEY_PATH = os.path.expanduser("~/.hermes/gsc-service-account-key.json")

if os.path.exists(KEY_PATH):
    import sys, importlib.util, os
    _spec = importlib.util.spec_from_file_location(
        "gsc_sa_auth",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "gsc-service-account-auth.py")
    )
    _sa_auth = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_sa_auth)
    get_access_token, test_token = _sa_auth.get_access_token, _sa_auth.test_token

    try:
        token = get_access_token()
        print(f"✅ Service Account Token Ready")
        print(f"   Token: {token[:20]}...")
        print(f"   Source: {KEY_PATH}")
        print(f"   Auth method: Service Account (permanent — no refresh_token expiry)")
        
        # Run full test
        test_token()
        print("\n🔑 Service account auth = permanent. No more 7-day token death.")
    except Exception as e:
        print(f"❌ Service account auth failed: {e}")
        print(f"   Check: {KEY_PATH} exists and is valid")
        print(f"   Verify: Service account added to GSC property as Full owner")
else:
    print("❌ No service account key found.")
    print(f"   Expected: {KEY_PATH}")
    print("   To fix: Create service account in GCP, download JSON key, add to GSC property.")
