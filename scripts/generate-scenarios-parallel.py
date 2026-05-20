#!/usr/bin/env python3
"""
QFINHUB Mega Programmatic Page Generator — PARALLEL VERSION
Generates 500+ high-quality scenario pages per day using concurrent API calls.
~3-4x faster than sequential version.
"""
import json, os, sys, time, math, hashlib, itertools, random, argparse
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request, urllib.error, traceback

PROJECT_ROOT = Path("/home/admin1/qfinhub")
DATA_DIR = PROJECT_ROOT / "public" / "data" / "scenarios"
STATE_FILE = Path("/home/admin1/.hermes/state/scenario-generator-state.json")
LOG_FILE = Path("/home/admin1/.hermes/logs/scenario-generator.log")

def _load_env():
    env_path = PROJECT_ROOT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ[key.strip()] = val.strip().strip('"').strip("'")
_load_env()

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-v4-flash"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

CALCULATOR_GRIDS = {
    "mortgage-calculator": {
        "name": "Mortgage Calculator", "category": "mortgage", "priority": 10,
        "params": {
            "homePrice": [100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 750000, 1000000],
            "downPct": [3, 5, 10, 15, 20, 25, 30],
            "rate": [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0],
            "term": [10, 15, 20, 30, 40],
        },
    },
    "compound-interest": {
        "name": "Compound Interest Calculator", "category": "investing", "priority": 9,
        "params": {
            "principal": [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
            "monthly": [0, 100, 250, 500, 1000, 2000],
            "rate": [3, 4, 5, 6, 7, 8, 9, 10],
            "years": [5, 10, 15, 20, 25, 30, 40],
        },
    },
    "retirement-planning": {
        "name": "Retirement Calculator", "category": "retirement", "priority": 8,
        "params": {
            "currentAge": [25, 30, 35, 40, 45, 50, 55],
            "retireAge": [60, 62, 65, 67, 70],
            "currentSavings": [0, 10000, 50000, 100000, 250000, 500000],
            "monthlyContribution": [100, 250, 500, 1000, 2000, 5000],
            "annualReturn": [4, 5, 6, 7, 8],
            "desiredIncome": [30000, 50000, 75000, 100000, 150000],
        },
    },
    "401k-calculator": {
        "name": "401k Calculator", "category": "retirement", "priority": 8,
        "params": {
            "salary": [30000, 50000, 75000, 100000, 150000, 200000],
            "contributionPct": [3, 5, 6, 10, 15, 20],
            "employerMatch": [50, 100],
            "matchLimit": [3, 4, 5, 6],
            "years": [10, 20, 30],
            "annualReturn": [5, 6, 7, 8],
        },
    },
    "auto-loan": {
        "name": "Auto Loan Calculator", "category": "auto", "priority": 7,
        "params": {
            "loanAmount": [15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000],
            "rate": [3, 4, 5, 6, 7, 8, 9],
            "term": [36, 48, 60, 72, 84],
        },
    },
    "debt-payoff": {
        "name": "Debt Payoff Calculator", "category": "debt", "priority": 6,
        "params": {
            "balance": [1000, 5000, 10000, 15000, 25000, 50000, 100000],
            "rate": [12, 15, 18, 20, 22, 25, 28, 30],
            "monthlyPayment": [50, 100, 200, 300, 500, 1000],
        },
    },
    "savings-goal": {
        "name": "Savings Goal Calculator", "category": "savings", "priority": 5,
        "params": {
            "goal": [5000, 10000, 25000, 50000, 100000, 250000, 500000],
            "currentSavings": [0, 1000, 5000, 10000],
            "monthlyContribution": [100, 250, 500, 1000, 2000],
            "annualReturn": [1, 2, 3, 4, 5, 6],
        },
    },
    "budget-planner": {
        "name": "Budget Calculator", "category": "budgeting", "priority": 5,
        "params": {
            "monthlyIncome": [2500, 3500, 5000, 7500, 10000, 15000, 20000],
            "scenario": ["single", "family-4", "couple", "student", "retiree"],
        },
    },
}

LOG_MUTEX = __import__('threading').Lock()

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    with LOG_MUTEX:
        print(line, flush=True)
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")

def load_state():
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"generated_slugs": [], "total_generated": 0, "calculator_progress": {}, "last_run": None}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))

