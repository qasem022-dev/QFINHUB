#!/usr/bin/env python3
"""Delete remaining 6-8 visible tweets on @qfinhub profile."""
import os, sys, time
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

JS = {
    "more": 'document.querySelector("[aria-label=\\"More\\"]")',
    "delete": """
(function(){
var items=document.querySelectorAll('[role="menuitem"]');
for(var i=0;i<items.length;i++){
if(items[i].offsetParent&&items[i].textContent.trim()==="Delete"){
items[i].click();return 1}}
return 0})()
""",
    "confirm": 'document.querySelector("[data-testid=\\"confirmationSheetConfirm\\"]")',
}

def main():
    context = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/x-account-1"),
        headless=True, humanize=True)
    page = context.new_page()
    
    # Collect OUR tweet IDs
    page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    for _ in range(5):
        page.keyboard.press("End"); time.sleep(1.5)
    time.sleep(2)
    
    ids = page.evaluate("""(function(){
var ids=[],seen={};
document.querySelectorAll('a[href*="/status/"]').forEach(function(l){
var h=l.getAttribute('href');
if((h.includes('QFinhub')||h.includes('qfinhub'))&&!h.includes('photo')){
var m=h.match(/\/status\/(\\d+)/);
if(m&&!seen[m[1]]){seen[m[1]]=1;ids.push(m[1])}}});
return ids})()""")
    
    print(f"Found {len(ids)} tweets: {ids}")
    
    deleted = 0
    for tid in ids:
        print(f"\n[{tid}] ", end="", flush=True)
        page.goto(f"https://x.com/QFinhub/status/{tid}", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        
        # More
        r = page.evaluate("(function(){var b=document.querySelector('[aria-label=\"More\"]');if(b&&b.offsetParent){b.click();return 1}return 0})()")
        if not r: print("NO-MORE"); continue
        time.sleep(1.5)
        
        # Delete
        r = page.evaluate("(function(){var is=document.querySelectorAll('[role=\"menuitem\"]');for(var i=0;i<is.length;i++){if(is[i].offsetParent&&is[i].textContent.trim()==='Delete'){is[i].click();return 1}}return 0})()")
        if not r: print("NO-DELETE"); continue
        time.sleep(1.5)
        
        # Confirm
        r = page.evaluate("(function(){var b=document.querySelector('[data-testid=\"confirmationSheetConfirm\"]');if(b){b.click();return 1}return 0})()")
        if r: deleted+=1; print("DELETED")
        else: print("NO-CONFIRM")
        time.sleep(3)
    
    print(f"\n--- Deleted: {deleted}/{len(ids)} ---")
    
    # Verify
    page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)
    txt = page.evaluate("document.body.innerText")
    for l in txt.split("\n"):
        if "post" in l.lower(): print(l.strip())
    
    context.close()

if __name__ == "__main__":
    main()
