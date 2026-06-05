#!/usr/bin/env python3
"""Refresh Google OAuth token"""
import json, urllib.request, urllib.parse, os

token_path = os.path.expanduser("~/.hermes/google-indexing-token.json")
with open(token_path) as f:
    tok = json.load(f)

body = urllib.parse.urlencode({
    "client_id": tok["client_id"],
    "client_secret": tok["client_secret"],
    "refresh_token": tok["refresh_token"],
    "grant_type": "refresh_token"
}).encode()

req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
resp = urllib.request.urlopen(req)
new_tok = json.loads(resp.read())

tok["access_token"] = new_tok["access_token"]
if "refresh_token" in new_tok:
    tok["refresh_token"] = new_tok["refresh_token"]

with open(token_path, "w") as f:
    json.dump(tok, f)

print("Token refreshed OK")