def generate_slug(calc_type, params, index):
    parts = [calc_type.replace("-calculator", "")]
    if calc_type == "mortgage-calculator":
        price = int(params.get("homePrice", 0))
        rate = params.get("rate", 0)
        term = int(params.get("term", 0))
        down = int(params.get("downPct", 20))
        if down != 20:
            parts.append(f"{price//1000}k-{down}dp-{term}yr-{rate}pct")
        else:
            parts.append(f"{price//1000}k-{term}yr-{rate}pct")
    elif calc_type == "compound-interest":
        principal = int(params.get("principal", 0))
        rate = params.get("rate", 0)
        years = int(params.get("years", 0))
        monthly = int(params.get("monthly", 0))
        parts.append(f"${principal}-{rate}pct-{years}yr")
        if monthly > 0:
            parts.append(f"m{monthly}")
    elif calc_type == "401k-calculator":
        salary = int(params.get("salary", 0))
        contrib = int(params.get("contributionPct", 0))
        years = int(params.get("years", 0))
        parts.append(f"${salary}-{contrib}pct-{years}yr")
    else:
        param_str = json.dumps(params, sort_keys=True)
        slug_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
        parts.append(slug_hash)
    slug = "-".join(parts).replace("$", "").replace(".", "-").replace("_", "-").lower()
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")

