#!/usr/bin/env python3
"""
Sequence-based outreach for the QFINHUB calculator-build offer.

Why a sequence: a single cold email replies at roughly 2-4%. Four touches, spaced
and threaded, reply at 8-15% on the same list. Sending once and stopping is the
single most expensive mistake in cold outreach.

Touches:
  1  the observation + a live branded demo link   (+0 days)
  2  short bump, same thread                      (+4 days)
  3  direct qualifying question                   (+4 days)
  4  polite close-out                             (+5 days)

Safety rules baked in:
  - plain text, one link maximum, no images or tracking pixels
  - hard daily cap (default 15 new contacts) to protect qfinhub.com reputation
  - random 45-150s gap between sends
  - never contacts an address twice, never follows up inside a thread that has
    already received a reply from the prospect
  - follow-ups ride the original thread via In-Reply-To / References

Usage:
    python3 scripts/outreach-send.py --dry-run --limit 3
    python3 scripts/outreach-send.py --limit 15          # sends whatever is due
    python3 scripts/outreach-send.py --stats
"""

import argparse
import csv
import datetime
import html
import json
import random
import re
import subprocess
import sys
import textwrap
import time
import urllib.parse
import urllib.request
from pathlib import Path

DATA = Path(".optimizer-data")
PROSPECTS = DATA / "prospects-final.csv"
LOG = DATA / "outreach-sent.csv"
OFFER_URL = "https://www.qfinhub.com/services"
DEMO_BASE = "https://www.qfinhub.com/demo"
SENDER = "Q.finhub@qfinhub.com"
TOKEN_PATH = Path.home() / ".hermes" / "google_token.json"

# Days to wait before each touch (indexed by touch number).
GAP_DAYS = {2: 4, 3: 4, 4: 5}

SKIP_DOMAIN_HINTS = ("americascreditunions.org", "homeshow.ai", "mycreditunion.gov")

# ---------------------------------------------------------------- templates

TEMPLATES = {
    1: {
        "noc": {
            "subject": "payment calculator for {domain}",
            "body": """{greeting}

I couldn't find a payment calculator on {domain}. So anyone who wants a number leaves your site for their bank's calculator, and the bank gets the enquiry.

Rather than describe what I'd build, I built it: {demo_url}

It's live — change the numbers. If it's useful I'll wire it properly into {domain} with your rates and a lead form that reaches your CRM, inside 72 hours.

Qasem
QFINHUB""",
        },
        "has": {
            "subject": "your calculator on {domain}",
            "body": """{greeting}

You already have a calculator on {domain}, which puts you ahead of most brokers I look at. But it's a dead end: visitors get a number, then vanish, and you never learn who they were.

So I built the version that captures them: {demo_url}

It's live — change the numbers. Same maths, plus a form that turns the calculation into a named enquiry.

Worth 60 seconds?

Qasem
QFINHUB""",
        },
    },
    2: {
        "_": {
            "subject": None,  # keep the original subject so the thread groups
            "body": """{greeting}

Following up on the calculator I set up for {domain}: {demo_url}

Nothing to install to look at it. If the timing is wrong just say so and I'll close the file — no hard feelings.

Qasem""",
        },
    },
    3: {
        "_": {
            "subject": None,
            "body": """{greeting}

One question and then I'll stop.

Is it that {domain} already has this covered somewhere, or that a calculator just isn't a priority this quarter?

Both answers are useful to me. The second tells me I'm talking to the wrong kind of firm.

Qasem""",
        },
    },
    4: {
        "_": {
            "subject": None,
            "body": """{greeting}

Closing the file on this one. The sample stays live if it's ever useful: {demo_url}

If calculators move up your list later, reply to this thread and I'll pick it back up.

Good luck with the quarter.

Qasem""",
        },
    },
}

# Local parts that are a department or a robot, never a person's first name.
GENERIC_LOCALS = {
    "info", "sales", "team", "contact", "hello", "office", "admin", "support",
    "enquiries", "inquiries", "service", "services", "marketing", "mail", "email",
    "home", "loans", "loan", "apply", "rate", "rates", "quotes", "quote",
    "lending", "mortgage", "broker", "group", "realty", "realestate", "customercare",
    "help", "accounts", "reception", "frontdesk", "newbusiness", "general",
    "start", "new", "online", "web", "banker", "advisor", "agent",
}

