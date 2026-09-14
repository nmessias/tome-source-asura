/**
 * Latest-chapters feed — parsed from the Asura homepage's embedded Astro
 * island data (no JSON API exists for it). Each item carries comic_slug,
 * number, time_ago, comic_cover and type. Filtered to comics (no novels),
 * premium skipped, 15-minute in-memory cache (homepage is ~700KB).
 */
export interface LatestItem {
  slug: string;
  title: string;
  chapter: number;
  timeAgo: string;
  cover: string;
}

const HOME = "https://asurascans.com/";
const TTL_MS = 15 * 60 * 1000;
const COMIC_TYPES = new Set(["manhwa", "manga", "manhua"]);

let cache: { at: number; items: LatestItem[] } | null = null;

function unquote(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw;
  }
}

function field(window: string, name: string): string | null {
  const m = window.match(new RegExp(`"${name}":\\[0,"([^"]*)"\\]`));
  return m ? unquote(m[1]) : null;
}

function numField(window: string, name: string): number | null {
  const m = window.match(new RegExp(`"${name}":\\[0,(\\d+)\\]`));
  return m ? parseInt(m[1], 10) : null;
}

function boolField(window: string, name: string): boolean {
  return window.includes(`"${name}":[0,true]`);
}

export async function getLatest(): Promise<LatestItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;
  const items = await fetchLatest().catch(() => [] as LatestItem[]);
  if (items.length) cache = { at: Date.now(), items };
  return cache?.items ?? items;
}

async function fetchLatest(): Promise<LatestItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(HOME, {
      headers: { "User-Agent": "Tome/1.5 (e-ink reader proxy)" },
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const html = (await res.text()).replace(/&quot;/g, '"');
    const items: LatestItem[] = [];
    const seen = new Set<string>();
    // Chapter entries are flat [0,{"id":...,"name":...}] blocks (no nested
    // objects) — match whole blocks so fields can never cross items.
    const re = /\[0,\{"id":\[0,\d+\](.*?)\}\]/gs;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const block = m[1];
      if (!block.includes('"comic_slug"')) continue;
      const slug = field(block, "comic_slug");
      const title = field(block, "comic_name");
      const chapter = numField(block, "number");
      if (!slug || !title || chapter === null) continue;
      const type = field(block, "type") || "";
      if (!COMIC_TYPES.has(type)) continue;
      if (boolField(block, "is_premium")) continue;
      const key = `${slug}/${chapter}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        slug,
        title,
        chapter,
        timeAgo: field(block, "time_ago") || "",
        cover: field(block, "comic_cover") || "",
      });
      if (items.length >= 60) break;
    }
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function latestPage(items: LatestItem[]): string {
  const cards = items
    .map(
      (it) => `
    <div class="card" style="display: flex; gap: 12px;">
      ${
        it.cover
          ? `<img src="${esc(it.cover)}" alt="" loading="lazy" style="width: 50px; height: 70px; object-fit: cover;" />`
          : ""
      }
      <div style="flex: 1; min-width: 0;">
        <div class="card-title">
          <a href="/read/asura/${esc(it.slug)}/${it.chapter}">${
            esc(it.title)
          } — Ch. ${it.chapter}</a>
        </div>
        <div class="card-meta">${esc(it.timeAgo)} · <a href="/read/asura/${esc(
          it.slug
        )}">series</a></div>
      </div>
    </div>`
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Latest Chapters - AsuraScans - Tome</title>
<link rel="stylesheet" href="/public/css/base.css" />
</head><body>
<header class="header"><a href="/" class="header-title">Tome</a>
<nav class="nav"><a href="/read/asura/search" class="nav-link">Search</a>
<a href="/read/asura/library" class="nav-link">Library</a>
<a href="/read/asura/latest" class="nav-link">Latest</a></nav></header>
<main class="main">
<h1>Latest Chapters</h1>
${
  items.length
    ? cards
    : "<p>Could not load the latest feed — try again in a few minutes.</p>"
}
</main></body></html>`;
}
