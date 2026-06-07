# Page Authoring Guide (for Plyler's Astro migration)

You are authoring **one Astro page per live URL**, faithfully reproducing the live site's content
(SEO-critical: this site ranks #1–3 locally). Source content for each page is the extracted copy at
`discovery/analysis/content/<page>.md`. **Reproduce that copy faithfully** — keep headings, prose,
local details (street names, neighborhoods, counties), lists, and CTAs. You may lightly clean grammar
but DO NOT invent new claims or drop local specifics. Keep the plainspoken, local voice.

## Hard rules
- Slug must be EXACT (file path below). Never add trailing slashes.
- Phone is ALWAYS the canonical `business.phoneDisplay` / `business.phoneHref` — NEVER hardcode a number,
  and NEVER use the tracking number (870) 464-0755 if you see it in source.
- Use the shared layout + components. Do not add new global nav/footer/head — BaseLayout handles those.
- Do NOT run `npm run build` (the orchestrator builds centrally). Just write the file.
- Pull NAP/phone/review count from `src/data/business.json` via the schema lib — never retype them.
- Review count is **70** everywhere. Counties served: Clark, Garland, Hot Spring, Pike, Montgomery.

## Page skeleton
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import FaqSection from '../components/FaqSection.astro';
import CtaBand from '../components/CtaBand.astro';
import GhlForm from '../components/GhlForm.astro';            // ONLY on pages that had the form (see list)
import MapEmbed from '../components/MapEmbed.astro';          // ONLY city hubs + home
import { breadcrumb, faqPage, service, pageGraph, SITE, LOCALBUSINESS_ID, WEBSITE_ID, ORG_ID } from '../lib/schema';
import business from '../data/business.json';
import faqData from '../data/faq.json';
import maps from '../data/maps.json';

const title = "<exact or improved title>";          // from migration map; keep length ~50-60
const description = "<exact or improved meta>";       // keep ~140-160 chars
const path = "/<slug>";
const crumbs = [{ name: 'Home', path: '/' }, { name: '<Label>', path }];
const faq = faqData["<page-key>"] ?? [];              // [] if none

const schema = [
  { '@type': '<WebPage|AboutPage|ContactPage|CollectionPage>', '@id': `${SITE}${path}#webpage`,
    url: `${SITE}${path}`, name: title, description, isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': LOCALBUSINESS_ID }, breadcrumb: { '@id': `${SITE}${path}#breadcrumb` } },
  { ...breadcrumb(crumbs), '@id': `${SITE}${path}#breadcrumb` },
  service({ name: '<Service name>', serviceType: '<type>', description, path }),  // service/local pages
  ...(faq.length ? [faqPage(faq)] : []),
];
---
<BaseLayout title={title} description={description} path={path} schema={schema}>
  <Breadcrumbs items={crumbs} />
  <!-- hero/sections using existing CSS classes: .section, .section-alt, .container, .measure, .grid .grid-3, .card, .btn, .eyebrow, .lead -->
  ...content sections faithfully reproduced...
  <FaqSection items={faq} heading="<the live FAQ heading>" intro="<the live FAQ intro>" />
  <CtaBand />
  <GhlForm />   <!-- only if page is in the form list -->
</BaseLayout>
```

## Component APIs (use these exactly)
- `Hero` props: `eyebrow?, title, subtitle?, image?, imageAlt?, primaryCta?={label,href}, showPhone?, compact?`
- `FaqSection` props: `items:[{q,a}], heading?, intro?, id?` (renders nothing if items empty)
- `CtaBand` props: `title?, text?, href?, label?`
- `GhlForm` props: `heading?, minHeight?, id?`
- `MapEmbed` props: `src, title?, height?`  → use `maps["/<slug>"]` for src
- `AreasBlock` props: `heading?, intro?, current?` (pass current=path to drop self)
- `ArkadelphiaServicesBlock` props: `heading?, intro?, current?, showDegray?`
- `ServicesGrid` props: `heading?, intro?, current?`
- `Testimonials` props: `heading?, intro?, alt?`
- `Breadcrumbs` props: `items:[{name,path}]`
- `ServiceCard` props: `title, href, description, icon?`

## Schema helpers (`src/lib/schema.ts`)
- `breadcrumb([{name,path}])`, `faqPage([{q,a}])`, `service({name,serviceType,description,path,areaServed?})`
- IDs: `ORG_ID, LOCALBUSINESS_ID, WEBSITE_ID`, `SITE` (base url). Global Org/LocalBusiness/WebSite are auto-injected by BaseLayout — only add PAGE-level nodes via the `schema` prop.

## Images (in `public/images/`, all `.webp` except logo/favicon)
Use real files. Common ones: `arkadelphia-ar-large-oak-overhanging-residential-home-sunset.webp`,
`arkadelphia-ar-bucket-truck-dead-tree-removal-residential.webp`,
`arkadelphia-ar-arborist-rope-climb-tall-tree-removal.webp`,
`arkadelphia-ar-storm-damage-uprooted-oak-tree-removal.webp`,
`arkadelphia-ar-hazardous-leaning-pine-tree-before-removal.webp`,
`arkadelphia-ar-pine-forest-cleared-after-tree-removal.webp`,
`hot-springs-ar-arborist-climbing-aerial-tree-work.webp`, `malvern-ar-large-mature-oak-tree-assessment-commercial.webp`,
`glenwood-ar-large-tree-felling-chainsaw-professional.webp`.
Check `ls public/images` for the full set. Always include descriptive `alt`. Pick a topically relevant image; use `-640.webp` variants are also available for smaller renders.

## Internal links — preserve them
Reproduce the internal links found in the source content (the `[links: ...]` annotations in the .md).
Service/area cross-links matter for SEO. Use `ArkadelphiaServicesBlock` / `AreasBlock` / `ServicesGrid`
where the page linked to those sets.
