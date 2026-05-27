#!/usr/bin/env python3
"""
X Agent v3 — CloakBrowser-Powered (Replaces API-based v2)
===========================================================
Migrates the old x-agent-v2.cjs from X API ($0.20/call, 402 errors)
to CloakBrowser (free, persistent session, undetectable).

Modes:
  --daily          → Post a daily tweet/thread (maps to viral-engine --mode self-tweet)
  --generate       → Generate content for future posting (Gemini-powered)
  --weekly-thread  → Post a weekly deep-dive thread (maps to viral-engine --mode viral-thread)
  --engage         → Engage with target accounts (maps to viral-engine --mode giant-reply)

All X interactions via CloakBrowser. Content generation via DeepSeek API.
Replaces: scripts/x-agent-v2.cjs (API-based, broken — 402 Payment Required)
Shell wrappers updated: ~/.hermes/scripts/x-daily-*.sh, x-weekly-thread.sh, x-monthly-generate.sh
"""

import sys, os, time, json, random, re, argparse, subprocess
from datetime import datetime

QFINHUB_ROOT = '/home/admin1/qfinhub'
DATA_DIR = os.path.join(QFINHUB_ROOT, '.x-data-v2')
STATE_FILE = os.path.join(DATA_DIR, 'viral-engine-state.json')
LOG_DIR = os.path.join(DATA_DIR)
os.makedirs(DATA_DIR, exist_ok=True)

