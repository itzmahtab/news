# design.md — Signal

## 1. Concept

The product's whole premise is separating signal from noise — real corroborated stories from raw feed churn. The design should look like it takes that seriously: calm, structured, editorial — closer to a well-run wire desk than a SaaS dashboard. The one place it's allowed to feel alive is the live signal strip on the homepage, because that's the literal, functional heartbeat of the product, not decoration.

Avoid on sight: cream background + terracotta accent, near-black + neon accent, zero-radius broadsheet-with-hairlines, and the identical-rounded-card SaaS kit. All four are generic-AI-design defaults, not choices for this brief.

## 2. Token system

**Color** (named, not just hex — use these names in code):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0F1729` | Primary text, dark-mode background |
| `paper` | `#F6F7F5` | Light-mode background (cool off-white, not cream) |
| `signal` | `#E8A33D` | Primary accent — the live strip, active states, category-agnostic highlights |
| `slate` | `#5B6472` | Secondary text, borders, muted UI |
| `wire-red` | `#D64545` | Reserved *only* for "live"/breaking indicators — never decorative |
| `deep-teal` | `#1F5F5B` | Secondary accent for category tagging variety (rotates with 2–3 more muted category tones, not a rainbow of 7 bright colors) |

Category color assignment: each of the 7 categories gets a *desaturated* tone from a shared family (teal, slate-blue, warm ochre, muted plum, etc.) — never a full-saturation rainbow, which reads as templated. Category color shows up as a thin left-border accent on cards, not a loud badge on every element.

**Type:**
- Display/headlines: **Fraunces** (variable, Google Fonts, self-hosted via `next/font`) — a serif with real editorial character, used at large sizes for hero headlines and article titles
- Body/UI: **Public Sans** — clean, distinct from the overused Inter default, good at small sizes for dense category rails
- One weight axis of contrast is enough: Fraunces at 500–600 for headlines, Public Sans at 400/600 for body/emphasis. No third typeface.
- Line length: article body capped around 68–72 characters; Fraunces gets slightly more line-height in long-form quotes.
- No accenting a single word in a headline with italics/color. No all-caps labels. No unnecessary eyebrow text above every section.

**Layout:**
- Asymmetric editorial grid, not centered SaaS cards. Homepage: full-width signal strip → large featured story (image + Fraunces headline, left-aligned) sitting beside a narrower trending rail, not a symmetric 3-up grid.
- Category pages: left-aligned masthead-style header (category name, thin teal/slate accent bar, one-line description pulled from `categories.name`), then a dense list-style rail (image thumbnail + headline + confidence badge), not a grid of identical cards.
- Radius: **sharp corners (0–2px)** on structural elements (cards, containers) to read as editorial, not SaaS; slightly rounder (6–8px) only on interactive controls (buttons, toggles, the admin's approve/reject actions) so the two register as different kinds of thing — content vs. control.

## 3. Signature component: the confidence badge

Small, textual, not a colorful pill: `● 4 sources` in slate, with `wire-red` only if source count is 1 (i.e., "take this with caution"). Clicking it expands the sources trail inline — no modal, no separate page. This is the PRD's differentiator made visible; it should look understated, not like a marketing badge.

## 4. Motion — one signature moment, everything else answers a click

Per the design brief for this kind of product, scattered hover/reveal animation on every card is the generic-AI-design tell to avoid. Two motion moments are earned here, and that's the ceiling:

1. **The live signal strip** — a continuous, slow CSS marquee of the latest headlines across categories, functional (it's literally showing live pipeline output), always respects `prefers-reduced-motion` by freezing to a static list.
2. **Article navigation** — View Transitions (native Next.js 16) morph the clicked card's image and headline into the article page's header. One orchestrated transition, not per-element stagger.

Everywhere else: motion answers an action. The admin review queue's approve/reject is a real swipe/slide-out (via `motion`), because it's confirming a state change the operator triggered. Toasts confirm actions. Nothing animates on scroll into view, and nothing animates on hover except a simple color/underline shift on links — no card lift-and-shadow on every hover.

## 5. Page patterns

- **Home:** signal strip → featured (asymmetric, image-left or image-right alternating by day so it doesn't feel static) → category rails, ordered by the categories with the most recent activity first
- **Category:** masthead header → dense rail, paginated, not infinite-scroll (infinite scroll fights the "calm wire desk" feel)
- **Article:** Fraunces headline → confidence badge + reading-depth toggle right under it → body → "why this matters" pulled out as a distinct visual block (a left border in `signal` orange, not a colored box) → sources trail → related articles
- **Admin dashboard:** deliberately un-editorial — this is a working tool, use standard shadcn density and layout here, save the personality for the public site. Category toggle switches live in a settings table, one row per category, mode + global pause visible at a glance.

## 6. Accessibility & responsive floor

- All interactive elements keyboard-navigable with a visible focus ring in `signal` orange
- Color is never the only signal — the confidence badge pairs a dot with text, category accents pair color with a label
- Contrast checked against both `paper`/`ink` combinations at WCAG AA minimum
- Responsive down to a 360px viewport; the signal strip collapses to a single rotating headline on mobile rather than a marquee
- `prefers-reduced-motion` disables the marquee and the view-transition morph (falls back to a plain navigation) globally, checked once in `lib/motion-config.ts`

## 7. Dark mode

Dark mode is `ink` background with `paper`-toned text, same accent tokens — not a separate palette. Default to system preference; toggle lives in the site footer, not the header (it's a preference, not a primary action).
