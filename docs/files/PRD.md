# PRD.md — Signal (working title)
### AI-Powered Automated Content Intelligence Platform

> Working name **Signal** is used throughout this doc set (it ties to the design system in `design.md`). Rename freely — search-replace "Signal" wherever you land on a real name/domain.

---

## 1. Vision

Signal turns public trend and news signal into original, attributed, multi-format content — web articles, video scripts, and social posts — across seven verticals, with a human able to sit anywhere on the spectrum from "review everything" to "fully hands-off," per category.

It is not a scraper. Every published piece must add explanation, context, and a "why this matters" layer a copy-paste rewrite doesn't have. The differentiator isn't the AI — every competitor has AI. The differentiator is **source discipline**: every article traces back to the facts that support it, and the reader can see that trail.

## 2. Why this version is different from the original brief

The two source documents you provided are strong on infrastructure and weak on defensibility — a stack any competent developer could copy in a weekend, with no moat besides speed of building. Three changes make this a genuinely different product, not another AI content farm:

1. **A visible confidence layer.** Every article shows a source-corroboration indicator (how many independent sources confirm this, not just one press release rephrased). This is the fact-extraction system you specified in the original brief, surfaced to the reader instead of hidden in the pipeline. It's also the single most defensible, portfolio-worthy piece of engineering in the whole project.
2. **A public "how this was made" trail per article.** Sources, extraction confidence, and generation timestamp, linked from every article footer. This is a transparency feature competitors don't bother with, and it directly defuses the "is this just AI slop" objection from readers, Google's Helpful Content system, and potential employers reviewing your portfolio.
3. **A reading-depth toggle** ("Explain it simply" / "Full detail") on every article, generated once alongside the main piece, not as a second AI call. Cheap to build, meaningfully better UX than any of your likely competitors.

### Risks the original brief underweighted — read this before building

