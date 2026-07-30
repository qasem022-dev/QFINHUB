#!/usr/bin/env python3
"""
QFINHUB Free Profile Backlink Builder
Creates accounts on high-DR platforms using CloakBrowser (residential IP) +
IMAP-based email verification fetcher.

Strategy: Most platforms (Gravatar, About.me, DeviantArt, Behance, Flickr,
etc.) create dofollow profile backlinks with no post required. Just sign up,
fill profile, done.

This script tracks state in .optimizer-data/profile-backlinks.json so it can
resume if interrupted.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

PROJECT = Path("/home/admin1/qfinhub")
STATE_FILE = PROJECT / ".optimizer-data" / "profile-backlinks-state.json"

PROFILE = {
    "name": "Qasem Mohammed",
    "tagline": "Personal finance tools and education. Free mortgage, loan, and investment calculators at QFINHUB.",
    "bio": "Founder of QFINHUB.com — a free, no-signup personal finance platform offering mortgage, loan, investment, and tax calculators. I'm building tools that help people make better financial decisions without paying for software.",
    "website": "https://www.qfinhub.com",
    "website_alt": "https://qfinhub.com",
    "email": "q.finhub@gmail.com",
    "username": "qfinhub",
    "password": "Mohammed1",
}

PLATFORMS = [
    # (id, name, url, signup_method, requires_email_verify, notes)
    {
        "id": "gravatar",
        "name": "Gravatar",
        "url": "https://en.gravatar.com/",
        "dr": 95,
        "requires_verify": False,
        "notes": "Auto-approves if email matches. Just claim profile URL.",
        "signup_url": "https://en.gravatar.com/profiles/q.finhub@gmail.com",
    },
    {
        "id": "aboutme",
        "name": "About.me",
        "url": "https://about.me/",
        "dr": 92,
        "requires_verify": True,
        "notes": "Free tier, requires email confirm + claim link.",
        "signup_url": "https://about.me/signup",
    },
    {
        "id": "crunchbase",
        "name": "Crunchbase",
        "url": "https://www.crunchbase.com/",
        "dr": 91,
        "requires_verify": True,
        "notes": "Create personal profile. Free basic listing.",
        "signup_url": "https://www.crunchbase.com/add-company-profile",
    },
    {
        "id": "deviantart",
        "name": "DeviantArt",
        "url": "https://www.deviantart.com/",
        "dr": 93,
        "requires_verify": True,
        "notes": "Free profile with website URL field. Use finance-themed header image.",
        "signup_url": "https://www.deviantart.com/join",
    },
    {
        "id": "behance",
        "name": "Behance",
        "url": "https://www.behance.net/",
        "dr": 95,
        "requires_verify": True,
        "notes": "Adobe-owned. Free. Strong dofollow. Upload 1 finance infographic as project.",
        "signup_url": "https://www.behance.net/signup",
    },
    {
        "id": "dribbble",
        "name": "Dribbble",
        "url": "https://dribbble.com/",
        "dr": 94,
        "requires_verify": True,
        "notes": "Design community. Upload 1 design as shot.",
        "signup_url": "https://dribbble.com/signup",
    },
    {
        "id": "flickr",
        "name": "Flickr",
        "url": "https://www.flickr.com/",
        "dr": 92,
        "requires_verify": True,
        "notes": "Upload finance graphics. Profile link dofollow.",
        "signup_url": "https://www.flickr.com/signup",
    },
    {
        "id": "github",
        "name": "GitHub",
        "url": "https://github.com/",
        "dr": 96,
        "requires_verify": False,
        "notes": "Already have qasem022-dev account. Add website to profile.",
        "signup_url": "https://github.com/settings/profile",
    },
    {
        "id": "gitlab",
        "name": "GitLab",
        "url": "https://gitlab.com/",
        "dr": 91,
        "requires_verify": True,
        "notes": "Free signup. Add website to profile.",
        "signup_url": "https://gitlab.com/users/sign_up",
    },
    {
        "id": "bitbucket",
        "name": "Bitbucket",
        "url": "https://bitbucket.org/",
        "dr": 92,
        "requires_verify": True,
        "notes": "Atlassian-owned. Free. Website field in profile.",
        "signup_url": "https://bitbucket.org/account/signup/",
    },
    {
        "id": "medium",
        "name": "Medium",
        "url": "https://medium.com/",
        "dr": 95,
        "requires_verify": False,
        "notes": "ALREADY HAVE @q.finhub account. Add website link if missing.",
        "signup_url": "https://medium.com/me/settings",
    },
    {
        "id": "hashnode",
        "name": "Hashnode",
        "url": "https://hashnode.com/",
        "dr": 78,
        "requires_verify": True,
        "notes": "Dev blog platform. Strong dofollow in profile + articles.",
        "signup_url": "https://hashnode.com/onboard",
    },
    {
        "id": "substack",
        "name": "Substack",
        "url": "https://substack.com/",
        "dr": 93,
        "requires_verify": True,
        "notes": "Newsletter platform. Free. Profile website field.",
        "signup_url": "https://substack.com/signup",
    },
]


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "started": datetime.now().isoformat(),
        "profiles": {p["id"]: {"status": "pending", "dr": p["dr"], "name": p["name"]} for p in PLATFORMS},
    }


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def fetch_verification_code(sender_hint, timeout=120):
    """Run the email-verification-fetcher script to wait for a code."""
    script = PROJECT / "scripts" / "email-verification-fetcher.py"
    result = subprocess.run(
        [sys.executable, str(script), "--wait-for", sender_hint, "--timeout", str(timeout)],
        capture_output=True,
        text=True,
        timeout=timeout + 10,
    )
    if result.returncode == 0:
        # Output format: "CODE_FOUND=123456"
        for line in result.stdout.splitlines():
            if line.startswith("CODE_FOUND="):
                return line.split("=", 1)[1].strip()
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", help="Create only this platform (by id)")
    parser.add_argument("--list", action="store_true", help="List all platforms and status")
    parser.add_argument("--dry-run", action="store_true", help="Just show what would be done")
    args = parser.parse_args()

    state = load_state()

    if args.list:
        print(f"\n{'Platform':<20} {'DR':<5} {'Status':<12} {'URL'}")
        print("-" * 80)
        for p in PLATFORMS:
            ps = state["profiles"][p["id"]]
            print(f"{p['name']:<20} {p['dr']:<5} {ps['status']:<12} {p['url']}")
        print(f"\nState file: {STATE_FILE}")
        return

    targets = PLATFORMS if not args.platform else [p for p in PLATFORMS if p["id"] == args.platform]

    for p in targets:
        ps = state["profiles"][p["id"]]
        if ps["status"] == "completed":
            print(f"✓ {p['name']} already done (skipping)")
            continue
        if args.dry_run:
            print(f"[DRY] Would create {p['name']} ({p['url']})")
            print(f"      DR={p['dr']}, verify={p['requires_verify']}")
            print(f"      Notes: {p['notes']}")
            continue

        print(f"\n→ Creating profile: {p['name']} ({p['url']})")
        print(f"  DR={p['dr']}, requires_verify={p['requires_verify']}")

        # Mark in_progress
        ps["status"] = "in_progress"
        ps["started_at"] = datetime.now().isoformat()
        save_state(state)

        # Real signup happens via CloakBrowser in scripts/profile-signup-<id>.py
        # For now, this orchestrator just provides the dispatcher.
        # Each platform needs its own per-site flow due to varied forms.
        print(f"  ⚠ Per-platform signup script needed: scripts/profile-signup-{p['id']}.py")
        ps["status"] = "awaiting_script"
        save_state(state)

    print(f"\nState updated: {STATE_FILE}")


if __name__ == "__main__":
    main()