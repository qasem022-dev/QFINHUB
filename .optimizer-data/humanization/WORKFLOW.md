# Humanization Workflow for QFINHUB Content

**Last validated:** 2026-07-11  
**Skills used:** `humanize` (rewriting rules), `ai-check` (forensic scoring)

---

## When to Apply

Apply to **every** new content piece before commit:

- Calculator page explanations / FAQ / "Why this matters" sections
- Blog posts
- Comparison pages (`/compare/*`)
- Decision pages (`/decision/*`)
- Marketing copy / landing pages

Skip for: data pages (numbers, no prose), pure calculators (no copy), code.

---

## 4-Step Pre-Commit Workflow

### Step 1: Draft

Write the content however comes naturally. Don't try to humanize while drafting — that's the expensive failure mode. Get the substance down.

### Step 2: Self-Score

Run `skill_view(name='ai-check')` and score your draft against the 9 signals.

Use this simplified rubric for speed:

| Signal | Watch for | Auto-flag rule |
|---|---|---|
| A. Perplexity | "designed to help", "indispensable", "vital role" | Any instance = +1 |
| B. Burstiness | All sentences 14-18 words | Range < 15 = +1 |
| C. Hedge density | "can be", "typically", "generally" | 3+ in 200 words = +1 |
| D. Structure | Numbered "Key Takeaways", "In conclusion" | Either present = +1 |
| E. Specificity | "many users", "various scenarios", no numbers | 0 numbers in 200 words = +1 |
| F. Transitions | "Furthermore", "Moreover", "Why This Matters:" | Any instance = +1 |
| G. Punctuation | 2+ em dashes, any semicolon | Either = +1 |
| H. Voice | Zero "I" in personal-finance content | = +1 |
| I. Scaffolding | "It's not X, it's Y", mini-aphorism closer | Either present = +1 |

**If total > 4**: rewrite before commit.

### Step 3: Rewrite Protocol

Run `skill_view(name='humanize')` and apply ALL 9 levers in single-pass rebuild:

1. **Perplexity** — swap generic verbs for domain-specific ("address" → "untangle")
2. **Burstiness** — must include ≥1 ≤6-word fragment + ≥1 ≥25-word sentence per paragraph
3. **Hedge surgery** — delete "it is important to note", "generally", "typically"
4. **Structural flattening** — convert numbered lists to prose flow
5. **Specificity** — every abstract claim needs 2026 $ amount, named source, exact number
6. **Voice** — first-person "I built this because...", contractions ("don't"), rhetorical questions
7. **Discourse** — replace "Furthermore," / "Moreover," with "And" or just no transition
8. **Punctuation** — em dashes ≤1 per 300 words, no semicolons, no curly quotes
9. **RLHF strip** — remove "indispensable", "balanced tradeoff offering", "I hope this helps"

**Hard rules to enforce by literal count at the end:**

- [ ] Em dashes: ≤(word_count / 300). Write the count.
- [ ] Semicolons: 0. Write the count.
- [ ] Curly quotes: 0. Write the count.
- [ ] Banned vocab list (master in humanize SKILL): 0 hits.
- [ ] Sentence-length spread: longest - shortest ≥ 20. Write min/max.
- [ ] Mid-band cap: <50% in 10-to-20 word band.

### Step 4: Re-Score

Re-run `skill_view(name='ai-check')` mentally against the rewrite. Confirm:

- Overall score ≤ 6/27 (Human or Likely Human)
- Voice signal (H) = 0 or 1 (one first-person break suffices)
- Punctuation signal (G) = 0 or 1

If still > 6, run one more iteration. **Max 2 iterations total** — past that you over-edit into choppy prose.

---

## Demonstrated Reference

**Source:** `/home/admin1/qfinhub/.optimizer-data/humanization/loan-calculator-before-after.md`

A real published QFINHUB explanation (385 words, score 14/27) was rewritten to a 225-word humanized version (score 5/27). All 9 signals dropped except for one residual mini-aphorism.

---

## QFINHUB-Specific Calibration

The `humanize` skill's default bias is terse, direct prose. For QFINHUB:

- **Keep finance domain terms** like "amortization", "principal", "APR", "PITI" — the skill says "domain-native vocabulary", these are it.
- **Use 2026 dollar figures** in every example — the skill's Lever 5 (specificity) demands it.
- **Include a first-person "I built this..." moment** in each calculator page footer — Levers 6 (voice) explicit signal.
- **Reference authoritative sources** (IRS, Federal Reserve, BLS, Fannie Mae) by name — Lever 5 specificity.
- **Cite "as of [year/quarter]"** dates for any rate/example claim.