# Common US first names. A greeting only uses a name we can verify is a real
# first name — 'Hi Mfazio,' or 'Hi Economagico,' is worse than 'Hello,' because
# it tells the recipient a script wrote the email.
COMMON_NAMES = set("""
aaron adam adrian alan albert alex alexander alexis alfred alice alicia alison
allison alyssa amanda amber amy ana andrea andrew angela angelo anita ann anna
anne annette anthony antonio april arthur ashley austin barbara barry beatrice
becky benjamin bernard beth bethany betty beverly bianca bill billy blake bob
bobby bonnie brad bradley brandon brenda brian briana bridget brittany brooke
bruce bryan caleb calvin cameron carl carla carlos carmen carol caroline carolyn
carrie casey cassandra catherine cathy chad charles charlotte chase chelsea cheryl
chester chris christian christina christine christopher cindy claire clara claude
claudia cody colin connie connor craig cristina crystal curtis cynthia daisy dale
damon dan dana daniel danielle danny darrell darren daryl dave david dawn dean
debbie deborah debra denise dennis derek desiree diana diane dianne diego don
donald donna doris dorothy doug douglas dustin dwayne dwight dylan earl eddie
edgar edith eduardo edward edwin eileen elaine eleanor elena eli elias elijah
elizabeth ella ellen elliot elmer eloise elsa emily emma eric erica erik erin
ernest esther eugene eva evan evelyn faith felicia fernando florence floyd
frances francis francisco frank franklin fred frederick gabriel gail gary gavin
gene geoffrey george gerald gina giovanni gladys glen glenda glenn gloria gordon
grace graham grant greg gregg gregory gwen hannah hans harold harriet harry harvey
hazel heather hector heidi helen henry herbert holly howard hugh ian ida irene
iris isaac isabel ivan jack jackie jacob jacqueline jaime jake james jamie jan
jane janet janice jared jason javier jay jean jeanette jeanne jeff jeffery jeffrey
jenna jennifer jeremy jerome jerry jesse jessica jesus jill jim jimmy joan joann
joanna joanne joe joel joey johanna john johnny jon jonathan jordan jorge jose
joseph josephine josh joshua joyce juan judy julia julian julie julio justin kara
karen kate katherine kathleen kathryn kathy katie katrina kay keith kelly ken
kendra kenneth kevin kim kimberly kirk krista kristen kristin kurt kyle lance
larry laura lauren laurie lawrence leah lee leo leon leonard leroy leslie lewis
lillian lily linda lindsay lindsey lisa lloyd logan lois lori louis louise lucas
lucia lucille lucy luis luke lydia lynn madison mae maggie manuel marc marcus
margaret maria mariah marie marilyn marina mario marion marjorie mark marlene
martha martin marvin mary mason matt matthew maureen maurice max maxine may mei
melanie melinda melissa melody melvin mercedes meredith mia micah michael
michele michelle miguel mike mildred milton mindy miranda mitchell molly monica
monique morgan morris natalie natasha nate nathan nathaniel neil nelson nicholas
nick nicolas nicole nina noah noel nora norma norman olga oliver olivia omar
opal oscar pablo pamela patricia patrick paul paula pauline pedro peggy penny
perry peter phil philip phillip phyllis polly priscilla rachel rafael ralph
ramon randall randy raul ray raymond rebecca regina reginald rene renee rhonda
ricardo richard rick ricky rita robert roberta robin robyn rodney roger roland
ron ronald ronnie rosa rosalie rose ross roy ruben ruby russell ruth ryan sally
salvador sam samantha samuel sandra sara sarah scott sean seth shane shannon
sharon shawn sheila shelby shelley sherri sherry shirley sidney simon sonia
sophia sophie stacey stacy stanley stella stephanie stephen steve steven stuart
sue susan suzanne sylvia tammy tanya tara ted teresa terrence terry tiffany
tim timothy tina todd tom tommy tony tracey tracy travis trevor troy tyler
valerie vanessa vaughn veronica vernon vicki vickie victor victoria vincent
viola violet virginia vivian wade wallace walter wanda warren wayne wendy
wesley whitney willard william willie wilma yolanda yvette yvonne zachary zoe
""".split())


# ---------------------------------------------------------------- helpers


def first_name(email: str) -> str | None:
    """Best-effort first name, or None when we cannot verify it.

    Only fires on a clean single alpha token that is both a real first name and
    not a department word, so we never greet someone as 'Hi Mfazio'.
    """
    local = re.split(r"[._\-+0-9]", email.split("@")[0].lower())[0]
    if not local.isalpha() or not (2 <= len(local) <= 12):
        return None
    if local in GENERIC_LOCALS or local not in COMMON_NAMES:
        return None
    return local.capitalize()


