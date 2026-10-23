# Apneyy Web

The public Apneyy website: discover South Asian businesses across the US.
Angular 18, prerendered to static HTML, on the shared Firebase project `apneyy-5cb5d`
(same data as the business portal `apneyy-crm` and the admin portal `apneyy-admin`).

## How it works

- **No Firestore reads for browsing.** Before each build, `scripts/build-data.mjs` runs one REST
  query for `businesses` where `status == 'verified'` (plus `categories/catalog`) and writes small
  JSON files to `public/data/`. Home, search, filters, category, city and business pages all read
  those files from the CDN.
- **Every listing is a real page.** Each business, category and city is prerendered to HTML with
  title, description, canonical, Open Graph and JSON-LD (`LocalBusiness`, `BreadcrumbList`,
  `ItemList`, `FAQPage`, `WebSite` search box). `sitemap.xml` and `robots.txt` are generated too.
- **Firebase loads only when needed** (sign-in, saving, reviews, reports), so it isn't in the
  initial bundle. Reads that do happen: 1 profile read per session, review summary (aggregate
  query) and 5 reviews when the reviews section scrolls into view, and 1 read for a listing
  approved after the last build.
- Firestore rules and indexes are owned by `apneyy-admin`; collections used here are
  `businesses` (read, verified only), `members/{uid}`, `reviews/{businessId_uid}` and
  `listingReports`.

## Commands

```bash
npm install
npm start               # fetches data, then ng serve on :4200
npm run build           # fetches data, then builds + prerenders to dist/apneyy-web/browser
npm run data:sample     # use bundled sample listings
npm run images          # fetch stock photos listed in scripts/images/images.json
```

## Environment variables (build time)

| Variable | Default | Meaning |
| --- | --- | --- |
| `SITE_URL` | `https://www.apneyy.com` | Origin used for canonical URLs and the sitemap |
| `APNEYY_STRICT_DATA` | unset | `1` = fail the build if Firestore can't be read, and never fall back to sample data. **Set this in production.** |
| `APNEYY_SAMPLE_DATA` | unset | `1` = always use the sample listings (preview environments) |

Without `APNEYY_STRICT_DATA`, a build with no readable verified listings uses clearly labelled
sample data, shows a preview banner and blocks search engines.

## AWS Amplify

Static hosting (not SSR). `amplify.yml` is included; output is `dist/apneyy-web/browser`.

Add this rewrite in **Amplify > Hosting > Rewrites and redirects** so listings approved after the
last build still open (the app fetches them live):

| Source | Target | Type |
| --- | --- | --- |
| `</^[^.]+$/>` | `/index.csr.html` | 404 (Rewrite) |

Keeping the site fresh: create an **incoming webhook** in Amplify and
- give its URL to the admin portal (it triggers a rebuild after approving or editing a live listing), and
- save it as the GitHub secret `AMPLIFY_WEBHOOK_URL` for the nightly rebuild in `.github/workflows/nightly-rebuild.yml`.

## UI notes

- Animations: View Transitions between pages (card photo morphs into the business header),
  scroll reveal, hero word rotation, stat count-up, carousels with snap, drag and autoplay,
  heart pop on save, skeleton loaders, toasts, bottom-sheet filters on mobile. All respect
  `prefers-reduced-motion`.
- Guided tours: a home tour and a search tour run once per browser; "Take the quick tour" in the
  footer replays them.
- Imagery: no emoji. Category, diet and hero pictures are Unsplash photos (Unsplash licence,
  free for commercial use) bundled in `public/img` as 3:2 WebP at 480/960/1440px, served with
  `srcset` and lazy loading through `<app-photo>`. A category without its own photo uses its
  group's photo. To add or swap one, put the Unsplash photo id in
  `scripts/images/images.json` and run `npm run images` (behind a proxy:
  `NODE_USE_ENV_PROXY=1`). Small icons are a Lucide subset in `shared/icons.ts`
  (`<app-icon name="phone" />`); category icons are Lucide names, and old emoji values in the
  admin catalog are ignored.
- A business without photos shows its category photo with a category label, so it never looks
  like a picture of the place itself.
