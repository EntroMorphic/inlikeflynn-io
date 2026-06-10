# Flynn — Messaging Gap Analysis

**Website copy vs. the canonical Executive Summary**
Prepared 2026-06-09 · Source of truth: `uploads/flynn-executive-summary.md-0172edb1.pdf` (latest export, 03:01 UTC)

---

## TL;DR

The **Executive Summary is the most current, complete, and business-literate articulation of Flynn.** It is built on a clean spine: *cost-of-downtime problem → four named failure modes → the architectural inversion → customer economics → where it operates → evidence → opportunity.*

The website only partially carries that spine, and it carries it **inconsistently across pages.**

- **`why-flynn.html`** is the closest match — it tracks the summary's structure almost section-for-section, but it has **two factual slips** and leads with a different headline stat than the summary now does.
- **`index.html` (the landing page — the first thing anyone sees)** is built on an **older, engineering-first narrative.** It is missing the entire business spine: the cost-of-downtime problem, the customer economics, the market/opportunity, and the traction. It also runs a **different brand line** than the summary.
- The site as a whole has **two competing taglines, two competing headline footprint numbers, and three competing "the problem" framings** live at the same time.

**Biggest single issue:** the site can't decide whether the brand line is *"Telemetry talks. Flynn listens."* or *"Equipment talks. Flynn listens."* — both are live right now. The summary has settled it: **Equipment.**

---

## The canonical spine (from the Executive Summary)

| # | Section | Core message |
|---|---------|--------------|
| 1 | **One-liner** | "Software that lives on the chip inside your equipment… catches problems before they become failures — fully offline, in under 9 kilobytes, with zero false alarms." |
| 2 | **What Flynn is** | Compiled library on the MCU already inside the machine. Learns healthy → locks → watches. **$94,000 emergency → $800 planned swap.** Enrolls in ~2s, self-calibrating, offline, deterministic. |
| 3 | **The Problem** | **$1.4T/yr lost across the Fortune 500, up 62% since 2019** (Siemens). 58% use AI tools; 79% saw downtime flat or worse (MaintainX). Tools produce *efficiency*, fail at *detection.* |
| 4 | **Four failure modes** | (1) Alert fatigue → zero FP. (2) Adaptive-baseline drift → locked baseline, 17-day lead. (3) **Implementation barrier: $150K–$400K/facility, 6–18 mo of data, labeled faults, data-science teams** → 2s, healthy signal only, zero config. (4) Interval gap (30–40% missed) → continuous. |
| 5 | **How it's different** | Three rows that matter most: **slow faults, false alarms, time-to-first-prediction (6–18 mo → under 2s).** Plus supporting rows (where it runs, connectivity, personnel, config, cost, footprint). |
| 6 | **What changes for the customer** | $94K→$800 · self-monitoring as a BOM line · fewer techs/more coverage · bids won on capability · specified-then-respecified · warranty claims drop. |
| 7 | **Where Flynn operates** | Primary: industrial (valves/compressors/motors/pumps/actuators), 5 domains. Extended: UAV, subsea, orbit (radiation/integer-only), medical (IEC 62304). |
| 8 | **Evidence** | 98.8% precision · 0 FP / 120 h · 17-day lead (NASA IMS) · 5 domains · 8,480 B full / 2,180 B core · deterministic. |
| 9 | **Opportunity** | PdM $10.6B→$47.8B (2032); space $570B→$1.8T (2035). Licensed per-unit recurring. **8 active prospects, 6 industries.** |
| — | **Closer** | **"Equipment talks. Flynn listens."** · inlikeflynn.io · tripp@entromorphic.com |

---

## Page-by-page alignment map