def clean_org(org: str, domain: str) -> str:
    """Un-escape entities and drop page-title junk like 'Home' or 'Mortgage Broker'."""
    name = html.unescape(org or "").replace("\u00a0", " ").strip()
    name = re.sub(r"\s+", " ", name)
    low = name.lower()
    if (
        not name
        or len(name) > 46
        or low in {"home", "homepage", "welcome", "index"}
        or low.startswith(("mortgage broker", "mortgage lender", "home loans",
                           "experienced mortgage", "best mortgage"))
    ):
        return domain
    return name


def demo_url(row: dict) -> str:
    q = urllib.parse.urlencode({
        "co": clean_org(row["org"], row["domain"]),
        "ref": row["domain"],
    })
    return f"{DEMO_BASE}?{q}"


def angle_for(row: dict, override: str) -> str:
    """Choose the opening angle from the verified calculator detection."""
    if override in ("has", "noc"):
        return override
    return "has" if row.get("has_calculator") == "yes" else "noc"


def render(row: dict, touch: int, angle: str) -> tuple[str, str]:
    per_angle = TEMPLATES[touch]
    t = per_angle.get(angle) or per_angle["_"]
    name = first_name(row["email"])
    vals = {
        "greeting": f"Hi {name}," if name else "Hello,",
        "domain": row["domain"],
        "demo_url": demo_url(row),
        "offer_url": OFFER_URL,
    }
    body = t["body"].format(**vals)
    out = []
    for para in body.split("\n\n"):
        out.append(para if "\n" in para else textwrap.fill(para, width=72))
    subject = t["subject"].format(**vals) if t["subject"] else ""
    return subject, "\n\n".join(out)


# ---------------------------------------------------------------- state

LOG_FIELDS = ["sent_at", "email", "domain", "touch", "angle", "subject",
              "message_id", "thread_id"]


def load_rows() -> list[dict]:
    if not PROSPECTS.exists():
        raise SystemExit(f"missing {PROSPECTS}")
    return list(csv.DictReader(PROSPECTS.open()))


def load_log() -> list[dict]:
    if not LOG.exists():
        return []
    rows = []
    with LOG.open() as f:
        for r in csv.DictReader(f):
            try:
                r["touch"] = int(r.get("touch") or 1)
            except ValueError:
                r["touch"] = 1
            rows.append(r)
    return rows


def append_log(rows: list[dict]) -> None:
    new = not LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LOG_FIELDS, extrasaction="ignore")
        if new:
            w.writeheader()
        w.writerows(rows)


def _access_token() -> str | None:
    """Refresh the Workspace token, mirroring scripts/send-email.py."""
    try:
        creds = json.loads(TOKEN_PATH.read_text())
        data = urllib.parse.urlencode({
            "client_id": creds["client_id"],
            "client_secret": creds["client_secret"],
            "refresh_token": creds["refresh_token"],
            "grant_type": "refresh_token",
        }).encode()
        req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
        with urllib.request.urlopen(req, timeout=45) as r:
            return json.loads(r.read())["access_token"]
    except Exception:
        return None


def thread_has_reply(thread_id: str, token: str | None) -> bool:
    """True when someone other than us has written in this thread."""
    if not thread_id or not token:
        return False
    try:
        url = (f"https://gmail.googleapis.com/gmail/v1/users/{SENDER}"
               f"/threads/{thread_id}?format=metadata")
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req, timeout=30) as r:
            thread = json.loads(r.read())
    except Exception:
        return False
    for m in thread.get("messages", []):
        if "SENT" not in (m.get("labelIds") or []):
            return True
    return False


# ---------------------------------------------------------------- sending


def send_one(to: str, subject: str, body: str, *,
             in_reply_to: str = "", thread_id: str = "") -> dict | None:
    cmd = [sys.executable, "scripts/send-email.py", "--to", to,
           "--subject", subject, "--body", body, "--json"]
    if in_reply_to:
        cmd += ["--in-reply-to", in_reply_to, "--references", in_reply_to]
    if thread_id:
        cmd += ["--thread-id", thread_id]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"    FAILED: {proc.stderr.strip()[:180]}")
        return None
    try:
        return json.loads(proc.stdout.strip().splitlines()[-1])
    except Exception:
        print(f"    unparseable response: {proc.stdout[:120]}")
        return None


