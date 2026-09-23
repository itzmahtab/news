# rules.md — Signal

Non-negotiable rules for this project. If a phase's implementation conflicts with something here, the rule wins — fix the implementation, not the rule.

## 1. Content rules

**Always:**
- Rewrite every article in original structure and voice — never mirror a source's paragraph order or sentence structure, even loosely
- Every article carries a "why this matters" section aimed at a general reader
- Every article lists its sources, linked, at the bottom
- Quotes pulled from a source are ≤25 words, attributed, and used at most once per source per article
- Uncertain information is hedged explicitly: "according to," "the company said," "not yet independently confirmed" — never stated as settled fact
- Every image has a real license (Unsplash/Pexels API, not hotlinked from a news site) and alt text
- Markets content always carries a "not financial advice" line
- Celebrity content avoids unverified rumor and anything privacy-invasive (home addresses, health details, family members not themselves public figures)

**Never:**
- Copy-paste any source paragraph, even inside quotation marks, beyond the 25-word single-quote allowance above
- Invent a statistic, date, name, or quote not present in the `extracted_facts` table for that cluster
- Publish a cluster with zero corroborating sources in an `auto` category — route it to review regardless of mode if `source_count < 2`
- Use these AI-writing tells anywhere in generated copy: "Furthermore," "In today's rapidly evolving world," "This groundbreaking development," "As we delve deeper" — reject and regenerate if the output contains them
- Publish more than the category's daily cap before that category's SEO fundamentals (sitemap entry, schema markup, meta) are confirmed working — don't outrun your own indexing

## 2. AI generation rules

- The article generator reads only from `extracted_facts`, never from `source_articles.raw_content` directly — this is the mechanism that keeps output "transformative" rather than a rewrite, and it's a hard architectural boundary, not a prompt instruction
- Every AI call goes through the provider chain (`architecture.md` §7) — no pipeline step calls Groq or Gemini directly
- Structured output only: every AI call specifies a schema (Zod) and the response is validated before it touches the database; a schema failure triggers the next provider in the chain, not a retry with the same provider on the same input
- Log `ai_tokens_used` per run in `scraper_logs` — this is how you catch a free-tier cap approaching before it breaks the pipeline, not after
- Prompts are versioned files in `lib/ai/prompts/`, never inlined ad hoc in a pipeline step — a prompt change is a diff you can review, not a string edit buried in logic

## 3. Quality & risk gating

- Quality score (0–100) from source count, fact-confidence, and readability; risk level (Low/Medium/High) from category sensitivity + presence of unverified claims, financial claims, or accusations
- `auto` mode only publishes when quality ≥ threshold **and** risk = Low; anything else lands in the review queue even in `auto` categories — the toggle controls the default lane, not a bypass of the safety floor
- High-risk flags (health claims, defamation risk, financial advice, unverified accusations) always force review, regardless of category setting

## 4. SEO rules

- Target long-tail, explainer-intent keywords ("what does X mean for Y"), not head-term competition against established outlets — see `PRD.md` §2 on why
- Every article ships with: SEO title (<60 chars), meta description (~155 chars), URL slug, focus keyword, Article/NewsArticle schema, OG tags
- No keyword stuffing — the AI prompt optimizes for a human reading it aloud, not a density target
- Internal linking (should-have phase): 3+ related-article links per article once there's enough published content to link to; don't force it before there is
- `noindex` any thin or duplicate page automatically (tag pages with <3 articles, etc.)

## 5. Engineering rules

**Do:**
- TypeScript everywhere, strict mode
- Zod validation at every boundary: AI output, API route input, environment variables
- Every pipeline job supports status, retry with backoff, structured error logging, and idempotency (safe to re-run without double-publishing)
- Environment variables and secrets via Wrangler secrets — never committed
- Small, reviewable commits; conventional commit messages
- Build incrementally, phase by phase (see `phases.md`) — don't jump ahead

**Don't:**
- Add a microservice or a new external dependency without a documented reason — every extra service is an extra free-tier limit to track and an extra failure point
- Hardcode an AI provider, model name, or prompt inline where it should be config
- Ship a pipeline step with no error handling — an unhandled failure in `scheduled()` silently stops the whole run
- Bypass a paywall or authentication wall to collect source content, ever
- Ignore `robots.txt` for any source not explicitly an official API/RSS feed
- Publish more than 20 articles before sitemap + schema + Search Console submission are live, matching the source brief's own launch-checklist rule

## 6. Legal / compliance rules

- A visible disclosure page explains that content is AI-assisted from public sources, with the fact-extraction/attribution approach summarized in plain language
- DMCA/takedown requests are honored immediately, no exceptions, no "but it's transformative" argument mid-dispute — take it down first, discuss after
- Affiliate links (should-have phase onward) are disclosed clearly near the link
- No collection of private personal information about anyone, public figure or not, beyond what they've made public themselves

## 7. Anti-patterns — reject these outright if you catch yourself building them

- A "generate article" button that feeds an AI raw scraped HTML with a "rewrite this" prompt and nothing else
- A publish pipeline with no review path at all, in any category, ever — the global pause switch in `architecture.md` §10 must always work even if every category is set to `auto`
- Silent failures — a failed pipeline run that doesn't show up in the automation monitor is worse than no automation at all
