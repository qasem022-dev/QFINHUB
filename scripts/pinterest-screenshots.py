#!/usr/bin/env python3
"""
Take real screenshots of QFINHUB calculator pages for Pinterest pin images.
Uses Playwright to capture clean calculator screenshots ready for pins.

Usage: python3 scripts/pinterest-screenshots.py
"""
import sys, os, time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = PROJECT_ROOT / "public" / "pinterest-images" / "screenshots"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Top calculators to screenshot
CALCULATORS = [
    ("mortgage-calculator", "Mortgage Calculator"),
    ("compound-interest", "Compound Interest Calculator"),
    ("retirement-planning", "Retirement Calculator"),
    ("debt-payoff", "Debt Payoff Calculator"),
    ("budget-planner", "Budget Planner"),
    ("auto-loan", "Auto Loan Calculator"),
    ("loan-calculator", "Loan Calculator"),
    ("tax-calculator", "Tax Calculator"),
    ("401k-calculator", "401k Calculator"),
    ("credit-card-payoff", "Credit Card Payoff"),
    ("amortization-schedule", "Amortization Schedule"),
    ("net-worth", "Net Worth Calculator"),
    ("roth-ira", "Roth IRA Calculator"),
    ("refinance-calculator", "Refinance Calculator"),
    ("student-loan", "Student Loan Calculator"),
]

BASE_URL = "https://www.qfinhub.com/calculators"


def take_screenshots():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 800, "height": 600})

        for slug, name in CALCULATORS:
            url = f"{BASE_URL}/{slug}"
            output_path = SCREENSHOT_DIR / f"{slug}.png"

            if output_path.exists():
                print(f"  ⏭ {name} (exists)")
                continue

            try:
                print(f"  📸 {name}...", end=" ", flush=True)
                page.goto(url, wait_until="networkidle", timeout=30000)
                time.sleep(2)  # Let calculator render

                # Fill in some sample values to make it look active
                # Try to find and fill calculator inputs
                page.evaluate("""
                    // Try to fill sample values
                    const inputs = document.querySelectorAll('input[type="number"], input:not([type])');
                    const sampleValues = [300000, 6.5, 30, 1000, 50000, 7, 500, 20000, 5, 8];
                    inputs.forEach((el, i) => {
                        if (sampleValues[i] && !el.value) {
                            const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                            s.call(el, String(sampleValues[i]));
                            el.dispatchEvent(new Event('input', {bubbles: true}));
                            el.dispatchEvent(new Event('change', {bubbles: true}));
                        }
                    });
                    // Click calculate button if it exists
                    const calcBtn = document.querySelector('button') ||
                                   [...document.querySelectorAll('[role="button"]')].find(b =>
                                       b.textContent.includes('Calculate') || b.textContent.includes('Compute'));
                    if (calcBtn) calcBtn.click();
                """)
                time.sleep(1.5)

                page.screenshot(path=str(output_path), full_page=False)
                print("✅")
            except Exception as e:
                print(f"❌ {e}")

        browser.close()

    print(f"\n✅ Screenshots saved to {SCREENSHOT_DIR}")
    print(f"   Files: {len(list(SCREENSHOT_DIR.glob('*.png')))} PNGs")


if __name__ == "__main__":
    take_screenshots()