| Spine element | `index.html` (landing) | `why-flynn.html` | `case-for-flynn.html` | Exec Summary |
|---|---|---|---|---|
| One-liner / definition | Partial (engineering tone) | ✅ Close match | ✅ Close match | ✅ Canonical |
| Cost-of-downtime problem ($1.4T) | ❌ Missing | ⚠️ Uses $852M/wk instead | ✅ $1.4T | ✅ $1.4T |
| Four named failure modes | ⚠️ Reframed as 4 *engineering* gaps | ✅ (2 of 4 deeply) | ✅ All four | ✅ |
| Implementation barrier ($150K–$400K) | ❌ Missing | ⚠️ Implied, no figure | ✅ Explicit | ✅ |
| Architectural inversion | ⚠️ Implicit | ✅ Explicit | ✅ Explicit | ✅ |
| Customer economics ($94K→$800) | ❌ Missing | ✅ | ✅ | ✅ |
| Customer outcomes (warranty/bids/BOM) | ❌ Missing | ✅ | ⚠️ Partial | ✅ |
| Where it operates (5 verticals) | ⚠️ Validation domains only | ✅ Constellation | ⚠️ Partial | ✅ |
| Evidence stats | ✅ (richest on site) | ✅ | ✅ | ✅ |
| Market / opportunity | ❌ Missing | ✅ | ❌ Missing | ✅ |
| Traction (8 prospects / 6 industries) | ❌ Missing | ✅ | ❌ Missing | ✅ |
| Brand line | ❌ "Telemetry talks" | ✅ "Equipment talks" | ✅ "Equipment talks" | ✅ "Equipment talks" |

Legend: ✅ aligned · ⚠️ present but divergent/incomplete · ❌ absent

---

## Gaps, by severity

### 🔴 Critical — fix before anything else

**1. The brand line is split in two.**
- *"Telemetry talks. Flynn listens."* — lives in `index.html` (H1, `<title>`, OG/Twitter), `pages/whitepaper.html` (title), `README.md`, and **every page's `og:image:alt`** + `site.webmanifest`.
- *"Equipment talks. Flynn listens."* — lives in the Exec Summary closer, `why-flynn.html`, `case-for-flynn.html`, `flynn-overview.html`, `flynn-overview-bd.html`, and both infographic drafts.
- The summary has settled on **Equipment.** Right now a visitor who lands on the home page and then opens "Why Flynn" sees the slogan *change.* Pick one (Equipment) and propagate it everywhere — including all `og:image:alt` strings and the manifest.

**2. The landing page is missing the entire business spine.**
`index.html` opens with engineering gaps (latency, no labels, no connectivity, firmware limits) and never delivers: the **$1.4T problem**, the **$94K→$800 economics**, the **market sizing**, or the **traction (8 prospects).** These are the four things a buyer/investor needs, and they're all *downstream* on `why-flynn.html` — a page most visitors never reach. The strongest commercial material is buried one click deep.

