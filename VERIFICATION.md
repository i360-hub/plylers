# VERIFICATION — Plyler's Tree Service static migration

**Phase:** Staging mirror (Duda → Astro on Cloudflare Pages preview). **Production DNS and the live Duda site are untouched.**

- **Preview URL:** https://plylers-tree-service-staging.pages.dev
- **Stack:** Astro v5.18 (static) · `@astrojs/sitemap` · Cloudflare Pages
- **Source of truth:** `src/data/business.json` (NAP/phone/reviews/embeds), `src/data/areas.json`, `src/data/links.json`, `src/data/maps.json`
- **Build:** `npm run build` → `dist/` (36 pages) → `wrangler pages deploy dist`

---

## 1. URL parity (live vs static)

All **36** sitemap URLs reproduced at **identical slugs**, every one returns **200** on the preview, canonical tags point to the production `www` host (mirroring the live site exactly so a future cutover is 1:1). Conventions matched: **www + https, no trailing slash** (`/about/` → `/about` 308).

| Live URL (slug) | Live | Static (preview) | Canonical mirrors prod |
|---|---|---|---|
| **Core** | | | |
| `/` | 200 | 200 | ✓ |
| `/about` | 200 | 200 | ✓ |
| `/contact` | 200 | 200 | ✓ |
| `/service-areas` | 200 | 200 | ✓ |
| `/reviews` | 200 | 200 | ✓ |
| `/gallery` | 200 | 200 | ✓ |
| `/blog` | 200 | 200 | ✓ |
| **Generic services** | | | |
| `/tree-removal` | 200 | 200 | ✓ |
| `/tree-trimming` | 200 | 200 | ✓ |
| `/stump-grinding` | 200 | 200 | ✓ |
| `/emergency-storm-damage` | 200 | 200 | ✓ |
| **City hubs** | | | |
| `/tree-service-arkadelphia-ar` | 200 | 200 | ✓ |
| `/tree-service-hot-springs-ar` | 200 | 200 | ✓ |
| `/tree-service-caddo-valley-ar` | 200 | 200 | ✓ |
| `/tree-service-bismarck-ar` | 200 | 200 | ✓ |
| `/tree-service-gurdon-ar` | 200 | 200 | ✓ |
| `/tree-service-malvern-ar` | 200 | 200 | ✓ |
| `/tree-service-glenwood-ar` | 200 | 200 | ✓ |
| `/tree-service-amity-ar` | 200 | 200 | ✓ |
| **Arkadelphia cluster** | | | |
| `/tree-removal-arkadelphia-ar` | 200 | 200 | ✓ |
| `/oak-tree-removal-arkadelphia-ar` | 200 | 200 | ✓ |
| `/pine-tree-removal-arkadelphia-ar` | 200 | 200 | ✓ |
| `/dead-tree-removal-arkadelphia-ar` | 200 | 200 | ✓ |
| `/stump-grinding-arkadelphia-ar` | 200 | 200 | ✓ |
| `/tree-trimming-arkadelphia-ar` | 200 | 200 | ✓ |
| `/emergency-tree-service-arkadelphia-ar` | 200 | 200 | ✓ |
| `/storm-damage-cleanup-arkadelphia-ar` | 200 | 200 | ✓ |
| `/commercial-tree-service-arkadelphia-ar` | 200 | 200 | ✓ |
| `/lakefront-tree-service-degray-lake-ar` | 200 | 200 | ✓ |
| **Blog posts** | | | |
| `/signs-tree-is-dying` | 200 | 200 | ✓ |
| `/tree-trimming-vs-removal` | 200 | 200 | ✓ |
| `/stump-grinding-vs-removal` | 200 | 200 | ✓ |
| `/when-to-remove-a-tree-arkadelphia` | 200 | 200 | ✓ |
| `/questions-to-ask-before-hiring-tree-service-arkansas` | 200 | 200 | ✓ |
| `/what-to-do-after-storm-tree-down-arkansas` | 200 | 200 | ✓ |
| `/is-my-tree-too-close-to-my-house-arkansas` | 200 | 200 | ✓ |

Built routes = sitemap routes exactly (no missing, no extra). Confirmed via `dist/*.html` ∩ `discovery/urls.txt`.

## 2. Redirects (replicate live 301s) — verified on preview

| From | To | Status |
|---|---|---|
| `/service-areas/arkadelphia-ar` | `/tree-service-arkadelphia-ar` | 301 ✓ |
| `/service-areas/hot-springs-ar` | `/tree-service-hot-springs-ar` | 301 ✓ |
| `/comparison/trim-vs-remove` | `/tree-trimming-vs-removal` | 301 ✓ |
| `/comparison/stump-grinding-vs-removal` | `/stump-grinding-vs-removal` | 301 ✓ |
| `/about/` (trailing slash) | `/about` | 308 ✓ (Pages default) |