def compute_values(calc_type, params):
    result = {}
    if calc_type == "mortgage-calculator":
        home_price = params.get("homePrice", 300000)
        down_pct = params.get("downPct", 20)
        rate = params.get("rate", 6.5)
        term = params.get("term", 30)
        down_payment = home_price * (down_pct / 100)
        loan_amount = home_price - down_payment
        monthly_rate = rate / 100 / 12
        num_payments = term * 12
        if monthly_rate > 0:
            monthly_pi = loan_amount * monthly_rate * (1 + monthly_rate)**num_payments / ((1 + monthly_rate)**num_payments - 1)
        else:
            monthly_pi = loan_amount / num_payments
        total_paid = monthly_pi * num_payments
        total_interest = total_paid - loan_amount
        result = {"homePrice": home_price, "downPayment": round(down_payment, 2), "downPaymentPct": down_pct, "loanAmount": round(loan_amount, 2), "interestRate": rate, "termYears": term, "monthlyPI": round(monthly_pi, 2), "totalPaid": round(total_paid, 2), "totalInterest": round(total_interest, 2), "payoffDate": f"{(datetime.now().year + term)}"}
    elif calc_type == "compound-interest":
        principal = params.get("principal", 10000)
        monthly = params.get("monthly", 0)
        rate = params.get("rate", 7)
        years = params.get("years", 20)
        annual_rate = rate / 100
        n = 12
        if annual_rate > 0:
            fv_principal = principal * (1 + annual_rate/n)**(n*years)
            fv_contributions = monthly * ((1 + annual_rate/n)**(n*years) - 1) / (annual_rate/n) if monthly > 0 else 0
        else:
            fv_principal = principal
            fv_contributions = monthly * 12 * years
        total_fv = fv_principal + fv_contributions
        total_contributions = principal + monthly * 12 * years
        total_earnings = total_fv - total_contributions
        result = {"principal": principal, "monthlyContribution": monthly, "annualRate": rate, "years": years, "compoundingFrequency": "Monthly", "futureValue": round(total_fv, 2), "totalContributions": round(total_contributions, 2), "totalEarnings": round(total_earnings, 2), "earningsPct": round(total_earnings / total_contributions * 100, 1) if total_contributions > 0 else 0, "ruleOf72Years": round(72 / rate, 1) if rate > 0 else None}
    elif calc_type == "retirement-planning":
        current_age = params.get("currentAge", 30); retire_age = params.get("retireAge", 65); current_savings = params.get("currentSavings", 50000); monthly_contrib = params.get("monthlyContribution", 500); annual_return = params.get("annualReturn", 7); desired_income = params.get("desiredIncome", 50000)
        years_to_retire = retire_age - current_age; annual_rate = annual_return / 100
        if annual_rate > 0:
            fv = current_savings * (1 + annual_rate)**years_to_retire + monthly_contrib * 12 * ((1 + annual_rate)**years_to_retire - 1) / annual_rate
        else:
            fv = current_savings + monthly_contrib * 12 * years_to_retire
        sustainable = fv * 0.04
        result = {"currentAge": current_age, "retireAge": retire_age, "yearsToRetire": years_to_retire, "currentSavings": current_savings, "monthlyContribution": monthly_contrib, "annualReturn": annual_return, "retirementSavings": round(fv, 2), "desiredIncome": desired_income, "sustainableIncome4Pct": round(sustainable, 2), "incomeGap": round(desired_income - sustainable, 2), "onTrack": desired_income <= sustainable}
    elif calc_type == "401k-calculator":
        salary = params.get("salary", 75000); contrib_pct = params.get("contributionPct", 6); employer_match_pct = params.get("employerMatch", 50); match_limit_pct = params.get("matchLimit", 6); years = params.get("years", 20); annual_return = params.get("annualReturn", 7)
        employee_contrib = salary * (contrib_pct / 100); matched_pct = min(contrib_pct, match_limit_pct); employer_contrib = salary * (matched_pct / 100) * (employer_match_pct / 100); total_annual = employee_contrib + employer_contrib
        annual_rate = annual_return / 100
        fv = total_annual * ((1 + annual_rate)**years - 1) / annual_rate if annual_rate > 0 else total_annual * years
        result = {"salary": salary, "contributionPct": contrib_pct, "employeeContribution": round(employee_contrib, 2), "employerMatch": round(employer_contrib, 2), "totalAnnualContribution": round(total_annual, 2), "years": years, "annualReturn": annual_return, "futureValue": round(fv, 2), "totalEmployeeContributions": round(employee_contrib * years, 2), "totalEmployerContributions": round(employer_contrib * years, 2), "freeMoney": round(employer_contrib * years, 2)}
    elif calc_type == "auto-loan":
        loan_amount = params.get("loanAmount", 30000); rate = params.get("rate", 6); term = params.get("term", 60)
        monthly_rate = rate / 100 / 12
        monthly_payment = loan_amount * monthly_rate * (1 + monthly_rate)**term / ((1 + monthly_rate)**term - 1) if monthly_rate > 0 else loan_amount / term
        total_paid = monthly_payment * term; total_interest = total_paid - loan_amount
        result = {"loanAmount": loan_amount, "interestRate": rate, "termMonths": term, "monthlyPayment": round(monthly_payment, 2), "totalPaid": round(total_paid, 2), "totalInterest": round(total_interest, 2), "interestPct": round(total_interest / loan_amount * 100, 1)}
    elif calc_type == "debt-payoff":
        balance = params.get("balance", 10000); rate = params.get("rate", 18); monthly_payment = params.get("monthlyPayment", 200)
        monthly_rate = rate / 100 / 12
        if monthly_rate > 0 and monthly_payment > balance * monthly_rate:
            n = -math.log(1 - balance * monthly_rate / monthly_payment) / math.log(1 + monthly_rate)
        else:
            n = balance / monthly_payment
        total_paid = monthly_payment * n; total_interest = total_paid - balance
        result = {"balance": balance, "interestRate": rate, "monthlyPayment": monthly_payment, "monthsToPayoff": round(n, 1), "yearsToPayoff": round(n / 12, 1), "totalPaid": round(total_paid, 2), "totalInterest": round(total_interest, 2), "payoffDate": datetime.now().strftime("%B %Y") if n < 1 else f"{(datetime.now().year + int(n/12))}"}
    elif calc_type == "savings-goal":
        goal = params.get("goal", 50000); current = params.get("currentSavings", 0); monthly = params.get("monthlyContribution", 500); annual_return = params.get("annualReturn", 4)
        annual_rate = annual_return / 100; monthly_rate = annual_rate / 12
        if monthly_rate > 0 and monthly > 0:
            remaining = goal - current
            months = math.log(1 + remaining * monthly_rate / monthly) / math.log(1 + monthly_rate) if remaining > 0 else 0
        elif monthly > 0:
            months = (goal - current) / monthly
        else:
            months = float('inf')
        result = {"goal": goal, "currentSavings": current, "monthlyContribution": monthly, "annualReturn": annual_return, "monthsToGoal": round(months, 1) if months != float('inf') else "Never", "yearsToGoal": round(months / 12, 1) if months != float('inf') and months is not None else "Never"}
    elif calc_type == "budget-planner":
        income = params.get("monthlyIncome", 5000); scenario = params.get("scenario", "single")
        budgets = {"single": {"housing": 0.30, "food": 0.12, "transport": 0.10, "savings": 0.20, "utilities": 0.08, "entertainment": 0.10, "misc": 0.10}, "couple": {"housing": 0.28, "food": 0.14, "transport": 0.10, "savings": 0.15, "utilities": 0.07, "entertainment": 0.12, "misc": 0.14}, "family-4": {"housing": 0.30, "food": 0.16, "transport": 0.12, "savings": 0.10, "utilities": 0.08, "childcare": 0.14, "misc": 0.10}, "student": {"housing": 0.25, "food": 0.12, "transport": 0.08, "savings": 0.10, "utilities": 0.07, "education": 0.20, "misc": 0.18}, "retiree": {"housing": 0.25, "food": 0.12, "healthcare": 0.15, "savings": 0.05, "utilities": 0.10, "entertainment": 0.15, "misc": 0.18}}
        budget = budgets.get(scenario, budgets["single"])
        result = {"monthlyIncome": income, "scenario": scenario, "annualIncome": income * 12}
        for cat, pct in budget.items():
            result[cat] = round(income * pct, 2); result[f"{cat}Pct"] = round(pct * 100, 0)
    return result

