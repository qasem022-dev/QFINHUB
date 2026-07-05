#!/usr/bin/env python3
"""
Check karma/age requirements for all target subreddits.
Visits each subreddit's wiki/rules/automod pages to extract minimum requirements.
"""
import os, time, re

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

SUBREDDITS = [
    "personalfinance",
    "investing",
    "debtfree",
    "MiddleClassFinance",
    "leanfire",
    "financialindependence",
    "FirstTimeHomeBuyer",
    "realestateinvesting",
    "povertyfinance",
    "frugal",
    "CasualConversation",
    "NoStupidQuestions",
    "answers",
    "AskReddit",
]

def check_subreddit(page, sub):
    """Check a subreddit's rules/wiki for karma/age requirements."""
    results = {"subreddit": sub, "requirements": [], "notes": []}
    
    # 1. Check wiki automoderator config
    try:
        page.goto(f"https://old.reddit.com/r/{sub}/wiki/automoderator/", wait_until="domcontentloaded", timeout=15000)
        time.sleep(2)
        
        if "page not found" in page.evaluate("document.body.innerText.toLowerCase()").lower():
            results["wiki"] = "NOT_FOUND"
        else:
            body = page.evaluate("document.body.innerText")
            # Look for karma/age requirements
            karma_matches = re.findall(r'karma.*?(\d+)', body, re.IGNORECASE)
            age_matches = re.findall(r'age.*?(\d+)', body, re.IGNORECASE)
            account_matches = re.findall(r'account.*?(\d+)', body, re.IGNORECASE)
            results["wiki_karma"] = karma_matches[:5] if karma_matches else []
            results["wiki_age"] = age_matches[:5] if age_matches else []
            results["wiki_account"] = account_matches[:5] if account_matches else []
            # Extract relevant lines
            lines = body.split('\n')
            for line in lines:
                if re.search(r'karma|age|account|day|month|require|minimum|threshold', line, re.IGNORECASE):
                    results["requirements"].append(line.strip()[:200])
    except Exception as e:
        results["wiki_error"] = str(e)[:100]
    
    # 2. Check rules page
    try:
        page.goto(f"https://old.reddit.com/r/{sub}/about/rules", wait_until="domcontentloaded", timeout=15000)
        time.sleep(2)
        body = page.evaluate("document.body.innerText.substring(0, 3000)")
        results["rules_text"] = body[:1500]
        
        # Look for karma/age mentions
        lines = body.split('\n')
        for line in lines:
            if re.search(r'karma|account age|minimum|require|new account|low karma', line, re.IGNORECASE):
                results["requirements"].append(line.strip()[:200])
    except Exception as e:
        results["rules_error"] = str(e)[:100]
    
    # 3. Check wiki index for posting guidelines
    try:
        page.goto(f"https://old.reddit.com/r/{sub}/wiki/index/", wait_until="domcontentloaded", timeout=15000)
        time.sleep(2)
        body = page.evaluate("document.body.innerText.substring(0, 2000)")
        if "page not found" not in body.lower():
            lines = body.split('\n')
            for line in lines:
                if re.search(r'karma|age|account|require|minimum|guideline|posting|comment', line, re.IGNORECASE):
                    results["requirements"].append(line.strip()[:200])
    except:
        pass
    
    # 4. Check sidebar (about page)
    try:
        page.goto(f"https://old.reddit.com/r/{sub}/about/", wait_until="domcontentloaded", timeout=15000)
        time.sleep(2)
        body = page.evaluate("document.body.innerText.substring(0, 3000)")
        # Look at sidebar/description
        lines = body.split('\n')
        for line in lines:
            if re.search(r'karma|account age|minimum|require|new account|low karma|first post|verified', line, re.IGNORECASE):
                results["requirements"].append(line.strip()[:200])
    except:
        pass
    
    return results


def main():
    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
        headless=True, humanize=True,
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    
    # Verify login
    page.goto("https://www.reddit.com/user/me/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    if "login" in page.url.lower():
        print("SESSION_EXPIRED")
        ctx.close()
        return
    print("Logged in as u/QASEMQH")
    print("Current karma: 1 post, 0 comment (1 total)")
    print("Account age: ~1 month")
    print()
    
    all_results = {}
    
    for sub in SUBREDDITS:
        print(f"\n{'='*60}")
        print(f"Checking r/{sub}")
        print(f"{'='*60}")
        
        result = check_subreddit(page, sub)
        all_results[sub] = result
        
        # Print findings
        if result.get("requirements"):
            print(f"Requirements found:")
            seen = set()
            for req in result["requirements"]:
                if req not in seen and req:
                    print(f"  - {req[:150]}")
                    seen.add(req)
        else:
            print("No explicit karma/age requirements found")
        
        if result.get("wiki_karma"):
            print(f"Wiki karma values: {result['wiki_karma']}")
        if result.get("wiki_age"):
            print(f"Wiki age values: {result['wiki_age']}")
        
        if "rules_text" in result:
            # Extract first few rules
            rules_lines = [l.strip() for l in result["rules_text"].split('\n') if l.strip() and len(l.strip()) > 10]
            if rules_lines:
                print(f"Rules preview (first 3):")
                for r in rules_lines[:3]:
                    print(f"  {r[:100]}")
        
        time.sleep(2)
    
    # Summary
    print(f"\n\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    safe_subs = []
    restricted_subs = []
    unknown_subs = []
    
    for sub, data in all_results.items():
        reqs = " ".join(data.get("requirements", []))
        has_karma_req = bool(re.search(r'karma.*?(\d+)', reqs, re.IGNORECASE))
        has_age_req = bool(re.search(r'age|day|month', reqs, re.IGNORECASE))
        
        if not data.get("requirements") or "no requirement" in reqs.lower():
            safe_subs.append(sub)
        elif has_karma_req or has_age_req:
            restricted_subs.append((sub, reqs[:200]))
        else:
            unknown_subs.append(sub)
    
    print(f"\nSAFE (no requirements found): {safe_subs}")
    print(f"\nRESTRICTED: {restricted_subs}")
    print(f"\nUNKNOWN: {unknown_subs}")
    
    ctx.close()

if __name__ == "__main__":
    main()