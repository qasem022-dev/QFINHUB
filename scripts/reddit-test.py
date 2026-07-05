import os, time
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser('~/.hermes/cloak-profiles/reddit-qasemqh'),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Verify login
page.goto('https://www.reddit.com/user/me/', wait_until='domcontentloaded', timeout=30000)
time.sleep(3)
if 'login' in page.url.lower():
    print('SESSION_EXPIRED')
    ctx.close()
    raise SystemExit('expired')

print('Logged in as u/QASEMQH')

# Go to r/personalfinance new
page.goto('https://www.reddit.com/r/personalfinance/new/', wait_until='domcontentloaded', timeout=30000)
time.sleep(5)

# Extract posts
posts = page.evaluate("""
(function() {
    var results = [];
    var articles = document.querySelectorAll('shreddit-post, article, [data-testid="post-container"]');
    articles.forEach(function(article) {
        var titleEl = article.querySelector('a[slot="title"], h3, [data-testid="post-title"]');
        var linkEl = article.querySelector('a[href*="/comments/"]');
        if (titleEl && linkEl) {
            results.push({
                title: titleEl.textContent.trim().substring(0, 200),
                url: linkEl.href
            });
        }
    });
    return results;
})()
""")

print(f'Found {len(posts)} posts in r/personalfinance/new')
for i, post in enumerate(posts[:10]):
    print(f'  {i+1}. {post["title"][:80]}')
    print(f'     URL: {post["url"][:80]}')

ctx.close()