def build_prompt(calc_config, params, computed):
    calc_name = calc_config["name"]
    return f"""You are a financial content writer for QFINHUB.com. Write a comprehensive educational guide for this specific scenario page. Output valid JSON ONLY, no markdown fences.

CALCULATOR: {calc_name}
PARAMETERS: {json.dumps(params)}
COMPUTED RESULTS: {json.dumps(computed)}

Generate a JSON object with these fields (use HTML tags, not markdown):
{{
  "title": "SEO title (50-60 chars) with specific numbers",
  "metaDescription": "Meta description (140-155 chars) with key numbers",
  "h1": "H1 heading specific to this scenario",
  "intro": "3-4 sentence intro using <p> tags with specific numbers",
  "resultsSummary": "2-3 paragraphs <p> tags explaining results with computed numbers",
  "keyFactors": "<ul><li>...</li></ul> with 4-6 specific factors",
  "comparison": "2 paragraphs comparing this scenario to alternatives with numbers",
  "tips": "<ol><li>...</li></ol> with 3-5 actionable tips",
  "faqs": [{{"question": "Q", "answer": "A using <p> tags"}}] x 4,
  "disclaimer": "Educational estimate only — not financial advice."
}}

RULES: Be specific with numbers. Natural tone, no AI buzzwords. 800-1200 words total. Return ONLY valid JSON."""

def call_deepseek(prompt):
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": "You are a financial content writer. Output ONLY valid JSON — no markdown fences, no explanations."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 8192,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(DEEPSEEK_URL, data=data, headers={
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            text = result["choices"][0]["message"]["content"]
            return clean_json(text)
    except Exception as e:
        return None

def clean_json(text):
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:]) if len(lines) > 1 else text[3:]
    if text.endswith("```"):
        text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end+1])
        except json.JSONDecodeError:
            pass
    return None

