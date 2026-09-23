# architecture.md — Signal

Stack decisions below reflect current (Aug 2026) platform reality, not the Vercel/Supabase assumptions in the original brief — see the callouts. Total monthly cost target: **$0**, same principle as the source doc, updated to services that actually deliver it today.

---

## 1. System overview

```
                         ┌─────────────────────────┐
                         │  Cloudflare Cron Trigger │  every 2h
                         └────────────┬────────────┘
                                      ▼
                   ┌──────────────────────────────────┐
                   │  pipeline-worker (Hono, Workers)  │
                   │  ingest → dedupe → cluster →      │
                   │  extract facts → AI generate →    │
                   │  SEO → route by publish_mode       │
                   └────────────┬───────────────────────┘
                                ▼
          ┌─────────────────────────────────────────────┐
          │        Neon Postgres (via Hyperdrive)         │
          │  articles, categories, event_clusters,        │
          │  extracted_facts, scraper_logs, media_assets   │
          └───────────────┬─────────────────────────────┘
                           ▼
     ┌───────────────────────────────────────────────────┐
     │   web-app (Next.js 16.3 on Cloudflare Workers)      │
     │   public site (SSR/ISR-style) + admin dashboard      │
     └───────────────────────────────────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │  R2 (images) · KV (edge  │
              │  cache) · Auth.js (admin)│
              └─────────────────────────┘
```

Two Workers, one database. The **pipeline-worker** is a small Hono API with no UI — it exists purely to run on a schedule and do the heavy ingestion/AI work, isolated so a bad scrape or an AI provider outage can't take the public site down with it. The **web-app** is your Next.js app, serving both the public site and the `/admin` dashboard, deployed as its own Worker. This split also happens to line up with the Workers + Hono skill-building you've been doing separately — the pipeline-worker is a real, non-toy use of that stack.

## 2. Free technology stack

