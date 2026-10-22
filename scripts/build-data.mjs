#!/usr/bin/env node
/**
 * Builds the static directory that the public site reads instead of Firestore.
 *
 * Runs before every build (npm "prebuild"). It makes one paged REST query for
 * businesses with status == 'verified' plus one read of categories/catalog, and
 * writes small JSON files under public/data/. Visitors browsing, searching and
 * filtering then cost zero Firestore reads; the CDN serves everything.
 *
 * Also writes public/sitemap.xml and prerender-routes.txt (one prerendered page
 * per business, category and city).
 *
 * Env:
 *   SITE_URL             Canonical origin, default https://www.apneyy.com
 *   APNEYY_SAMPLE_DATA=1 Use the bundled sample businesses (preview deployments only)
 *   APNEYY_STRICT_DATA=1 Fail the build when Firestore can't be read, and never fall
 *                        back to sample data. Turn on for production.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleBusinesses } from './sample-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'data');

const PROJECT_ID = 'apneyy-5cb5d';
const API_KEY = 'AIzaSyAB-RwsOZVsIBSPL1MY43yuT4YLyxQ405E';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_URL = (process.env.SITE_URL || 'https://www.apneyy.com').replace(/\/+$/, '');
const USE_SAMPLE = process.env.APNEYY_SAMPLE_DATA === '1';
const STRICT = process.env.APNEYY_STRICT_DATA === '1';
const PAGE_SIZE = 300;

// ---------------------------------------------------------------------------
// Firestore REST decoding
// ---------------------------------------------------------------------------
function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return { lat: v.geoPointValue.latitude, lng: v.geoPointValue.longitude };
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.error?.message || body?.[0]?.error?.message || res.statusText;
    const err = new Error(`${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function fetchVerifiedBusinesses() {
  const all = [];
  let last = null;
  for (;;) {
    const structuredQuery = {
      from: [{ collectionId: 'businesses' }],
      where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'verified' } } },
      orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
      limit: PAGE_SIZE,
    };
    if (last) structuredQuery.startAt = { values: [{ referenceValue: last }], before: false };
    const rows = await fetchJson(`${BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    });
    const docs = rows.filter(r => r.document).map(r => r.document);
    for (const d of docs) {
      all.push({ id: d.name.split('/').pop(), ...decodeFields(d.fields || {}), _updateTime: d.updateTime });
    }
    if (docs.length < PAGE_SIZE) break;
    last = docs[docs.length - 1].name;
  }
  return all;
}

async function fetchCatalog() {
  try {
    const doc = await fetchJson(`${BASE}/categories/catalog?key=${API_KEY}`);
    const data = decodeFields(doc.fields || {});
    return Array.isArray(data.items) ? data.items : null;
  } catch (e) {
    if (e.status !== 404) console.warn(`[data] categories/catalog not read (${e.message}); using built-in categories.`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Shaping
// ---------------------------------------------------------------------------
const str = v => (typeof v === 'string' ? v.trim() : '');
const arr = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : []);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function slugify(s) {
  return str(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function cleanHours(h) {
  if (!h || typeof h !== 'object') return null;
  const out = {};
  let any = false;
  for (const d of WEEKDAYS) {
    const day = h[d];
    const ranges = Array.isArray(day?.ranges)
      ? day.ranges.filter(r => /^\d\d:\d\d$/.test(r?.open) && /^\d\d:\d\d$/.test(r?.close)).map(r => ({ open: r.open, close: r.close }))
      : [];
    out[d] = { isOpen: !!day?.isOpen && ranges.length > 0, ranges };
    if (out[d].isOpen) any = true;
  }
  return any ? out : null;
}

function toMillis(v) {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

function cleanLinks(o) {
  const out = {};
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (str(v)) out[k] = str(v);
  return out;
}

/** The public shape of a business. Never includes owner, compliance or audit fields. */
function toPublicBusiness(raw) {
  const a = raw.address || {};
  const city = str(a.city);
  const state = str(a.state).toUpperCase();
  const slug = slugify(raw.slug) || raw.id;
  return {
    id: raw.id,
    slug,
    name: str(raw.name),
    nameNative: str(raw.nameNative),
    category: str(raw.category) || 'other_service',
    connections: arr(raw.indianConnection),
    cuisines: arr(raw.cuisines),
    dietary: arr(raw.dietary),
    services: arr(raw.services),
    amenities: arr(raw.amenities),
    tags: arr(raw.tags).slice(0, 20),
    languages: arr(raw.languagesSpoken),
    description: str(raw.description),
    phone: str(raw.phone),
    phoneDisplay: str(raw.phoneDisplay) || str(raw.phone),
    email: str(raw.email),
    website: str(raw.website),
    menuUrl: str(raw.menuUrl),
    orderingLinks: cleanLinks(raw.orderingLinks),
    socialLinks: cleanLinks(raw.socialLinks),
    address: {
      line1: str(a.line1),
      line2: str(a.line2),
      city,
      state,
      postalCode: str(a.postalCode),
      timezone: str(a.timezone) || 'America/New_York',
      lat: num(a.lat),
      lng: num(a.lng),
    },
    openingHours: cleanHours(raw.openingHours),
    priceRange: str(raw.priceRange),
    paymentMethods: arr(raw.paymentMethods),
    featuredItems: (Array.isArray(raw.featuredItems) ? raw.featuredItems : [])
      .filter(i => str(i?.name))
      .slice(0, 12)
      .map(i => ({ name: str(i.name), price: str(i.price), description: str(i.description), isVeg: !!i.isVeg })),
    photos: arr(raw.photos).slice(0, 10),
    logo: str(raw.logo),
    licenseNumber: str(raw.licenseNumber),
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt) || toMillis(raw._updateTime),
    cityKey: `${state.toLowerCase()}/${slugify(city)}`,
  };
}

