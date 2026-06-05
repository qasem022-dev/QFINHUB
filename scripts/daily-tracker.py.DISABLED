#!/usr/bin/env python3
"""
QFINHUB Daily Performance Tracker — Day-over-Day Comparison
Tracks all growth engines and ensures each day beats the previous.

Run: python3 scripts/daily-tracker.py
"""
import json, os, sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRACKING_FILE = PROJECT_ROOT / ".optimizer-data" / "daily-tracking.json"
TRACKING_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_tracking():
    if TRACKING_FILE.exists():
        with open(TRACKING_FILE) as f:
            return json.load(f)
    return {"history": []}

def save_tracking(data):
    with open(TRACKING_FILE, "w") as f:
        json.dump(data, f, indent=2)

def safe_load_json(filepath, default=None):
    """Load JSON with error handling."""
    try:
        if filepath.exists():
            with open(filepath) as f:
                return json.load(f)
    except (json.JSONDecodeError, PermissionError, OSError) as e:
        print(f"⚠️ Warning: Could not read {filepath}: {e}", file=sys.stderr)
    return default if default is not None else {}

def collect_metrics():
    """Gather all current metrics from engine state files."""
    today = datetime.now().strftime("%Y-%m-%d")
    metrics = {"date": today, "timestamp": datetime.now().isoformat()}

    # X Growth
    x_state_file = PROJECT_ROOT / ".x-data-v2" / "viral-engine-state.json"
    x = safe_load_json(x_state_file)
    if x:
        metrics["x"] = {
            "giant_replies": x.get("giant_replies", 0),
            "threads": x.get("threads", 0),
            "challenges": x.get("challenges", 0),
            "self_tweets": x.get("self_tweets", 0),
            "followers": x.get("followers", 0),
            "impressions_est": x.get("total_impressions_est", 0),
        }

    # Pinterest
    pin_state_file = PROJECT_ROOT / ".pinterest-data" / "growth-state.json"
    p = safe_load_json(pin_state_file)
    pin_gen_file = PROJECT_ROOT / ".pinterest-data" / "generator-state.json"
    pg = safe_load_json(pin_gen_file)
    metrics["pinterest"] = {
        "total_pins": pg.get("total_pins", 0),
        "monthly_views": p.get("monthly_views", "0"),
        "following": len(p.get("followed", [])),
    }

    # Blog (count lines in posts.ts)
    blog_file = PROJECT_ROOT / "src" / "lib" / "blog" / "posts.ts"
    try:
        with open(blog_file) as f:
            blog_posts = sum(1 for line in f if line.strip().startswith('slug:'))
        metrics["blog"] = {"total_posts": blog_posts}
    except (OSError, PermissionError):
        metrics["blog"] = {"total_posts": 0}

    # GSC (from latest analytics report)
    gsc_file = PROJECT_ROOT / ".optimizer-data" / "traffic-report.json"
    gsc = safe_load_json(gsc_file)
    summary = gsc.get("search_console", {}).get("summary", {}) if gsc else {}
    metrics["gsc"] = {
        "clicks_7d": summary.get("clicks", 0),
        "impressions_7d": summary.get("impressions", 0),
        "ctr": summary.get("ctr", 0),
        "avg_position": summary.get("position", 0),
    }

    # HARO
    haro_file = PROJECT_ROOT / ".haro-data" / "sent-responses.json"
    haro = safe_load_json(haro_file, default=[])
    metrics["haro"] = {"total_responses": len(haro) if isinstance(haro, list) else 0}

    return metrics

