# phases.md — Signal

11 phases, zero to deployed. Phases 1–9 build the product to a fully workable state end-to-end. Phase 10 is testing/QA. Phase 11 is deployment/launch. Don't skip ahead — each phase assumes the previous one actually works, not just exists.

---

## Phase 1 — Foundation
- [ ] Scaffold Next.js 16.3 app (`apps/web`) with App Router, Turbopack dev, TypeScript strict
- [ ] Install Tailwind CSS + shadcn/ui CLI, generate base components (don't theme yet — that's Phase 7)
- [ ] Create Neon Postgres project + branch; connect via Hyperdrive binding in `wrangler.jsonc`
- [ ] Write Drizzle schema for `categories`, `admin_users` (start minimal — full schema lands as each phase needs its tables, not all at once)
- [ ] Seed all 7 categories with placeholder `source_feeds: []` and default `publish_mode: 'review'`
- [ ] Set up Auth.js with a single admin credentials account (Edge-runtime config)
- [ ] Build the barest public homepage (static "coming soon" per category) and confirm it deploys
- [ ] Deploy `apps/web` to Cloudflare Workers (via `vinext` or `@opennextjs/cloudflare` — decide here based on current docs) and confirm a live URL works

## Phase 2 — Source ingestion
- [ ] Scaffold `apps/pipeline-worker` (Hono) as its own Worker, separate `wrangler.jsonc`
- [ ] Build source adapters: RSS (`rss-parser`), Reddit JSON (unauthenticated), one official API (TMDB or AniList) as a proof the adapter interface generalizes
- [ ] Define the common normalized shape (`id, title, url, sourceName, publishedAt, rawContent, category`) and make every adapter return it
- [ ] Fill in real `source_feeds` for at least 2 categories in the `categories` table
- [ ] Write `source_articles` table + dedupe via `ON CONFLICT (source_url) DO NOTHING`
- [ ] Manually trigger the worker locally (no cron yet) and confirm rows land, deduped, across a few runs

## Phase 3 — Clustering
- [ ] Write `event_clusters` table
- [ ] Implement cheap clustering first: title normalization + keyword overlap threshold
- [ ] Add semantic-similarity tiebreak only where the cheap pass is ambiguous (don't burn AI calls on every comparison)
- [ ] Confirm with real ingested data: ten articles about the same event become one cluster, not ten

## Phase 4 — AI fact extraction
- [ ] Implement the `AIProvider` interface + `GroqProvider` + `GeminiProvider` (architecture.md §7)
- [ ] Write the fact-extraction prompt (versioned file, not inline) targeting the `extracted_facts` schema
- [ ] Validate every response against a Zod schema before writing to the DB; on failure, fall through the provider chain
- [ ] Run extraction against real clusters from Phase 3; manually review 10 outputs for hallucinated facts before moving on — this is the single most important quality gate in the whole project

## Phase 5 — AI content generation
- [ ] Write the article-generation prompt, reading **only** from `extracted_facts` (never raw source text — rules.md §2)
- [ ] Generate: headline, article body, meta description, tags, "why this matters" block, simple/detailed reading-depth pair
- [ ] Write to `articles` table with `status = 'draft'`
- [ ] Manually review 10 generated articles against their source clusters for accuracy and voice before moving on

## Phase 6 — Automation pipeline wiring
- [ ] Implement quality score (source count, fact-confidence, readability) and risk level (rules.md §3)
- [ ] Implement publish routing: read `categories.publish_mode`, apply the safety floor (risk=Low AND quality≥threshold required even in `auto`), write `status = 'published'` or leave in `pending_review`
- [ ] Wire the Cloudflare Cron Trigger (every 2h) to the full pipeline: ingest → dedupe → cluster → extract → generate → score → route
- [ ] Implement `scraper_logs` writes at every stage with token usage, error, duration
- [ ] Let it run unattended for 48 hours across all 7 categories; check logs, not just output, for silent failures

## Phase 7 — Public site build-out
- [ ] Apply the full design token system (design.md) — theme shadcn components, don't ship defaults
- [ ] Build home: signal strip, featured story, category rails
- [ ] Build category pages, article page (confidence badge, sources trail, reading-depth toggle, View Transition on navigation)
- [ ] Build search (Postgres `tsvector` full-text) and trending page
- [ ] Sitemap (`app/sitemap.ts`), Article/NewsArticle schema, OG tags, canonical URLs
- [ ] Submit sitemap to Google Search Console

## Phase 8 — Admin dashboard build-out
- [ ] Dashboard overview (counts: discovered, clustered, drafted, queued, published, failed)
- [ ] Event clusters view (approve/reject/prioritize)
- [ ] AI Studio (manual trigger buttons: generate article / SEO / regenerate)
- [ ] Review queue (approve/reject/edit before publish) with the swipe-confirm motion pattern from design.md
- [ ] Article editor (rich text/markdown, SEO preview, source panel)
- [ ] Automation monitor (queue, running, failed, retry) reading from `scraper_logs`
- [ ] **Category settings page**: per-category publish-mode toggle + global pause switch (architecture.md §10)

## Phase 9 — SEO & growth features (should-have)
- [ ] YouTube Shorts / Reels script generation per article (same provider chain, new prompt)
- [ ] Instagram caption generation
- [ ] Internal linking recommendations (only once there's enough published content to link to)
- [ ] Analytics dashboard wired to Cloudflare Web Analytics + GA4
- [ ] Newsletter signup form writing to `newsletter_subscribers` (send automation stays future scope)

**Checkpoint: the project is workable end-to-end here.** Everything below is testing and shipping what already works — don't add new features inside Phases 10–11.

## Phase 10 — Testing & QA
- [x] Unit tests for: dedupe logic, clustering thresholds, quality-score calculation, publish-mode routing (dedupe + clustering shipped in Vitest; quality-score/routing tests pending that pipeline code)
- [ ] Integration test: full pipeline run against a mocked source feed, asserting an article reaches `pending_review` or `published` correctly per category mode
- [ ] Manual QA pass on every public page at 360px, 768px, 1280px (code-level audit done; visual confirmation pending)
- [x] Accessibility pass: keyboard nav, focus rings, `prefers-reduced-motion`, contrast check (design.md §6)
- [ ] Load-test the pipeline worker against Free-tier subrequest limits (50/invocation) — confirm it doesn't silently truncate a large ingestion batch
- [x] Security pass: confirm admin routes are unreachable without auth, secrets aren't in the repo, cron-trig HTTP endpoint (if any) requires its secret header
- [ ] Fix everything found before Phase 11 — don't deploy known-broken behavior with a "fix in prod" plan

## Phase 11 — Deployment & launch
- [ ] Production Neon branch (separate from dev), production Wrangler secrets set
- [ ] Deploy both Workers (`web`, `pipeline-worker`) to production
- [ ] Custom domain attached, DNS via Cloudflare
- [ ] Confirm cron is running in production and articles are landing correctly per category mode
- [ ] `robots.txt` correct, sitemap live, Search Console + Bing Webmaster Tools submission
- [ ] Publish the disclosure/"how this was made" page (PRD.md §8) before the first public article goes live
- [ ] Soft-launch: everything on `review` mode for the first week regardless of category defaults, watching manually, before trusting any category to `auto`