def stats() -> None:
    log = load_log()
    if not log:
        print("no sends yet")
        return
    print(f"total messages sent: {len(log)}")
    by_touch: dict[int, int] = {}
    for r in log:
        by_touch[r["touch"]] = by_touch.get(r["touch"], 0) + 1
    for t in sorted(by_touch):
        print(f"   touch {t}: {by_touch[t]}")
    print(f"unique contacts: {len({r['email'] for r in log})}")
    days: dict[str, int] = {}
    for r in log:
        days[r["sent_at"][:10]] = days.get(r["sent_at"][:10], 0) + 1
    print("by day:")
    for d in sorted(days):
        print(f"   {d}: {days[d]}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--angle", default="auto", choices=["auto", "noc", "has"])
    ap.add_argument("--touch", type=int, default=0, help="force a specific touch")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--cap", type=int, default=15, help="max NEW contacts per day")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--stats", action="store_true")
    ap.add_argument("--no-reply-check", action="store_true")
    args = ap.parse_args()

    if args.stats:
        stats()
        return 0

    rows = load_rows()
    log = load_log()
    today = datetime.date.today()

    # Latest touch + thread state per address.
    state: dict[str, dict] = {}
    for r in log:
        e = r["email"].lower()
        cur = state.get(e)
        if not cur or r["touch"] >= cur["touch"]:
            state[e] = {
                "touch": r["touch"],
                "at": r["sent_at"][:10],
                "thread_id": r.get("thread_id") or "",
                "message_id": r.get("message_id") or "",
                "subject": r.get("subject") or "",
            }

    new_today = sum(1 for r in log
                    if r["sent_at"][:10] == today.isoformat() and r["touch"] == 1)
    new_budget = max(0, args.cap - new_today)

    queue: list[tuple[dict, int, dict | None]] = []
    for row in rows:
        if any(h in row["domain"] for h in SKIP_DOMAIN_HINTS):
            continue
        st = state.get(row["email"].lower())
        if st is None:
            if args.touch and args.touch != 1:
                continue
            queue.append((row, 1, None))
        else:
            if st["touch"] >= 4:
                continue
            nxt = st["touch"] + 1
            if args.touch and nxt != args.touch:
                continue
            try:
                sent_on = datetime.date.fromisoformat(st["at"])
            except ValueError:
                continue
            if (today - sent_on).days < GAP_DAYS.get(nxt, 4):
                continue
            queue.append((row, nxt, st))

    initial = [q for q in queue if q[1] == 1][:new_budget]
    followup = [q for q in queue if q[1] > 1]
    queue = initial + followup
    if args.limit:
        queue = queue[: args.limit]

    print(f"prospects: {len(rows)} | contacts touched: {len(state)} | "
          f"new today: {new_today}/{args.cap} | due now: {len(queue)}\n")

    if not queue:
        print("nothing due. Use --stats for the running tally.")
        return 0

    token = None if (args.dry_run or args.no_reply_check) else _access_token()
    sent: list[dict] = []

    for i, (row, touch, st) in enumerate(queue, 1):
        angle = angle_for(row, args.angle)
        subject, body = render(row, touch, angle)

        # Never chase somebody who already replied.
        if st and thread_has_reply(st["thread_id"], token):
            print(f"[{i}/{len(queue)}] {row['domain'][:40]:40} SKIP — replied")
            continue

        in_reply_to = st["message_id"] if st else ""
        thread_id = st["thread_id"] if st else ""
        if st and st["subject"]:
            subject = st["subject"]  # keep the thread subject so it groups

        print(f"[{i}/{len(queue)}] {row['domain'][:40]:40} <{row['email']}>  "
              f"[touch {touch} {angle}]")

        if args.dry_run:
            print(f"    SUBJECT: {subject}")
            for line in body.splitlines():
                print(f"    | {line}")
            print()
            continue

        res = send_one(row["email"], subject, body,
                       in_reply_to=in_reply_to, thread_id=thread_id)
        if res:
            print(f"    sent id={res.get('id')}")
            sent.append({
                "sent_at": datetime.datetime.now().isoformat(timespec="seconds"),
                "email": row["email"],
                "domain": row["domain"],
                "touch": touch,
                "angle": angle,
                "subject": subject,
                "message_id": res.get("message_id") or in_reply_to,
                "thread_id": res.get("threadId") or thread_id,
            })
            if i < len(queue):
                time.sleep(random.uniform(45, 150))
        else:
            time.sleep(5)

    if sent:
        append_log(sent)
        print(f"\nsent {len(sent)} -> logged to {LOG}")
    print("dry run complete" if args.dry_run else "run complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
