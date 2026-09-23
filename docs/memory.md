# memory.md — Signal session handoff

> **Read this first in any new session.** Then read `docs/files/` (PRD, rules, phases, design, architecture) as needed. This file is the single source of truth for *where the build actually stands* vs the plan. Update it at the end of every work session.

---

## Status (last updated: 2026-09-20 — session 3)

**Project:** Signal — AI-assisted news platform, 7 verticals, $0/mo stack.
**Stack in use:** Next.js 16.3 (Turbopack, App Router) + Tailwind v4, MediaStack news API, **Vitest (48 tests green)**.
**Current phase:** Phases 1–2 stable + Phase 7 + Phase 9 (SEO) shipped + **Phase 10 start: test suite, a11y/contrast fixes, custom 404/error pages, security pass**. Phase 3 **head-start**: cheap clustering shipped as a pure, tested lib (wiring to DB/pipeline still pending). `pnpm test` + `pnpm build` both clean.

### Where we are in phases.md

| Phase | State |
|---|---|
| 1 — Foundation | **Mostly done (no infra)** — scaffolds + Drizzle schema (`categories`, `admin_users`); Auth.js + Neon + deploy deferred |
| 2 — Source ingestion | **Done, no-DB variant** — MediaStack adapter, 7 verticals, live cards |
| 3 — Clustering | **Head-start only** — `src/lib/clustering.ts` (title-normalized keyword-overlap, greedy, tested). `event_clusters` table + real-data confirmation deferred (needs DB) |
| 4 — AI fact extraction | Not started — blocked: needs Groq + Gemini keys |
| 5 — AI content generation | Not started — blocked: Groq/Gemini keys |
| 6 — Automation wiring | Not started |
| 7 — Public site build-out | **Done (design.md §2)** — tokens, fonts, dark mode, home/category/search/trending, **+ custom `not-found.tsx` + `error.tsx` (Next 16 `retry`)**. Article pages deferred (Phase 5 dep) |
| 8 — Admin dashboard | Not started — Auth.js deferred to here |
| 9 — SEO & growth | **Partial** — sitemap, robots, metadataBase, per-page canonical/OG. Search Console submission deferred (needs live domain) |
| 10 — Testing & QA | **Started** — Vitest suite (48 tests: mediastack parse/dedupe/mapping/429-retry-mock, recency rank, pagination, categories-config integrity, clustering); a11y contrast fixes (muted markers, marquee seam); security pass done. **Pending:** manual visual QA at 360/768/1280; quality-score/publish-routing tests (wait on Phase 6 code); load test; integration test |
| 11 — Deployment & launch | Not started — blocked: Cloudflare account + Neon project |

### Session decisions (locked 2026-09-20, sessions 2–3)
- **Scope this session (3):** Phase 10 Testing & QA + Phase 3 head-start (per owner). Vitest chosen over node:test; **logic-only tests** (no DOM/Testing Library); cheap clustering included.
- **Test rig:** `vitest` dev-dep, `vitest.config.mts` (alias `@`→`src`, `node` env, include `src/**/*.test.ts`), scripts `test` / `test:watch`. Vitest 5: config file must be `.mts` and use `import.meta.dirname` (not `__dirname`) to avoid the native-config warning.
- **Pure logic extracted from routes/network (no behavior change):**
  - `src/lib/api/mediastack-parse.ts` — Zod response schema, `buildMediaStackParams`, `dedupe`, `toNewsItem`, `parseMediaStackBody` (throws on bad shape), `mapMediaStackCategory` (fallback → `ai-tech`), `mediaStackCategoryLabel`, backbone category map/set. `mediastack.ts` keeps only network + retry + orchestration.
  - `src/lib/news.ts` — `publishedMillis` (NaN-safe → 0), `rankByRecency`.
  - `src/lib/pagination.ts` — `parsePage` (clamp ≥1), `totalPages`, `DEFAULT_PAGE_SIZE`. Used by `[category]`.