def compare_day_over_day(current, previous):
    """Generate a day-over-day comparison."""
    if not previous:
        return "📊 First day of tracking — baseline established."

    lines = []
    lines.append("📈 DAY-OVER-DAY COMPARISON")
    lines.append(f"   {previous['date']} → {current['date']}")
    lines.append("")

    # X metrics
    if "x" in current and "x" in previous:
        cx = current["x"]
        px = previous["x"]
        lines.append("🔵 X/Twitter:")
        for key, label in [
            ("giant_replies", "Giant Replies"), ("threads", "Threads"),
            ("challenges", "Challenges"), ("self_tweets", "Self-Tweets"),
            ("followers", "Followers"), ("impressions_est", "Est. Impressions")
        ]:
            cur = cx.get(key, 0)
            prev = px.get(key, 0)
            delta = cur - prev
            icon = "📈" if delta > 0 else ("📉" if delta < 0 else "➡️")
            if key == "impressions_est":
                lines.append(f"   {icon} {label}: {cur:,.0f} (Δ {delta:+,.0f})")
            else:
                lines.append(f"   {icon} {label}: {cur} (Δ {delta:+d})")

    # Pinterest
    if "pinterest" in current and "pinterest" in previous:
        cp = current["pinterest"]
        pp = previous["pinterest"]
        lines.append("")
        lines.append("🔴 Pinterest:")
        for key, label in [("total_pins", "Total Pins"), ("monthly_views", "Monthly Views"),
                          ("following", "Following")]:
            cur = cp.get(key, 0)
            prev = pp.get(key, 0)
            cur_v = int(str(cur).replace(",", "")) if isinstance(cur, str) else cur
            prev_v = int(str(prev).replace(",", "")) if isinstance(prev, str) else prev
            delta = cur_v - prev_v
            icon = "📈" if delta > 0 else ("📉" if delta < 0 else "➡️")
            lines.append(f"   {icon} {label}: {cur} (Δ {delta:+d})")

    # GSC
    if "gsc" in current and "gsc" in previous:
        cg = current["gsc"]
        pg = previous["gsc"]
        lines.append("")
        lines.append("🔍 Google Search Console (7d):")
        for key, label in [("clicks_7d", "Clicks"), ("impressions_7d", "Impressions"),
                          ("ctr", "CTR %"), ("avg_position", "Avg Position")]:
            cur = cg.get(key, 0)
            prev = pg.get(key, 0)
            delta = cur - prev
            icon = "📈" if (key == "avg_position" and delta < 0) or (key != "avg_position" and delta > 0) else ("📉" if delta != 0 else "➡️")
            if key == "ctr":
                lines.append(f"   {icon} {label}: {cur:.2f}% (Δ {delta:+.2f}%)")
            elif key == "avg_position":
                lines.append(f"   {icon} {label}: {cur:.1f} (Δ {delta:+.1f})")
            else:
                lines.append(f"   {icon} {label}: {cur} (Δ {delta:+d})")

    # Blog
    if "blog" in current and "blog" in previous:
        cb = current["blog"]
        pb = previous["blog"]
        delta = cb.get("total_posts", 0) - pb.get("total_posts", 0)
        lines.append(f"\n📝 Blog: {cb['total_posts']} posts (Δ {delta:+d})")

    # HARO
    if "haro" in current and "haro" in previous:
        ch = current["haro"]
        ph = previous["haro"]
        delta = ch.get("total_responses", 0) - ph.get("total_responses", 0)
        lines.append(f"📧 HARO: {ch['total_responses']} responses (Δ {delta:+d})")

    # Status
    improvements = 0
    declines = 0
    for line in lines:
        if "📈" in line:
            improvements += 1
        elif "📉" in line:
            declines += 1

    lines.append("")
    if declines == 0 and improvements > 0:
        lines.append("🟢 ALL METRICS IMPROVING OR STABLE")
    elif declines > improvements:
        lines.append(f"🔴 {declines} metrics declining — needs attention!")
    else:
        lines.append(f"🟡 {improvements} improving, {declines} declining")

    return "\n".join(lines)


def main():
    try:
        tracking = load_tracking()
        today_metrics = collect_metrics()
        history = tracking.get("history", [])

        # Check if today already recorded
        today = today_metrics["date"]
        existing = [h for h in history if h["date"] == today]

        if existing:
            for h in history:
                if h["date"] == today:
                    h.update(today_metrics)
                    break
        else:
            history.append(today_metrics)

        # Keep last 90 days
        history = history[-90:]
        tracking["history"] = history
        save_tracking(tracking)

        # Compare with yesterday
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        yesterday_entry = None
        for h in history:
            if h["date"] == yesterday:
                yesterday_entry = h
                break
        if not yesterday_entry and len(history) >= 2:
            yesterday_entry = history[-2]

        comparison = compare_day_over_day(today_metrics, yesterday_entry)
        print(comparison)

        # Save comparison
        with open(PROJECT_ROOT / ".optimizer-data" / "daily-comparison.txt", "w") as f:
            f.write(comparison)
    except Exception as e:
        print(f"❌ Daily tracker error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