def generate_one_page(calc_type, calc_config, params):
    """Generate a single scenario page (called in parallel)."""
    try:
        computed = compute_values(calc_type, params)
        slug = generate_slug(calc_type, params, 0)
        prompt = build_prompt(calc_config, params, computed)
        content = call_deepseek(prompt)
        
        if not content:
            log(f"  FAILED: {slug}")
            return None
        
        page_data = {
            "slug": slug,
            "calculatorSlug": calc_type,
            "calculatorName": calc_config["name"],
            "category": calc_config["category"],
            "params": params,
            "computed": computed,
            "title": content.get("title", ""),
            "metaDescription": content.get("metaDescription", ""),
            "h1": content.get("h1", ""),
            "intro": content.get("intro", ""),
            "resultsSummary": content.get("resultsSummary", ""),
            "keyFactors": content.get("keyFactors", ""),
            "comparison": content.get("comparison", ""),
            "tips": content.get("tips", ""),
            "faqs": content.get("faqs", []),
            "disclaimer": content.get("disclaimer", "Educational estimate only — not financial advice."),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }
        log(f"  ✓ {slug}")
        return page_data
    except Exception as e:
        log(f"  ERROR: {e}")
        return None

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=750)
    parser.add_argument("--workers", type=int, default=10)
    args = parser.parse_args()
    
    log("=" * 60)
    log(f"PARALLEL SCENARIO GENERATION: target={args.count}, workers={args.workers}")
    
    state = load_state()
    generated_slugs = set(state.get("generated_slugs", []))
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    calc_priorities = sorted(CALCULATOR_GRIDS.items(), key=lambda x: -x[1]["priority"])
    pages_needed = args.count
    all_new_pages = []
    
    for calc_type, calc_config in calc_priorities:
        if pages_needed <= 0:
            break
        
        grid = calc_config["params"]
        param_names = list(grid.keys())
        param_values = [grid[name] for name in param_names]
        all_combos = list(itertools.product(*param_values))
        random.seed(int(time.time()))
        random.shuffle(all_combos)
        
        new_combos = []
        for combo in all_combos:
            params = dict(zip(param_names, combo))
            slug = generate_slug(calc_type, params, 0)
            if slug not in generated_slugs:
                new_combos.append(params)
                if len(new_combos) >= min(pages_needed, 100):
                    break
        
        if not new_combos:
            log(f"No new combos for {calc_config['name']}")
            continue
        
        log(f"Generating {len(new_combos)} pages for {calc_config['name']} with {args.workers} workers...")
        
        # Parallel generation
        pages = []
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {executor.submit(generate_one_page, calc_type, calc_config, p): i for i, p in enumerate(new_combos)}
            for future in as_completed(futures):
                result = future.result()
                if result:
                    pages.append(result)
        
        all_new_pages.extend(pages)
        pages_needed -= len(pages)
        log(f"  {calc_config['name']}: {len(pages)} generated, {pages_needed} still needed")
    
    if not all_new_pages:
        log("No new pages generated!")
        return 0
    
    # Write batch file
    today = datetime.now().strftime("%Y-%m-%d")
    batch_filename = f"batch-{today}-{len(all_new_pages)}.json"
    batch_path = DATA_DIR / batch_filename
    
    with open(batch_path, "w") as f:
        json.dump(all_new_pages, f, indent=2)
    log(f"Written {len(all_new_pages)} pages to {batch_path}")
    
    # Update index
    index_path = DATA_DIR / "index.json"
    index = {}
    if index_path.exists():
        index = json.loads(index_path.read_text())
    
    for page in all_new_pages:
        index[page["slug"]] = {
            "batch": batch_filename,
            "title": page["title"],
            "calculatorSlug": page["calculatorSlug"],
            "category": page["category"],
        }
    
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)
    log(f"Index updated: {len(index)} total entries")
    
    # Update state
    for page in all_new_pages:
        generated_slugs.add(page["slug"])
    
    state["generated_slugs"] = list(generated_slugs)
    state["total_generated"] = len(generated_slugs)
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    state["last_batch_count"] = len(all_new_pages)
    save_state(state)
    
    # Write sitemap entries
    sitemap_path = DATA_DIR / "sitemap-entries.txt"
    with open(sitemap_path, "a") as f:
        for page in all_new_pages:
            f.write(f"https://www.qfinhub.com/scenario/{page['slug']}\n")
    log(f"Appended {len(all_new_pages)} sitemap entries")
    
    log(f"DONE: {len(all_new_pages)} new pages generated today (total: {len(generated_slugs)})")
    return len(all_new_pages)

if __name__ == "__main__":
    count = run()
    print(f"\n✓ Generated {count} scenario pages")