| Layer | Technology | Free limit (verified Aug 2026) | Notes |
|---|---|---|---|
| Frontend/App | Next.js 16.3 (App Router, Turbopack) | Open source | View Transitions + Cache Components, both native to 16 |
| Deploy target | Cloudflare Workers | 100k req/day, 10ms CPU/invocation (free) | Cloudflare's current official path is the **`vinext`** adapter (announced as the recommended default, Aug 2026); **`@opennextjs/cloudflare`** is the older, more battle-tested alternative if `vinext`'s tooling is too new when you actually build. Check `developers.cloudflare.com/workers/framework-guides/web-apps/nextjs` at Phase 1 start — this moves fast. |
| UI | Tailwind CSS + shadcn/ui + `motion` (Motion for React) | Open source | See `design.md` for the token system — do not ship shadcn defaults unstyled |
| Database | **Neon Postgres** | 0.5 GB storage / free branch, autosuspend | Matches your PERN/Postgres preference over D1 |
| DB accelerator | **Cloudflare Hyperdrive** | Included on Workers Free (connection pooling + query caching at the edge) | Removes the "cold TCP connection from an edge Worker" problem Postgres normally has |
| ORM | **Drizzle ORM** | Open source | Edge-native, works cleanly with the Neon serverless driver + Hyperdrive. (Prisma also works via driver adapters if you'd rather stay closer to your stated Prisma preference — see §3 for the tradeoff.) |
| Object storage | Cloudflare R2 | 10 GB storage, 1M Class A + 10M Class B ops/mo, **zero egress fees** | Article images, thumbnails |
| Edge cache/KV | Cloudflare KV | 1 GB, 100k reads/day, 1k writes/day | Used for edge caching of rendered pages only — **not** for dedup (see §5, dedup lives in Postgres instead of Redis) |
| Scheduling | Cloudflare Cron Triggers | Included free, up to 3 triggers/Worker, 1-minute granularity floor | Every-2-hours is trivial at this granularity — this replaces the Vercel Hobby cron the source doc assumed, which no longer supports that cadence on the free plan |
| AI (primary) | Groq — `llama-3.1-8b-instant` | ~30 RPM, ~14,400 req/day | Use for volume: article rewrite, script gen |
| AI (secondary) | Groq — `llama-3.3-70b-versatile` | ~30 RPM, **~1,000 req/day** (not 14,400 — verify current cap in the Groq console before relying on it) | Reserve for cases where 8B quality isn't enough |
| AI (fallback) | Gemini Flash (AI Studio) | ~10–15 RPM, low-hundreds to ~1,500 req/day depending on model tier — **volatile, recheck at build time** | Fallback chain, not primary — Google has cut this tier before |
| Images (source) | Unsplash API + Pexels API | 50 req/hr (Unsplash) / effectively unlimited (Pexels) | Pexels as primary, Unsplash as backup — inverse of the source doc, since Pexels' limit is looser |
| Auth (admin only) | Auth.js (NextAuth v5) | Open source, Edge-runtime compatible | Single admin account, credentials or magic-link — this is not a multi-tenant auth system |
| Newsletter capture | Just a Postgres table for v1 | — | Defer Resend/Brevo send integration to "should have" scope |
| Analytics | Cloudflare Web Analytics + GA4 | Free | No cookies needed for the Cloudflare side |
| Video/TTS (later phase) | ElevenLabs free tier, CapCut, Edge TTS (unlimited, local) | ~10k chars/mo (ElevenLabs) | Unchanged from source doc — still the best free options |

### Why Neon + Hyperdrive over D1 (your call, documented for future-you)

D1 (SQLite) would have been the more "native" Cloudflare choice and pairs naturally with Workers + Hono + Drizzle. You chose Neon Postgres instead, which is the right call if you want real relational features (window functions for analytics, full-text search via `tsvector`, more mature JSON querying for the `extracted_facts` structures) and want this project's database experience to transfer directly to typical backend-role expectations. The cost is one more moving part (Hyperdrive binding + Neon connection string as a secret) — worth it for this project's scope.

## 3. ORM: Drizzle vs Prisma — pick one before Phase 1

Both work on this stack. Drizzle is lighter, has first-class Neon HTTP/serverless driver support, and keeps you in the Workers+Hono+Drizzle groove you've been building elsewhere. Prisma is closer to your stated general preference and has a larger ecosystem, but needs the Accelerate or driver-adapter path to behave on Workers, which adds setup friction. **Default: Drizzle.** Switch this line if you disagree before Phase 1 — it's a foundational choice, not one to revisit mid-build.

## 4. Category system (must support an 8th category without a code change)

```sql
categories (
  id, slug, name, icon, color_token,
  publish_mode   text default 'review',  -- 'auto' | 'review'
  source_feeds   jsonb,                  -- array of {type, url, weight}
  target_keywords jsonb,
  is_active      boolean default true
)
```
Adding a category is inserting a row and configuring its `source_feeds`, not touching pipeline code. The pipeline worker iterates `categories where is_active = true`.

## 5. Automation pipeline (per category, per cron run)

1. **Ingest** — pull each active source feed (RSS via `rss-parser`, Reddit JSON API unauthenticated, official APIs where available)
2. **Normalize** — map every source into one common shape (`id, title, url, sourceName, publishedAt, rawContent, category`)
3. **Dedupe** — `INSERT ... ON CONFLICT (source_url) DO NOTHING` against `source_articles`. This is the direct Postgres replacement for the Upstash Redis dedup cache in the source doc — one less service, same guarantee, and it's transactionally consistent with the rest of the write.
4. **Cluster** — group same-event articles into an `event_clusters` row using title-normalization + keyword overlap first (cheap), semantic similarity only as a tiebreaker (expensive — save AI calls for generation, not clustering)
5. **Extract facts** — one AI call per cluster produces the structured `extracted_facts` JSON from the source brief (confirmed facts, quotes ≤25 words each with attribution, people/orgs/dates, conflicting claims, unknowns) — **never the article generator working from raw scraped text directly**
6. **Generate** — AI call(s) produce the article, SEO metadata, and (should-have phase) video/social assets, from the facts table only
7. **Score** — quality/risk score (see `rules.md` §3) computed from source count, fact-confidence, category risk tier
8. **Route** — read `categories.publish_mode` for this article's category: `auto` → publish immediately if score clears threshold; `review` → land in the queue regardless of score
9. **Publish** — write `status='published'`, `published_at=now()`, trigger sitemap regeneration
10. **Log** — every run writes to `scraper_logs` (found/saved/AI tokens/errors/duration) — this is your automation monitor's data source

## 6. Database schema (core tables)

Beyond `categories` above:

```sql
source_articles (id, cluster_id, source_url unique, source_name, title,
  raw_content, published_at, discovered_at)

event_clusters (id, category_id, title, summary, trend_score, status, created_at)

extracted_facts (id, cluster_id, confirmed_facts jsonb, quotes jsonb,
  people jsonb, organizations jsonb, dates jsonb, conflicting_claims jsonb,
  unknowns jsonb, source_count int, confidence_score int)

articles (id, cluster_id, category_id, title, slug unique, content markdown,
  meta_description, tags text[], image_url, status, quality_score,
  risk_level, reading_depth_simple text, youtube_script text,
  instagram_caption text, views int default 0, published_at, created_at)

media_assets (id, article_id, r2_key, alt_text, source, license)

scraper_logs (id, category_id, articles_found, articles_saved,
  ai_tokens_used, error, duration_ms, ran_at)

admin_users (id, email, password_hash, role, created_at)

newsletter_subscribers (id, email unique, subscribed_at)
```

Indexes: `articles(category_id, status, published_at desc)`, `articles(slug)`, `source_articles(source_url)`. Full-text: a `tsvector` generated column on `articles.title || content` for the search page — this is the concrete payoff of choosing Postgres over D1.

## 7. AI provider abstraction

```ts
interface AIProvider {
  generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>
}
```
Implement `GroqProvider` and `GeminiProvider` against this interface. A `ProviderChain` tries Groq 8B → Groq 70B (only if 8B output fails a schema/quality check) → Gemini Flash → log-and-skip. Never hardcode a provider inline in a pipeline step — every AI call goes through the chain. This is what makes "Groq's free tier got cut again" a config change instead of a rewrite.

## 8. Animation system (shadcn + Next 16, all free)

- **View Transitions API** (native to Next.js 16, `<ViewTransition>` / `unstable_ViewTransition`) drives the one signature moment: an article card's image and title morph into the article page's header on navigation. No extra library needed for this.
- **Motion for React** (`motion` npm package, free/open source, successor to Framer Motion) handles interactive-state animation only: review-queue approve/reject swipe, toast confirmations, the admin dashboard's live-status pulse. Not used for scroll-triggered reveals on every card — see `design.md` §4 for why.
- shadcn/ui components are generated via the CLI into your own `components/ui`, then re-themed with the token file in `design.md` — never shipped with default shadcn styling.
- `prefers-reduced-motion` is respected globally via a single Tailwind variant, checked once in `lib/motion-config.ts`, not per-component.

## 9. Folder architecture (Next.js 16 App Router)

```
apps/
  web/                          # Next.js 16 app → deployed as its own Worker
    app/(public)/page.tsx
    app/(public)/[category]/page.tsx
    app/(public)/article/[slug]/page.tsx
    app/(public)/search/page.tsx
    app/(public)/trending/page.tsx
    app/(public)/sitemap.ts
    app/(admin)/dashboard/page.tsx
    app/(admin)/clusters/page.tsx
    app/(admin)/studio/page.tsx
    app/(admin)/queue/page.tsx
    app/(admin)/editor/[id]/page.tsx
    app/(admin)/monitor/page.tsx
    app/(admin)/analytics/page.tsx
    app/api/articles/route.ts
    app/api/admin/toggle-publish-mode/route.ts
    components/ui/               # shadcn output, re-themed
    components/site/             # ArticleCard, TrendingRail, ConfidenceBadge
    components/admin/            # ReviewCard, ScraperStatus, ClusterCard
    lib/db/                      # drizzle client + schema
    lib/auth/                    # Auth.js config
    lib/motion-config.ts
    wrangler.jsonc
  pipeline-worker/               # Hono, deployed as its own Worker
    src/index.ts                 # scheduled() handler, cron entry
    src/ingest/                  # per-source adapters
    src/ai/                      # provider chain, prompts
    src/cluster/
    src/facts/
    wrangler.jsonc
packages/
  shared/                        # types + drizzle schema shared by both apps
```

## 10. Admin publish-mode toggle — how it actually works

`PATCH /api/admin/toggle-publish-mode { categoryId, mode }` updates `categories.publish_mode`. The pipeline-worker reads this value fresh on every run (no caching of this specific field) so a toggle flipped mid-day takes effect on the next cron tick, not the next deploy. The admin dashboard's category settings page shows all 7 categories with their current mode and a one-click switch, plus a **global override** ("pause all auto-publish") for when you want to step away without touching every category individually.

## 11. Security & rate limiting

- Admin routes gated by Auth.js middleware; no public signup path exists for admin
- Cron-triggered pipeline endpoint (if exposed as HTTP for manual retriggering) protected by a secret header, never public
- Cloudflare's own rate limiting rules in front of the Worker for basic abuse protection (free tier includes basic WAF rules)
- Secrets (Neon connection string, Groq/Gemini keys, R2 credentials) live in Wrangler secrets, never in code or `.env` committed to git