- **Clustering head-start:** `normalizeForCluster` (lowercase, strip non-alnum, drop stopwords/short tokens), `keywordOverlap` (hits/smaller-set), greedy `clusterItems` (`CLUSTER_OVERLAP_THRESHOLD = 0.5`, `CLUSTER_MIN_KEYWORDS = 2`); items below min-keywords become singleton clusters; deterministic. Semantic tiebreak stays AI-dependent (deferred).
- **QA fixes shipped:** custom 404 + error pages (Next 16 error uses **`retry`**, not `reset`); moved `text-signal`/`text-slate` wordmarks to `text-muted-foreground` (signal #E8A33D on paper ≈ 2:1 FAILS AA; slate on ink ≈ 3.2:1 FAILS AA — only for decorative markers; primary bg + ink text = 8.9:1 both themes ✓); marquee padding moved to a wrapper so the `-50%` seam is gapless.
- **Rate-limit architecture (keep):** `fetchBackboneNews()` = ONE URL reused by home + 4 backbone category pages page-1 (fetch-cache dedupe → ~4 distinct MediaStack requests at build); keyword slugs (jobs/movies/anime) fetch with `keywords`; pagination `offset` + 2.5s sleep on page>1; `fetchSearchNews` only on live queries. Sequential; never burst.
- **Carried decisions:** MediaStack only; no Neon/Cloudflare yet; root `src/` layout (owner, overrides architecture.md §9); cards link out to source URLs; AI pipeline + article pages need keys.
- **Security pass (done, re-verify on commit):** `.env` gitignored + untracked (`git check-ignore .env` ✓); `git grep` for key patterns over tracked files → clean; no admin routes exist; note `pnpm-workspace.yaml` has a trailing-newline-only working-tree diff (pnpm wrote it) — harmless.

### Blocked-on / needs from owner
- Groq API key + Gemini API key → unblocks Phases 4–6 (AI pipeline), internal article pages, and quality-score/publish-routing unit tests (Phase 6).
- Neon Postgres connection string + Cloudflare account → unblocks Phase 1 DB wiring, Phase 3 "real data" clustering, and Phase 11 deploy.
- Set `SITE_URL` to the real domain in `.env` for correct sitemap/canonical/OG at launch.
- Visual confirmation pass: pages look right at 360/768/1280 in light + dark (code-level audit done).

---

## Repo layout (current)

```
src/
  app/
    layout.tsx            # Fraunces + Public_Sans fonts, theme-init script, metadataBase from SITE_URL
    globals.css           # design.md tokens: @theme vars, .dark variant, signal-marquee keyframes
    page.tsx              # home: SignalStrip + FeaturedStory + recency-sorted rails + header/footer
    [category]/page.tsx   # row-list category pages, ?page= pagination (lib/pagination), notFound, canonical
    search/page.tsx       # ?q= → MediaStack search (raw MediaStack labels)
    trending/page.tsx     # freshest 18 across verticals
    not-found.tsx         # themed 404 + home link
    error.tsx             # client error boundary, Next 16 `retry` prop
    sitemap.ts, robots.ts
  components/ui/          # shadcn base (button, badge, card)
  components/site/        # news-card (card+row variants), category-rail, signal-strip, featured-story, theme-toggle
  lib/
    api/mediastack.ts     # network+retry+orchestration only (fetchBackbone/Category/Search/Signal)
    api/mediastack-parse.ts # pure: zod schema, params builder, dedupe, toNewsItem, mapping, labels
    api/*.test.ts         # parse tests + 429-retry tests (vi.stubGlobal fetch + fake timers)
    config/categories.ts  # 7 verticals + color hex + MediaStack mapping (+ categories.test.ts)
    clustering.ts         # Phase 3 head-start: normalize + overlap + clusterItems (+ clustering.test.ts)
    db/schema.ts          # Drizzle schema (categories, admin_users) — not wired
    news.ts               # publishedMillis, rankByRecency (+ news.test.ts)
    pagination.ts         # parsePage, totalPages, DEFAULT_PAGE_SIZE (+ pagination.test.ts)
    env.ts                # MEDIA_STACK, REVALIDATE_SECONDS, SITE_URL
    utils.ts
  public/, .env, next.config.ts, tsconfig.json, postcss.config.mjs, components.json, package.json
vitest.config.mts         # test config (alias @, node env)
docs/
  memory.md               # THIS FILE
  files/                  # PRD, rules, phases, design, architecture (authoritative docs; Phase 10 boxes ticked where shipped)
```

## Important version caveats (Next.js 16.3)
- `params`/`searchParams`/`cookies()`/`headers()` are **async**.
- `middleware.ts` → **`proxy.ts`**; Turbopack default; `next lint` removed; error boundary uses **`retry`**, not `reset`.
- `/[category]` renders dynamic (ƒ) because `searchParams` is read — `generateStaticParams` present but Next skips prerender; 4h fetch cache caps API hits. Accepted.
- `next/font/google` needs network at build; remote images use plain `<img>`.
- Vitest 5 config: `.mts` + `import.meta.dirname` (avoids native-loader warnings).

## Next actions (handoff checklist)
1. **Owner visual QA** at 360/768/1280 (light + dark) — then tick the Phase 10 manual-QA box.
2. Then AI pipeline (Phases 3-real → 4–6) once Groq/Gemini keys land: wire `clustering` into a pipeline, fact/generation prompts, quality+routing (adds the missing Phase 10 unit tests), article pages.
3. Or wire Neon + Cloudflare (Phase 1/2 "true" via `source_articles` dedupe, Phase 3 real-data clustering, Phase 11 deploy + Search Console).
4. Optional polish when bored: `news-card` row layout above `sm:w-44` hard-coded — could honor `--radius` tokens; `<time>` strings are `toLocaleDateString` server-side (locale-dependent) — fine, but note if you ever render client-side.

## How to keep this current
- **Start of session:** read this file.
- **End of session:** update Status/decisions/blockers/Next actions + tick phases.md boxes for genuinely shipped items.
- Keep it a handoff note — nobody re-reads a wall of text. Detail lives in `docs/files/`.