| Risk | Reality | Mitigation built into this PRD |
|---|---|---|
| **Copyright / republication** | Rewriting facts from other outlets is legal; mirroring their structure, quotes, or "protected expression" is not, regardless of how "transformative" the prompt claims to be. | Fact-extraction stage stores only atomic facts + short attributed quotes (<25 words, one per source), never full paragraphs. Article generator is instructed to work from the facts table, never from raw source text. |
| **SEO reality** | A brand-new domain will not rank for `ai tools 2025` against TechCrunch in month one, or month six. The original revenue table assumes ranking speed that doesn't happen for new sites. | Target long-tail/explainer intent from day one ("what does X mean for remote developers"), not head-term news competition. Revenue table in this PRD is relabeled as illustrative, not a plan. |
| **Free-tier fragility** | Both Groq and Gemini cut or reshaped their free tiers within the last year (Gemini dropped Pro from the free tier entirely in April 2026; Groq's 70B-class daily caps are far lower than the ~14k/day figure in your source doc — that figure only holds for the 8B model). | Architecture (see `architecture.md`) treats free-tier AI as **the current cheapest option**, not a permanent assumption — provider abstraction + a documented $ trigger point for when to add a paid key. |
| **Quality-at-scale with 7 categories from day one** | Auto-publishing across seven verticals with no history means the first bad article (a wrong stat, a fabricated quote) can land in any of them before you've built trust in your own pipeline. | Every category ships with a **publish mode toggle** (auto / review queue), defaulting to review queue for the two highest-risk categories (Celebrity, Markets) until you've manually verified enough output to trust auto mode. |
| **Monetization optimism** | The $1,200/mo "realistic" month-6 projection in your source doc assumes traffic and ad approval timelines that are not typical. | Monetization roadmap here keeps the same phased structure but strips guaranteed-sounding numbers; see §10. |

## 3. Target users

- **Reader** — someone who wants the news explained, not just reported; skims categories they care about, occasionally goes deep on one story.
- **Operator (you)** — runs the admin dashboard, approves/rejects queued content, tunes prompts and sources, watches the automation monitor. This is also the primary "user" the portfolio story is written for: a German-market backend/AI-integration hiring manager evaluating your system design.

## 4. Categories (all seven, launch day)

AI & Technology · Jobs & Careers · Markets · Sports · Celebrity · Movies · Anime — as scoped in the source brief. Architecture must make adding an 8th trivial (a config row, not a code change) — see `architecture.md` §4.

## 5. Core user flows

**Reader flow:** Home (live signal strip + featured + category rails) → Category page → Article page (with confidence badge, sources trail, reading-depth toggle, related articles) → optional newsletter signup.

**Operator flow:** Dashboard overview → Event Clusters (review what's been discovered) → AI Studio (trigger generation for an approved cluster) → Review Queue *or* watch it auto-publish, depending on that category's toggle → Automation Monitor (retry failures, watch quota usage) → Analytics (what's actually getting read).

**Pipeline flow (automated):** Cron trigger → ingest sources → normalize → dedupe against existing `source_url`s → cluster into events → extract facts → AI-generate article + SEO + scripts → quality/risk score → route by category's publish mode → publish or queue → generate social/video assets → log everything to `scraper_logs`.

## 6. MVP scope

### Must have (v1 launch)
- Public site: home, all 7 category pages, article page, search, trending page
- Full automation pipeline running end-to-end on a schedule, all 7 categories configured with real source feeds
- Admin dashboard: overview, event clusters, AI Studio, article editor, review queue, automation monitor
- Per-category **publish-mode toggle** (auto ↔ review), defaulting Celebrity and Markets to review
- Confidence badge + sources trail on every article
- SEO fundamentals: sitemap, NewsArticle/Article schema, OG tags, canonical URLs
- Single-admin auth (this is a solo-operator tool, not multi-tenant)
- Newsletter capture (storage only — no send pipeline yet)

### Should have (fast-follow, weeks 11–16)
- YouTube Shorts / Reels script generation per article
- Instagram caption generation
- Internal linking recommendations
- Content quality/risk scoring gate before auto-publish
- Analytics dashboard (what's read, what converts)
- Affiliate link injection per category

### Future (post-MVP)
- Automated TTS + video assembly pipeline
- Trend-prediction feedback loop (learn what performs, reprioritize topics)
- Newsletter send automation
- Premium membership / paywalled deep-dives
- Multi-author roles (if this ever stops being solo-operator)

### Explicitly out of scope for v1
- Multi-tenant / multi-site support
- Native mobile app
- Real-time push notifications
- Comment system

## 7. Success metrics (v1, first 90 days)

These are process metrics, not the revenue table from your source doc — revenue depends on traffic and ad approval, which you don't control on a 90-day horizon.

- Pipeline runs successfully end-to-end, unattended, for 7 consecutive days
- ≥90% of auto-published articles pass manual spot-check for factual accuracy (sampled weekly)
- Zero DMCA/takedown notices
- Google Search Console: site indexed, zero manual-action penalties
- Admin can approve/reject a queued article in under 60 seconds

## 8. Legal / compliance requirements

- Every article states its sources; no article publishes without at least one source URL on record.
- A visible "About this content" / disclosure page explains the AI-assisted generation process — don't hide this; it's better for trust and for Google's content-quality signals than pretending otherwise.
- Respect `robots.txt` and each source's terms of use; prefer RSS/official APIs over scraping HTML, per the original brief's own rule — this PRD keeps that rule.
- Celebrity/Markets content requires the review-queue toggle until you have a track record; Markets copy must carry a "not financial advice" line, always.
- Affiliate links (Phase 5+) are disclosed per FTC-style guidance, clearly and near the link, not buried in a footer.

## 9. Differentiation summary (why a reader picks this over TechCrunch/Reddit)

1. Explains *why it matters*, not just *what happened* — every article ends with a plain-language stakes section.
2. Shows its work — sources and confidence, not just a byline.
3. Reading-depth toggle meets both the skimmer and the person who wants the full story.
4. Cross-category — one place for AI news and anime news and market news, useful for the same reason a good aggregator newsletter is useful.

## 10. Monetization roadmap (illustrative, not a forecast)

Same phased structure as your source doc — affiliate links early, AdSense once you clear ~25 quality articles and real traffic, Ezoic/Mediavine once traffic clears their thresholds, sponsorships once you have a niche audience worth sponsoring. Treat every dollar figure in the original doc's table as "what's possible if things go well," not a plan you're behind schedule on if you miss it.

## 11. Open questions to revisit after Phase 1

- Final product name and domain
- Whether Celebrity is worth the legal exposure relative to its traffic value — revisit after 60 days of data
- Whether to keep Jobs as a content category or spin it into its own product (job board monetization in your source doc's Phase 5 is a genuinely separate business)
