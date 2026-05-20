#!/usr/bin/env python3
"""
QFINHUB Mega Programmatic Page Generator
Generates 500+ high-quality scenario pages per day.
Each page: unique content, computed values, SEO schemas, internal links.

Storage: JSON batch files in public/data/scenarios/
Route: Next.js ISR at /scenario/[id]
Schedule: Daily at 15:10 via cron
"""

import json
import os
import sys
import time
import hashlib
import math
from datetime import datetime, timezone
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────────
PROJECT_ROOT = Path("/home/admin1/qfinhub")
DATA_DIR = PROJECT_ROOT / "public" / "data" / "scenarios"
STATE_FILE = Path("/home/admin1/.hermes/state/scenario-generator-state.json")
LOG_FILE = Path("/home/admin1/.hermes/logs/scenario-generator.log")

# API Keys — loaded from .env.local
def _load_env():
    """Load environment variables from .env.local"""
    env_path = PROJECT_ROOT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key not in os.environ:
                    os.environ[key] = val

_load_env()

# Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

# Deepseek API (fallback — active)
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-v4-flash"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

# Daily target
DAILY_TARGET = 500
BATCH_SIZE = 20  # Generate 20 pages per Gemini API call

# Calculator types and their parameter grids
CALCULATOR_GRIDS = {
    "mortgage-calculator": {
        "name": "Mortgage Calculator",
        "category": "mortgage",
        "params": {
            "homePrice": [100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 750000, 1000000],
            "downPct": [3, 5, 10, 15, 20, 25, 30],
            "rate": [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0],
            "term": [10, 15, 20, 30, 40],
        },
        "compute": "mortgage",
        "priority": 10,  # Highest priority
    },
    "compound-interest": {
        "name": "Compound Interest Calculator",
        "category": "investing",
        "params": {
            "principal": [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
            "monthly": [0, 100, 250, 500, 1000, 2000],
            "rate": [3, 4, 5, 6, 7, 8, 9, 10],
            "years": [5, 10, 15, 20, 25, 30, 40],
        },
        "compute": "compound",
        "priority": 9,
    },
    "retirement-planning": {
        "name": "Retirement Calculator",
        "category": "retirement",
        "params": {
            "currentAge": [25, 30, 35, 40, 45, 50, 55],
            "retireAge": [60, 62, 65, 67, 70],
            "currentSavings": [0, 10000, 50000, 100000, 250000, 500000],
            "monthlyContribution": [100, 250, 500, 1000, 2000, 5000],
            "annualReturn": [4, 5, 6, 7, 8],
            "desiredIncome": [30000, 50000, 75000, 100000, 150000],
        },
        "compute": "retirement",
        "priority": 8,
    },
    "401k-calculator": {
        "name": "401k Calculator",
        "category": "retirement",
        "params": {
            "salary": [30000, 50000, 75000, 100000, 150000, 200000],
            "contributionPct": [3, 5, 6, 10, 15, 20],
            "employerMatch": [50, 100],
            "matchLimit": [3, 4, 5, 6],
            "years": [10, 20, 30],
            "annualReturn": [5, 6, 7, 8],
        },
        "compute": "401k",
        "priority": 8,
    },
    "auto-loan": {
        "name": "Auto Loan Calculator",
        "category": "auto",
        "params": {
            "loanAmount": [15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000],
            "rate": [3, 4, 5, 6, 7, 8, 9],
            "term": [36, 48, 60, 72, 84],
        },
        "compute": "autoloan",
        "priority": 7,
    },
    "debt-payoff": {
        "name": "Debt Payoff Calculator",
        "category": "debt",
        "params": {
            "balance": [1000, 5000, 10000, 15000, 25000, 50000, 100000],
            "rate": [12, 15, 18, 20, 22, 25, 28, 30],
            "monthlyPayment": [50, 100, 200, 300, 500, 1000],
        },
        "compute": "debt",
        "priority": 6,
    },
    "savings-goal": {
        "name": "Savings Goal Calculator",
        "category": "savings",
        "params": {
            "goal": [5000, 10000, 25000, 50000, 100000, 250000, 500000],
            "currentSavings": [0, 1000, 5000, 10000],
            "monthlyContribution": [100, 250, 500, 1000, 2000],
            "annualReturn": [1, 2, 3, 4, 5, 6],
        },
        "compute": "savings",
        "priority": 5,
    },
    "budget-planner": {
        "name": "Budget Calculator",
        "category": "budgeting",
        "params": {
            "monthlyIncome": [2500, 3500, 5000, 7500, 10000, 15000, 20000],
            "scenario": ["single", "family-4", "couple", "student", "retiree"],
        },
        "compute": "budget",
        "priority": 5,
    },
}


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def load_state():
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {
        "generated_slugs": [],
        "total_generated": 0,
        "calculator_progress": {},
        "last_run": None,
    }


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def generate_slug(calc_type, params, index):
    """Generate a unique, SEO-friendly slug for a scenario."""
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
        # Generic slug with hash
        param_str = json.dumps(params, sort_keys=True)
        slug_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
        parts.append(slug_hash)
    
    slug = "-".join(parts).replace("$", "").replace(".", "-").replace("_", "-").lower()
    # Clean up double dashes
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def compute_values(calc_type, params):
    """Pre-compute financial values for the scenario."""
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
        
        result = {
            "homePrice": home_price,
            "downPayment": round(down_payment, 2),
            "downPaymentPct": down_pct,
            "loanAmount": round(loan_amount, 2),
            "interestRate": rate,
            "termYears": term,
            "monthlyPI": round(monthly_pi, 2),
            "totalPaid": round(total_paid, 2),
            "totalInterest": round(total_interest, 2),
            "payoffDate": f"{(datetime.now().year + term)}",
        }
    
    elif calc_type == "compound-interest":
        principal = params.get("principal", 10000)
        monthly = params.get("monthly", 0)
        rate = params.get("rate", 7)
        years = params.get("years", 20)
        
        annual_rate = rate / 100
        n = 12  # monthly compounding
        
        # Future value with monthly contributions
        if annual_rate > 0:
            fv_principal = principal * (1 + annual_rate/n)**(n*years)
            if monthly > 0:
                fv_contributions = monthly * ((1 + annual_rate/n)**(n*years) - 1) / (annual_rate/n)
            else:
                fv_contributions = 0
        else:
            fv_principal = principal
            fv_contributions = monthly * 12 * years
        
        total_fv = fv_principal + fv_contributions
        total_contributions = principal + monthly * 12 * years
        total_earnings = total_fv - total_contributions
        
        result = {
            "principal": principal,
            "monthlyContribution": monthly,
            "annualRate": rate,
            "years": years,
            "compoundingFrequency": "Monthly",
            "futureValue": round(total_fv, 2),
            "totalContributions": round(total_contributions, 2),
            "totalEarnings": round(total_earnings, 2),
            "earningsPct": round(total_earnings / total_contributions * 100, 1) if total_contributions > 0 else 0,
            "ruleOf72Years": round(72 / rate, 1) if rate > 0 else None,
        }
    
    elif calc_type == "retirement-planning":
        current_age = params.get("currentAge", 30)
        retire_age = params.get("retireAge", 65)
        current_savings = params.get("currentSavings", 50000)
        monthly_contrib = params.get("monthlyContribution", 500)
        annual_return = params.get("annualReturn", 7)
        desired_income = params.get("desiredIncome", 50000)
        
        years_to_retire = retire_age - current_age
        annual_rate = annual_return / 100
        
        if annual_rate > 0:
            fv = current_savings * (1 + annual_rate)**years_to_retire
            fv += monthly_contrib * 12 * ((1 + annual_rate)**years_to_retire - 1) / annual_rate
        else:
            fv = current_savings + monthly_contrib * 12 * years_to_retire
        
        # 4% rule
        sustainable_income = fv * 0.04
        income_gap = desired_income - sustainable_income
        
        result = {
            "currentAge": current_age,
            "retireAge": retire_age,
            "yearsToRetire": years_to_retire,
            "currentSavings": current_savings,
            "monthlyContribution": monthly_contrib,
            "annualReturn": annual_return,
            "retirementSavings": round(fv, 2),
            "desiredIncome": desired_income,
            "sustainableIncome4Pct": round(sustainable_income, 2),
            "incomeGap": round(income_gap, 2),
            "onTrack": income_gap <= 0,
        }
    
    elif calc_type == "401k-calculator":
        salary = params.get("salary", 75000)
        contrib_pct = params.get("contributionPct", 6)
        employer_match_pct = params.get("employerMatch", 50)
        match_limit_pct = params.get("matchLimit", 6)
        years = params.get("years", 20)
        annual_return = params.get("annualReturn", 7)
        
        employee_contrib = salary * (contrib_pct / 100)
        matched_pct = min(contrib_pct, match_limit_pct)
        employer_contrib = salary * (matched_pct / 100) * (employer_match_pct / 100)
        total_annual = employee_contrib + employer_contrib
        
        annual_rate = annual_return / 100
        if annual_rate > 0:
            fv = total_annual * ((1 + annual_rate)**years - 1) / annual_rate
        else:
            fv = total_annual * years
        
        result = {
            "salary": salary,
            "contributionPct": contrib_pct,
            "employeeContribution": round(employee_contrib, 2),
            "employerMatch": round(employer_contrib, 2),
            "totalAnnualContribution": round(total_annual, 2),
            "years": years,
            "annualReturn": annual_return,
            "futureValue": round(fv, 2),
            "totalEmployeeContributions": round(employee_contrib * years, 2),
            "totalEmployerContributions": round(employer_contrib * years, 2),
            "freeMoney": round(employer_contrib * years, 2),
        }
    
    elif calc_type == "auto-loan":
        loan_amount = params.get("loanAmount", 30000)
        rate = params.get("rate", 6)
        term = params.get("term", 60)
        
        monthly_rate = rate / 100 / 12
        if monthly_rate > 0:
            monthly_payment = loan_amount * monthly_rate * (1 + monthly_rate)**term / ((1 + monthly_rate)**term - 1)
        else:
            monthly_payment = loan_amount / term
        
        total_paid = monthly_payment * term
        total_interest = total_paid - loan_amount
        
        result = {
            "loanAmount": loan_amount,
            "interestRate": rate,
            "termMonths": term,
            "monthlyPayment": round(monthly_payment, 2),
            "totalPaid": round(total_paid, 2),
            "totalInterest": round(total_interest, 2),
            "interestPct": round(total_interest / loan_amount * 100, 1),
        }
    
    elif calc_type == "debt-payoff":
        balance = params.get("balance", 10000)
        rate = params.get("rate", 18)
        monthly_payment = params.get("monthlyPayment", 200)
        
        monthly_rate = rate / 100 / 12
        if monthly_rate > 0 and monthly_payment > balance * monthly_rate:
            n = -math.log(1 - balance * monthly_rate / monthly_payment) / math.log(1 + monthly_rate)
        else:
            n = balance / monthly_payment
        
        total_paid = monthly_payment * n
        total_interest = total_paid - balance
        
        result = {
            "balance": balance,
            "interestRate": rate,
            "monthlyPayment": monthly_payment,
            "monthsToPayoff": round(n, 1),
            "yearsToPayoff": round(n / 12, 1),
            "totalPaid": round(total_paid, 2),
            "totalInterest": round(total_interest, 2),
            "payoffDate": datetime.now().strftime("%B %Y") if n < 1 else f"{(datetime.now().year + int(n/12))}",
        }
    
    elif calc_type == "savings-goal":
        goal = params.get("goal", 50000)
        current = params.get("currentSavings", 0)
        monthly = params.get("monthlyContribution", 500)
        annual_return = params.get("annualReturn", 4)
        
        annual_rate = annual_return / 100
        monthly_rate = annual_rate / 12
        
        if monthly_rate > 0 and monthly > 0:
            remaining = goal - current
            if remaining > 0:
                months = math.log(1 + remaining * monthly_rate / monthly) / math.log(1 + monthly_rate)
            else:
                months = 0
        elif monthly > 0:
            months = (goal - current) / monthly
        else:
            months = float('inf')
        
        result = {
            "goal": goal,
            "currentSavings": current,
            "monthlyContribution": monthly,
            "annualReturn": annual_return,
            "monthsToGoal": round(months, 1) if months != float('inf') else "Never",
            "yearsToGoal": round(months / 12, 1) if months != float('inf') and months is not None else "Never",
        }
    
    elif calc_type == "budget-planner":
        income = params.get("monthlyIncome", 5000)
        scenario = params.get("scenario", "single")
        
        budgets = {
            "single": {"housing": 0.30, "food": 0.12, "transport": 0.10, "savings": 0.20, "utilities": 0.08, "entertainment": 0.10, "misc": 0.10},
            "couple": {"housing": 0.28, "food": 0.14, "transport": 0.10, "savings": 0.15, "utilities": 0.07, "entertainment": 0.12, "misc": 0.14},
            "family-4": {"housing": 0.30, "food": 0.16, "transport": 0.12, "savings": 0.10, "utilities": 0.08, "childcare": 0.14, "misc": 0.10},
            "student": {"housing": 0.25, "food": 0.12, "transport": 0.08, "savings": 0.10, "utilities": 0.07, "education": 0.20, "misc": 0.18},
            "retiree": {"housing": 0.25, "food": 0.12, "healthcare": 0.15, "savings": 0.05, "utilities": 0.10, "entertainment": 0.15, "misc": 0.18},
        }
        
        budget = budgets.get(scenario, budgets["single"])
        result = {
            "monthlyIncome": income,
            "scenario": scenario,
            "annualIncome": income * 12,
        }
        for category, pct in budget.items():
            result[category] = round(income * pct, 2)
            result[f"{category}Pct"] = round(pct * 100, 0)
    
    return result


def build_gemini_prompt(calc_config, params, computed):
    """Build a prompt for Gemini to generate rich, unique content."""
    calc_name = calc_config["name"]
    
    prompt = f"""You are a financial content writer for QFINHUB.com — a financial calculators platform. Write a comprehensive, educational guide for this specific scenario page. Output valid JSON only, no markdown.

CALCULATOR: {calc_name}
PARAMETERS: {json.dumps(params)}
COMPUTED RESULTS: {json.dumps(computed)}

Generate a JSON object with these fields (ALL text should use HTML tags, not markdown):

{{
  "title": "SEO title (50-60 chars) — include specific numbers, e.g. '$300,000 Mortgage at 6.5% for 30 Years: Full Payment Breakdown'",
  "metaDescription": "Meta description (140-155 chars) — compelling, includes key numbers, call to action",
  "h1": "H1 heading — specific scenario, e.g. 'Your $300,000 Mortgage at 6.5%: Complete 30-Year Payment Analysis'",
  "intro": "3-4 sentence introduction using HTML <p> tags. Reference the specific numbers. Make it helpful and engaging.",
  "resultsSummary": "2-3 paragraphs using <p> tags explaining what the results mean for this specific scenario. Include the actual computed numbers.",
  "keyFactors": "HTML unordered list <ul><li>...</li></ul> with 4-6 factors that affect this specific scenario. Each <li> should be 1-2 sentences.",
  "comparison": "2 paragraphs comparing this scenario to alternatives (e.g., different rates, terms, contributions). Include specific numbers.",
  "tips": "HTML ordered list <ol><li>...</li></ol> with 3-5 actionable tips specific to this scenario.",
  "faqs": [
    {{"question": "FAQ question specific to this scenario", "answer": "Detailed 2-4 sentence answer using <p> tags"}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "disclaimer": "One-sentence YMYL disclaimer: 'This is an educational estimate only — not financial advice. Consult a qualified professional before making financial decisions.'"
}}

RULES:
- Be SPECIFIC. Reference the actual numbers from parameters and computed results.
- Write naturally — avoid AI-sounding phrases like 'delve into', 'unlock', 'game-changer'.
- Use HTML tags (<p>, <ul>, <ol>, <li>, <strong>, <em>) — NEVER use markdown.
- Content should be 800-1200 words total.
- Make it genuinely helpful for someone with these exact numbers.
- Use active voice, conversational tone.
- Include the computed monthly payment/result in the intro and results.

Return ONLY valid JSON. No markdown fences, no explanations."""
    
    return prompt


def call_llm(prompt):
    """Call LLM API for content generation. Auto-fallbacks on failure."""
    import urllib.request
    import urllib.error
    
    # Track Gemini status across calls
    if not hasattr(call_llm, "gemini_down"):
        call_llm.gemini_down = False
    
    # Try Gemini first (only if not known down)
    if GEMINI_API_KEY and not call_llm.gemini_down:
        result = call_gemini_api(prompt)
        if result:
            return result
        call_llm.gemini_down = True  # Stop trying
    
    # Fall back to Deepseek
    if DEEPSEEK_API_KEY:
        return call_deepseek_api(prompt)
    
    log("No API keys available!")
    return None


def call_gemini_api(prompt):
    """Call Gemini API."""
    import urllib.request
    import urllib.error
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.9,
            "maxOutputTokens": 4096,
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(GEMINI_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            return clean_json_response(text)
    except Exception as e:
        log(f"Gemini API error: {e}")
        return None


def call_deepseek_api(prompt):
    """Call Deepseek API."""
    import urllib.request
    import urllib.error
    
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": "You are a financial content writer. Output ONLY valid JSON — no markdown fences, no explanations before or after. Do NOT use unicode escape sequences (\\u2014, \\u2019, etc) — use the actual characters."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 8192,
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DEEPSEEK_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            text = result["choices"][0]["message"]["content"]
            return clean_json_response(text)
    except Exception as e:
        log(f"Deepseek API error: {e}")
        return None


def clean_json_response(text):
    """Clean JSON response from any API."""
    text = text.strip()
    # Remove markdown fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:]) if len(lines) > 1 else text[3:]
    if text.endswith("```"):
        text = text[:-3].strip()
    
    # Try strict parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try with control character fixes (Deepseek sometimes escapes unicode poorly)
    try:
        fixed = text.replace("\\u2014", "—").replace("\\u2013", "–").replace("\\u2019", "'").replace("\\u201c", '"').replace("\\u201d", '"')
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    # Last resort: find the outermost {...} and try to parse
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end+1])
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"Could not parse JSON response")