/** The compact card shape used by search, lists and carousels. */
function toEntry(b) {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    nameNative: b.nameNative,
    category: b.category,
    city: b.address.city,
    state: b.address.state,
    postalCode: b.address.postalCode,
    cityKey: b.cityKey,
    tags: b.tags.slice(0, 8),
    languages: b.languages,
    dietary: b.dietary,
    cuisines: b.cuisines,
    services: b.services,
    connections: b.connections,
    priceRange: b.priceRange,
    photo: b.photos[0] || '',
    logo: b.logo,
    summary: b.description.length > 160 ? b.description.slice(0, 157).replace(/\s+\S*$/, '') + '…' : b.description,
    hours: b.openingHours,
    timezone: b.address.timezone,
    lat: b.address.lat,
    lng: b.address.lng,
    createdAt: b.createdAt,
  };
}

function distanceKm(a, b) {
  if (a.lat == null || b.lat == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Up to 8 related businesses: same category nearby first, then same city. */
function similarTo(b, entries) {
  const me = { lat: b.address.lat, lng: b.address.lng };
  return entries
    .filter(e => e.id !== b.id)
    .map(e => {
      let score = 0;
      if (e.category === b.category) score += 10;
      if (e.cityKey === b.cityKey) score += 6;
      else if (e.state === b.address.state) score += 2;
      const d = distanceKm(me, e);
      if (d != null) score += Math.max(0, 5 - d / 10);
      score += e.tags.filter(t => b.tags.includes(t)).length;
      return { e, score };
    })
    .filter(x => x.score >= 6)
    .sort((x, y) => y.score - x.score)
    .slice(0, 8)
    .map(x => x.e);
}

const xmlEscape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function write(rel, data) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let raw = [];
  let catalog = null;
  let source = 'firestore';

  if (USE_SAMPLE) {
    raw = sampleBusinesses();
    source = 'sample';
  } else {
    try {
      [raw, catalog] = await Promise.all([fetchVerifiedBusinesses(), fetchCatalog()]);
    } catch (e) {
      const hint = e.status === 403 ? ' Deploy firestore.rules from apneyy-admin so verified listings are publicly readable.' : '';
      if (STRICT) {
        console.error(`[data] Could not read businesses: ${e.message.replace(/\.+$/, "")}.${hint}`);
        process.exit(1);
      }
      console.warn(`[data] Could not read businesses: ${e.message.replace(/\.+$/, "")}.${hint}`);
      source = 'unavailable';
    }
    // Until real listings are live, show clearly-labelled sample data (never indexed)
    // rather than an empty site. Production sets APNEYY_STRICT_DATA=1.
    if (!raw.length && !STRICT) {
      console.warn('[data] No verified businesses yet; using sample data with a preview banner.');
      raw = sampleBusinesses();
      source = 'sample';
    }
  }

  const businesses = raw
    .map(toPublicBusiness)
    .filter(b => b.name && b.address.city && b.address.state);

  // Two listings can't share a URL.
  const seen = new Set();
  for (const b of businesses) {
    if (seen.has(b.slug)) b.slug = `${b.slug}-${b.id.slice(0, 5).toLowerCase()}`;
    seen.add(b.slug);
  }

  businesses.sort((a, b) => b.createdAt - a.createdAt || a.name.localeCompare(b.name));
  const entries = businesses.map(toEntry);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const generatedAt = new Date().toISOString();
  const sample = source === 'sample';

  // Cities
  const cityMap = new Map();
  for (const e of entries) {
    const c = cityMap.get(e.cityKey) || { key: e.cityKey, city: e.city, state: e.state, count: 0, categories: {} };
    c.count++;
    c.categories[e.category] = (c.categories[e.category] || 0) + 1;
    cityMap.set(e.cityKey, c);
  }
  const cities = [...cityMap.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

  // Categories, languages
  const categoryCounts = {};
  const languageCounts = {};
  for (const e of entries) {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    for (const l of e.languages) languageCounts[l] = (languageCounts[l] || 0) + 1;
  }

  write('catalog.json', { items: catalog });
  write('directory.json', { generatedAt, sample, entries });
  write('cities.json', { cities: cities.map(({ categories, ...c }) => c) });
  write('home.json', {
    generatedAt,
    sample,
    total: entries.length,
    newest: entries.slice(0, 12),
    cities: cities.slice(0, 12).map(({ categories, ...c }) => c),
    cityCount: cities.length,
    categoryCounts,
    languageCounts,
  });

  for (const b of businesses) {
    write(`b/${b.slug}.json`, { business: b, similar: similarTo(b, entries), sample });
  }
  for (const id of Object.keys(categoryCounts)) {
    const list = entries.filter(e => e.category === id);
    const cityCounts = {};
    for (const e of list) cityCounts[e.cityKey] = (cityCounts[e.cityKey] || 0) + 1;
    write(`category/${id}.json`, {
      id,
      entries: list,
      cities: Object.entries(cityCounts)
        .map(([key, count]) => ({ ...cityMap.get(key), count, categories: undefined }))
        .sort((a, b) => b.count - a.count),
      sample,
    });
  }
  for (const c of cities) {
    write(`city/${c.key.replace('/', '-')}.json`, {
      city: c.city,
      state: c.state,
      key: c.key,
      categoryCounts: c.categories,
      entries: entries.filter(e => e.cityKey === c.key),
      sample,
    });
  }

  // Prerender routes. Static pages are discovered from the router.
  const routes = [
    ...businesses.map(b => `/business/${b.slug}`),
    ...Object.keys(categoryCounts).map(id => `/category/${id}`),
    ...cities.map(c => `/city/${c.key}`),
  ];
  writeFileSync(join(ROOT, 'prerender-routes.txt'), routes.join('\n') + '\n');

  // Sitemap. Sample data is never indexed.
  const today = generatedAt.slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/search', priority: '0.8', changefreq: 'daily' },
    { loc: '/categories', priority: '0.7', changefreq: 'weekly' },
    { loc: '/cities', priority: '0.7', changefreq: 'weekly' },
    { loc: '/about', priority: '0.4', changefreq: 'monthly' },
  ];
  if (!sample) {
    for (const id of Object.keys(categoryCounts)) urls.push({ loc: `/category/${id}`, priority: '0.7', changefreq: 'daily' });
    for (const c of cities) urls.push({ loc: `/city/${c.key}`, priority: '0.7', changefreq: 'daily' });
    for (const b of businesses) {
      urls.push({ loc: `/business/${b.slug}`, priority: '0.6', changefreq: 'weekly', lastmod: b.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : today });
    }
  }
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(u => `  <url><loc>${xmlEscape(SITE_URL + u.loc)}</loc><lastmod>${u.lastmod || today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
      .join('\n') +
    '\n</urlset>\n';
  writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap);
  writeFileSync(
    join(ROOT, 'public', 'robots.txt'),
    sample ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /saved\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  // The app reads the canonical origin from here.
  writeFileSync(
    join(ROOT, 'src', 'environments', 'site.generated.ts'),
    `// Written by scripts/build-data.mjs. Do not edit.\nexport const SITE = { url: ${JSON.stringify(SITE_URL)}, sample: ${sample}, generatedAt: ${JSON.stringify(generatedAt)} };\n`
  );

  console.log(`[data] ${source}: ${businesses.length} businesses, ${cities.length} cities, ${Object.keys(categoryCounts).length} categories -> public/data (${routes.length} prerender routes)`);
}

main().catch(e => {
  console.error('[data] failed:', e);
  process.exit(1);
});