In addition, the two stale **in-content** `/comparison/*` links found on the live `/tree-removal` and `/stump-grinding` pages were repointed to the canonical blog URLs (bug fixed), with the 301s kept as a safety net.

## 3. Structured data (JSON-LD) — validated

- **0 JSON-LD parse errors** across all 36 pages.
- Global `@graph` centralized in `BaseLayout` (one edit point): `Organization`, `LocalBusiness`+`HomeAndConstructionBusiness` (name, telephone=canonical, address, geo, `aggregateRating` reviewCount **70**, trimmed `areaServed`, `openingHoursSpecification`, `sameAs`), `WebSite`. All required LocalBusiness fields present on every page.
- Page-level nodes verified: `WebPage`/`AboutPage`/`ContactPage`/`CollectionPage`, `Service`, **`FAQPage` on 27 pages** (every `Question` has an `acceptedAnswer.text`), **`BreadcrumbList` on all 35 non-home pages**, **`BlogPosting` on all 7 posts** (headline, datePublished, author, image, description), `HowTo` (home + emergency).
- **`areaServed` trimmed** from ~30 cities to a realistic set: 5 counties (Clark, Garland, Hot Spring, Pike, Montgomery) + 16 cities — consistent with the on-page copy.

## 4. Lighthouse (mobile) — before / after

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| **Duda (live, per brief)** | ~61–69 | — | — | — |
| **Static (preview, median of 3, warm)** | **96** | **100** | **100** | **100\*** |

LCP ~2.7 s · CLS **0** · TBT ~30 ms. Other page types sampled: hub 96, blog post 97, service page 99 — **all ≥ 90**.

\* **SEO shows 69 when measured against the live preview** — this is **expected and intended**: the preview sends `X-Robots-Tag: noindex` (staging protection), which Lighthouse's "is-crawlable" audit penalizes. Measured without that header (local build), SEO = **100**. Removing the noindex at production cutover restores 100.

Performance work applied: responsive WebP (saved ~3 MB), inlined CSS (removed render-blocking requests), GA4 deferred to idle/first-interaction, LCP hero preloaded, hero aspect-ratio reserved (CLS → 0).

## 5. Embeds & tracking — checklist

| Item | Status |
|---|---|
| GHL lead form (verbatim iframe `…/widget/form/4GbeOTv0UeNs4bE2JDAe`) | ✓ on the same 9 pages; renders & loads on preview (`/contact` confirmed) |
| GHL reviews widget (`reputationhub.site/…/gmgznEWM6sm6aqWPghSP`) | ✓ verbatim on `/reviews` |
| Google Maps embeds (per-city centers) | ✓ home + all 8 city hubs |
| GA4 `G-911S3HC2CY` | ✓ all pages (loads after idle/first interaction) |
| ~~GTM~~ | none on the live site — it uses GA4 gtag (brief's GTM assumption corrected) |
| OTTO pixel (`sa-dynamic-optimization`) | **absent** — already gone from the live site; nothing to strip |

## 6. Key decisions applied (signed off)

1. **Phone:** canonical **(870) 245-7944** rendered sitewide; the GHL DNI tracking number **(870) 464-0755** is **not** reproduced (0 occurrences in `dist`). Call-tracking can be re-added later via the GHL `number_pool` script if desired.
2. **Reviews:** unified to **70** everywhere (schema, visible copy, and the `/reviews` meta — which live still said "77+").
3. **Fresh FAQ generated** for the 5 pages that had none: `/about`, `/contact`, `/gallery`, `/dead-tree-removal-arkadelphia-ar`, `/stump-grinding-arkadelphia-ar` (the latter two also gained proper Service/Breadcrumb schema).
4. **areaServed trimmed** to 8 hubs + immediate towns across 5 counties.

Other fixes: `/blog` index got a real title/meta/H1/intro (was "Blog" + empty meta); `/stump-grinding-vs-removal` double-H1 collapsed to one; OG/Twitter upgraded to `summary_large_image` + `og:image`.

## 7. Internal-link structure — preserved

Arkadelphia hub → its **9 cluster children** (via `ArkadelphiaServicesBlock`); generic service pages → their Arkadelphia children; city hubs → the 4 generic services + sibling cities; blog cross-links intact. **0 broken internal links** in `dist`.

## 8. ⚠️ Pre-cutover checklist (when/if this is promoted to production — out of scope now)

1. **Remove the `noindex` block** from `public/_headers` (restores SEO 100 + allows indexing).
2. Point DNS / add the custom domain in Cloudflare Pages; confirm apex+http → `https://www` 301s at the edge.
3. Re-verify canonical host and the `_redirects` legacy map on the production domain.
4. Decide whether to re-add GHL call-tracking (DNI `number_pool`).
5. Confirm the true current Google review count and bump `business.json` `rating.count` if it has grown past 70.
6. Submit `sitemap-index.xml` in Search Console; spot-check Rich Results for LocalBusiness/FAQ/Breadcrumb/BlogPosting.