def generate_batch(calc_type, calc_config, params_list):
    """Generate content for a batch of scenarios."""
    results = []
    
    for i, params in enumerate(params_list):
        log(f"  Generating {i+1}/{len(params_list)} for {calc_type}...")
        
        # Compute values
        computed = compute_values(calc_type, params)
        
        # Generate slug
        slug = generate_slug(calc_type, params, i)
        
        # Generate content via LLM
        prompt = build_gemini_prompt(calc_config, params, computed)
        content = call_llm(prompt)
        
        if not content:
            log(f"  FAILED: {slug}")
            continue
        
        # Build full page data
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
            "disclaimer": content.get("disclaimer", "This is an educational estimate only — not financial advice."),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }
        
        results.append(page_data)
        log(f"  ✓ {slug}")
        
        # Small delay to avoid rate limiting
        time.sleep(0.3)
    
    return results


def generate_daily_batch():
    """Generate 500 new scenario pages."""
    log("=" * 60)
    log("STARTING DAILY SCENARIO GENERATION")
    
    state = load_state()
    generated_slugs = set(state.get("generated_slugs", []))
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Determine which calculators to generate for today
    # Distribute across calculator types by priority
    calc_priorities = sorted(CALCULATOR_GRIDS.items(), key=lambda x: -x[1]["priority"])
    
    pages_needed = DAILY_TARGET
    all_new_pages = []
    
    for calc_type, calc_config in calc_priorities:
        if pages_needed <= 0:
            break
        
        grid = calc_config["params"]
        
        # Generate parameter combinations we haven't done yet
        param_combos = []
        param_names = list(grid.keys())
        param_values = [grid[name] for name in param_names]
        
        # Simple combinatorial — try different combinations
        import itertools
        all_combos = list(itertools.product(*param_values))
        
        # Shuffle and pick new ones
        import random
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
        
        if new_combos:
            log(f"Generating {len(new_combos)} pages for {calc_config['name']}")
            pages = generate_batch(calc_type, calc_config, new_combos)
            all_new_pages.extend(pages)
            pages_needed -= len(pages)
    
    if not all_new_pages:
        log("No new pages to generate — all combinations exhausted!")
        return
    
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
    write_sitemap_entries(all_new_pages)
    
    log(f"DONE: {len(all_new_pages)} new pages generated today")
    log(f"TOTAL: {len(generated_slugs)} pages in index")
    return len(all_new_pages)


def write_sitemap_entries(pages):
    """Append new pages to the scenario sitemap file."""
    sitemap_path = PROJECT_ROOT / "public" / "data" / "scenarios" / "sitemap-entries.txt"
    
    entries = []
    for page in pages:
        entries.append(f"https://www.qfinhub.com/scenario/{page['slug']}")
    
    with open(sitemap_path, "a") as f:
        f.write("\n".join(entries) + "\n")
    
    log(f"Appended {len(entries)} sitemap entries")


def main():
    global DAILY_TARGET
    
    import argparse
    parser = argparse.ArgumentParser(description="QFINHUB Scenario Generator")
    parser.add_argument("--count", type=int, default=DAILY_TARGET, help="Number of pages to generate")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without calling API")
    args = parser.parse_args()
    
    DAILY_TARGET = args.count
    
    if args.dry_run:
        log("DRY RUN — no API calls")
        return
    
    count = generate_daily_batch()
    print(f"\n✓ Generated {count} scenario pages")


if __name__ == "__main__":
    main()
