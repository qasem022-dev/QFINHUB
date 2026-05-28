from cloakbrowser import launch_persistent_context
import time
context = launch_persistent_context(user_data_dir='/home/admin1/.hermes/cloak-profiles/x-account-1', headless=True, humanize=True)
page = context.new_page()
page.set_default_timeout(30000)
page.goto('https://x.com/qfinhub', wait_until='domcontentloaded', timeout=20000)
time.sleep(5)
for i in range(3):
    page.evaluate('window.scrollBy(0, 500)')
    time.sleep(1.5)

tweets_js = """
(function() {
    const ts = [...document.querySelectorAll('[data-testid="tweet"]')];
    return ts.slice(0, 5).map(t => {
        const txt = t.querySelector('[data-testid="tweetText"]');
        const tm = t.querySelector('time');
        return {
            text: txt ? txt.innerText.substring(0, 80) : 'NO',
            time: tm ? tm.getAttribute('datetime') : 'NO'
        };
    });
})();
"""
tweets = page.evaluate(tweets_js)
for i, t in enumerate(tweets):
    print(f'[{i+1}] {t["time"]}: {t["text"]}')
context.close()
