import os, time
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser('~/.hermes/cloak-profiles/directory-submitter'),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

js = """(function() {
    var inputs = document.querySelectorAll('input, textarea, select');
    var results = [];
    for (var el of inputs) {
        if (el.type && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button') {
            results.push({
                type: el.type,
                name: el.name || '',
                id: el.id || '',
                placeholder: el.placeholder || '',
            });
        }
    }
    return results;
})()"""

# 1. Product Hunt — check submit page
page.goto("https://www.producthunt.com/posts/new", wait_until="domcontentloaded", timeout=30000)
time.sleep(8)
print("=== Product Hunt ===")
print(f"URL: {page.url}")
fields_ph = page.evaluate(js)
print(f"Fields: {len(fields_ph)}")
for f in fields_ph[:8]:
    print(f"  type={f['type']} name={f['name']} placeholder={f['placeholder'][:40]}")
body_ph = page.evaluate("document.body.innerText.substring(0, 400)")
print(f"Body: {body_ph[:200]}")

# 2. Toolbankai
page.goto("https://www.toolbankai.com/submit", wait_until="domcontentloaded", timeout=30000)
time.sleep(6)
print("\n=== ToolBankAI ===")
print(f"URL: {page.url}")
fields_tb = page.evaluate(js)
print(f"Fields: {len(fields_tb)}")
for f in fields_tb[:8]:
    print(f"  type={f['type']} name={f['name']} placeholder={f['placeholder'][:40]}")

# 3. AItoolstome
page.goto("https://aitoolstome.com/submit", wait_until="domcontentloaded", timeout=30000)
time.sleep(6)
print("\n=== AIToolsMe ===")
print(f"URL: {page.url}")
fields_at = page.evaluate(js)
print(f"Fields: {len(fields_at)}")
for f in fields_at[:8]:
    print(f"  type={f['type']} name={f['name']} placeholder={f['placeholder'][:40]}")

# 4. TopAItools
page.goto("https://www.topai.tools/submit", wait_until="domcontentloaded", timeout=30000)
time.sleep(6)
print("\n=== TopAI.tools ===")
print(f"URL: {page.url}")
fields_tat = page.evaluate(js)
print(f"Fields: {len(fields_tat)}")
for f in fields_tat[:8]:
    print(f"  type={f['type']} name={f['name']} placeholder={f['placeholder'][:40]}")

ctx.close()