**3. Headline footprint number contradicts itself across the site.**
- `index.html`, `pages/validation.html`, `pages/roadmap.html` lead with **8,480 bytes.**
- Exec Summary + `why-flynn.html` lead with **"2,180-byte core"** / **"under 9 kilobytes."**
Both are *true* (2,180 B core, 8,480 B full system), but the site presents two different "hero numbers." Decide which is the headline (the summary's instinct: lead with the dramatic **2,180-byte core**, footnote the 8,480 B full system) and make every page tell the same story.

### 🟠 High — factual accuracy

**4. `why-flynn.html` mis-attributes the adoption stat.**
It says *"79% of maintenance teams adopted AI-powered predictive tools."* The canonical numbers are **58% adopted; 79% saw downtime flat or worse.** As written, why-flynn conflates the two — and `case-for-flynn.html` states them correctly (58% / 79% / 75% ROI), so the site disagrees with itself. Correct why-flynn to "58% adopted… 79% saw no improvement."

**5. The lead problem-stat and its source differ by page.**
- Exec Summary + `case-for-flynn.html`: **$1.4T/yr, Siemens.**
- `why-flynn.html` + `flynn-overview-bd.html`: **$852M/week, Fluke (Oct 2025).**
Both can coexist as supporting data, but the *headline* problem stat should be consistent. The summary now leads with **$1.4T (Siemens)** — align why-flynn's opener to match, or demote $852M/wk to a secondary callout.

### 🟡 Medium — under-leveraged strengths

**6. The implementation-cost barrier is the summary's sharpest wedge and the site barely uses it.**
*"$150K–$400K per facility, 6–18 months of data, labeled faults, data-science teams"* vs. *"two seconds, healthy signal only, zero config"* is the most visceral contrast in the whole pitch. It's explicit in the summary and `case-for-flynn.html`, but **absent from `index.html`** and only *implied* in `why-flynn.html`'s comparison table (no dollar figure, no "6–18 months" row).

**7. "Time to first prediction" is a top-3 differentiator in the summary, missing from the on-page tables.**
The summary elevates **"6–18 months + labeled data → under two seconds"** into its *three rows that matter most.* `why-flynn.html`'s comparison table has no time-to-prediction row at all. Add it.

**8. The "quotable version" is gold and unused verbatim.**
> "Your system watches the signal and updates its picture of normal. When a problem develops slowly, it learns to accept it. Flynn freezes its picture of normal on day one. A slow problem stays visible because Flynn refuses to move the line."

This is the clearest plain-language statement of the core idea anywhere in the corpus. It belongs on the landing page and in the OG description — currently it appears nowhere on the site.

### 🟢 Low — hygiene & sprawl

**9. Pitch-page sprawl.** `why-flynn.html`, `case-for-flynn.html`, `flynn-overview.html`, and `flynn-overview-bd.html` are four overlapping single-sheet pitches. They will drift apart with every edit (already have — see #1, #4, #5). Decide which are canonical/linked and which are archived, and consider a shared partial for the masthead + closer.

**10. Meta descriptions lag the narrative.** `index.html`'s description ("8,480 bytes. Deterministic. Bare-metal. Auditable.") is spec-led, not benefit-led — it doesn't mention catching faults, the offline angle, or zero false alarms. The summary's one-liner would convert better.

---

## Claim-consistency reference

Canonical values from the Executive Summary; ✅ = page agrees, ⚠️ = diverges, — = absent.

| Claim | Canonical | index | why-flynn | case-for |
|---|---|---|---|---|
| Brand line | Equipment talks | ⚠️ Telemetry | ✅ | ✅ |
| Footprint (hero) | 2,180 B core / 8,480 B full | ⚠️ 8,480 lead | ✅ | ✅ |
| Cost of downtime | $1.4T/yr, +62%, Siemens | — | ⚠️ $852M/wk Fluke | ✅ |
| AI adoption | 58% adopt; 79% no gain | — | ⚠️ "79% adopted" | ✅ 58/79/75 |
| Implementation cost | $150K–$400K, 6–18 mo | — | ⚠️ no figure | ✅ |
| Interval gap | 30–40% missed (McKinsey) | — | ✅ | ✅ |
| Enrollment time | ~2 s / ~1,700 samples | ✅ | ✅ | ✅ |
| Precision | 98.8% | ✅ | ✅ | ✅ |
| False positives | 0 / 120 h | ✅ | ✅ | ✅ |
| Lead time | 17 days (NASA IMS) | ✅ ~17 d | ✅ | ✅ |
| Signal domains | 5, zero config | ✅ | ✅ | ✅ |
| Economics | $94K → $800 | — | ✅ | ⚠️ partial |
| PdM market | $10.6B → $47.8B (2032) | — | ✅ | — |
| Space market | $570B → $1.8T (2035) | — | ✅ | — |
| Traction | 8 prospects, 6 industries | — | ✅ | — |
| Contact | tripp@entromorphic.com | ✅ | ✅ | ✅ |

---

## Recommended upgrade sequence

1. **Settle the brand line → "Equipment talks. Flynn listens."** Replace every "Telemetry talks" instance (index H1/title/OG, whitepaper title, README, all `og:image:alt`, manifest). *One find-and-replace pass.*
2. **Fix the two factual slips in `why-flynn.html`** (58%/79% adoption; lead with $1.4T Siemens). *Accuracy first — these are wrong, not just inconsistent.*
3. **Standardize the hero footprint number** to "2,180-byte core (8,480 B full system)" everywhere.
4. **Rebuild the landing page around the business spine** — graft on the cost-of-downtime problem, the $94K→$800 economics, the implementation-barrier contrast, the opportunity, and the traction. The home page should be able to stand alone as the pitch.
5. **Add the missing comparison rows** (implementation cost, time-to-first-prediction) and **deploy the "quotable version"** on the landing page + OG description.
6. **Resolve pitch-page sprawl** — name one canonical one-sheet, archive the rest, share a masthead/closer partial.

---

*Generated from: `index.html`, `why-flynn.html`, `case-for-flynn.html`, `flynn-overview.html`, `flynn-overview-bd.html`, `pages/*.html`, `README.md`, `site.webmanifest`, and `uploads/flynn-executive-summary.md-0172edb1.pdf`.*