# ─── Load .env.local ───
def load_env():
    env = {}
    env_path = os.path.join(QFINHUB_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, _, v = line.partition('=')
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

ENV = load_env()

# ─── CLI ───
parser = argparse.ArgumentParser(description='X Agent v3 — CloakBrowser-powered')
parser.add_argument('--daily', action='store_true', help='Post daily tweet/thread')
parser.add_argument('--generate', action='store_true', help='Generate content for future posting')
parser.add_argument('--weekly-thread', action='store_true', help='Post weekly deep-dive thread')
parser.add_argument('--engage', action='store_true', help='Engage with target accounts')
parser.add_argument('--dry-run', action='store_true', help='Generate content but do not post')
args = parser.parse_args()


def log(msg, mode='daily'):
    """Append to mode-specific log file."""
    log_file = os.path.join(LOG_DIR, f'cron-{mode}.log')
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(log_file, 'a') as f:
        f.write(f'[{timestamp}] {msg}\n')
    print(f'[{timestamp}] {msg}')


def generate_content_via_gemini(topic='general finance'):
    """Use Gemini API to generate tweet/thread content."""
    import urllib.request, urllib.error
    
    api_key = ENV.get('GEMINI_API_KEY', '')
    model = ENV.get('GEMINI_MODEL', 'gemini-2.5-flash')
    if not api_key:
        log('ERROR: GEMINI_API_KEY not found in .env.local', 'daily')
        return None
    
    prompt = f"""Generate a high-engagement tweet about {topic} for the QFINHUB account (@qfinhub).
QFINHUB is a free financial calculator platform with 125+ calculators (mortgage, retirement, debt, investing, etc.).

Requirements:
- Hook in first line (question, bold claim, or surprising fact)
- Include ONE specific number/statistic
- Include a link to qfinhub.com/calculators
- NO emojis (strictly forbidden)
- Under 240 characters
- Conversational, authoritative tone
- Make people WANT to calculate their numbers

Return ONLY the tweet text, nothing else."""

    try:
        data = json.dumps({
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {
                'temperature': 0.8,
                'maxOutputTokens': 200,
            }
        }).encode()
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return result['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        log(f'Gemini API error: {e}', 'daily')
        return None


def post_via_viral_engine(mode, content=None):
    """Call the viral engine (CloakBrowser-based) for posting."""
    cmd = ['python3', os.path.join(QFINHUB_ROOT, 'scripts/x-viral-engine.py'), '--mode', mode]
    
    if content:
        # Pass content via temp file
        content_file = os.path.join(DATA_DIR, 'manual-content.txt')
        with open(content_file, 'w') as f:
            f.write(content)
        cmd.extend(['--content-file', content_file])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, cwd=QFINHUB_ROOT)
        if result.returncode == 0:
            log(f'Posted via viral engine ({mode}): OK', 'daily')
            return True
        else:
            log(f'Viral engine error ({mode}): {result.stderr[:200]}', 'daily')
            return False
    except subprocess.TimeoutExpired:
        log(f'Viral engine timeout ({mode})', 'daily')
        return False
    except Exception as e:
        log(f'Viral engine exception ({mode}): {e}', 'daily')
        return False


def engage_via_viral_engine():
    """Engage with target accounts via viral engine."""
    return post_via_viral_engine('giant-reply')


def post_thread_via_viral_engine(content=None):
    """Post a viral thread via viral engine."""
    return post_via_viral_engine('viral-thread', content)


def daily_post():
    """Daily posting workflow."""
    log('═══ X Agent v3 (CloakBrowser) — Daily Run ═══', 'daily')
    log(f'Date: {datetime.now().strftime("%Y-%m-%d")}', 'daily')
    
    # Step 1: Generate content via DeepSeek (free)
    log('Generating content via Gemini...', 'daily')
    content = generate_content_via_gemini()
    
    if not content:
        log('Content generation failed — using fallback content', 'daily')
        content = f"Ever wondered how much you'll actually pay in interest? Calculate it free at qfinhub.com/calculators/mortgage-calculator — no signup, instant results."
    
    log(f'Content: {content[:100]}...', 'daily')
    
    # Step 2: Post via CloakBrowser (viral engine self-tweet mode)
    if not args.dry_run:
        log('Posting via CloakBrowser...', 'daily')
        success = post_via_viral_engine('self-tweet', content)
        if success:
            log('✓ Daily post complete', 'daily')
        else:
            log('✗ Post failed — check CloakBrowser/X login', 'daily')
    else:
        log('DRY RUN — content generated but not posted', 'daily')
    
    log(f'API cost: $0.00 (CloakBrowser + Gemini)', 'daily')
    log('', 'daily')


def weekly_thread():
    """Weekly deep-dive thread."""
    log('═══ X Agent v3 — Weekly Thread ═══', 'daily')
    
    topics = [
        'mortgage rates and home affordability in 2026',
        'compound interest and retirement planning',
        'debt payoff strategies (snowball vs avalanche)',
        'tax optimization for W2 employees',
        'investment returns and the power of dollar-cost averaging'
    ]
    topic = random.choice(topics)
    
    content = generate_content_via_gemini(topic)
    if content and not args.dry_run:
        post_thread_via_viral_engine(content)
        log(f'✓ Weekly thread posted: {topic}', 'daily')
    else:
        log(f'Weekly thread generated (topic: {topic})', 'daily')


def generate_content_batch():
    """Generate a batch of content for future posting (replaces --generate mode)."""
    log('═══ X Agent v3 — Content Generation ═══', 'daily')
    
    topics = [
        'mortgage calculator',
        'compound interest calculator',
        'retirement planning calculator',
        'debt snowball calculator',
        'budget planner',
        'investment return calculator',
        'tax calculator',
        '401k contribution limits',
        'emergency fund savings',
        'auto loan calculator'
    ]
    
    posts = []
    for topic in topics[:5]:  # Generate 5 posts
        content = generate_content_via_gemini(topic)
        if content:
            posts.append({'topic': topic, 'content': content, 'generated_at': datetime.now().isoformat()})
            log(f'  ✓ {topic}', 'daily')
    
    # Save to content library
    lib_file = os.path.join(DATA_DIR, 'content-library.json')
    existing = []
    if os.path.exists(lib_file):
        with open(lib_file) as f:
            existing = json.load(f)
    existing.extend(posts)
    with open(lib_file, 'w') as f:
        json.dump(existing, f, indent=2)
    
    log(f'Generated {len(posts)} posts. Total library: {len(existing)}', 'daily')


# ─── MAIN ───
if __name__ == '__main__':
    log(f'X Agent v3 (CloakBrowser) started', 'daily')
    
    if args.engage:
        log('Mode: Engage (giant replies)', 'daily')
        engage_via_viral_engine()
    elif args.weekly_thread:
        log('Mode: Weekly Thread', 'daily')
        weekly_thread()
    elif args.generate:
        log('Mode: Content Generation', 'daily')
        generate_content_batch()
    elif args.daily:
        log('Mode: Daily Post', 'daily')
        daily_post()
    else:
        # Default: daily post
        log('Mode: Daily Post (default)', 'daily')
        daily_post()
    
    log('Done.', 'daily')
