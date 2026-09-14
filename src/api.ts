/**
 * AsuraScans API client — pure JSON, no scraping.
 *
 * Endpoints (verified 2026-09 against api.asurascans.com):
 *   GET /api/search?q=                    -> { data: SeriesSummary[] }
 *   GET /api/series/:slug                 -> { series: SeriesDetail }
 *   GET /api/series/:slug/chapters        -> { data: ChapterMeta[] } (newest first, unpaginated)
 *   GET /api/series/:slug/chapters/:num   -> { data: { chapter: { pages: [{ url }] } } }
 *
 * Site slugs carry a hash suffix (/comics/x-6f7fe6eb); the API uses the bare
 * slug, which is also what `public_url` strips down to. Refs are bare slugs.
 * Premium chapters may 403 without an Asura account — callers map that to null.
 */
import type { Chapter, ChapterContent, Fiction } from "tome";

const API = "https://api.asurascans.com/api";
const ASURA = "asura";

interface Genre {
  name: string;
}

interface SeriesSummary {
  id: number;
  slug: string;
  title: string;
  description?: string;
  cover?: string;
  status?: string;
  type?: string;
  author?: string;
  rating?: number;
  genres?: Genre[];
  chapter_count?: number;
}

interface ChapterMeta {
  number: number;
  slug: string;
  page_count: number;
  is_premium: boolean;
  published_at?: string;
}

interface ChapterPage {
  url: string;
}

async function get<T>(path: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "User-Agent": "Tome/1.5 (e-ink reader proxy)" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toFiction(s: SeriesSummary): Fiction {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    author: s.author || "Unknown",
    url: `/read/${ASURA}/${s.slug}`,
    coverUrl: s.cover,
    description: s.description,
    tags: s.genres?.map((g) => g.name),
    stats: s.rating ? { rating: Math.min(5, s.rating / 2) } : undefined,
  };
}

export async function searchComics(query: string): Promise<Fiction[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await get<{ data: SeriesSummary[] }>(
    `/search?q=${encodeURIComponent(q)}`
  );
  return (res?.data || []).map(toFiction);
}

export async function getComic(ref: string): Promise<Fiction | null> {
  const res = await get<{ series: SeriesSummary }>(
    `/series/${encodeURIComponent(ref)}`
  );
  if (!res?.series) return null;
  const fiction = toFiction(res.series);
  const chapters = await get<{ data: ChapterMeta[] }>(
    `/series/${encodeURIComponent(ref)}/chapters`
  );
  const metas = (chapters?.data || []).filter((c) => !c.is_premium);
  fiction.chapters = metas
    .slice()
    .sort((a, b) => a.number - b.number)
    .map(
      (c): Chapter => ({
        id: c.number,
        slug: String(c.number),
        title: `Chapter ${c.number}`,
        url: `/read/${ASURA}/${ref}/${c.number}`,
        date: c.published_at,
      })
    );
  return fiction;
}

export async function getComicChapter(
  ref: string,
  num: number
): Promise<ChapterContent | null> {
  const [pagesRes, chaptersRes] = await Promise.all([
    get<{ data: { chapter: { pages: ChapterPage[] } } }>(
      `/series/${encodeURIComponent(ref)}/chapters/${num}`
    ),
    get<{ data: ChapterMeta[] }>(`/series/${encodeURIComponent(ref)}/chapters`),
  ]);
  const pages = pagesRes?.data?.chapter?.pages || [];
  if (!pages.length) return null;
  const nums = (chaptersRes?.data || [])
    .filter((c) => !c.is_premium)
    .map((c) => c.number)
    .sort((a, b) => a - b);
  const prev = nums.filter((n) => n < num).pop();
  const next = nums.find((n) => n > num);
  const content = pages
    .map(
      (p, i) =>
        `<img src=\"${p.url}\" alt=\"Page ${i + 1}\" loading=\"lazy\" decoding=\"async\" referrerpolicy=\"no-referrer\" />`
    )
    .join("\n");
  return {
    id: num,
    fictionId: 0,
    fictionSlug: ref,
    chapterSlug: String(num),
    title: `Chapter ${num}`,
    content,
    ref: String(num),
    fictionRef: ref,
    prevRef: prev !== undefined ? String(prev) : null,
    nextRef: next !== undefined ? String(next) : null,
    prevChapterUrl:
      prev !== undefined ? `/read/${ASURA}/${ref}/${prev}` : undefined,
    nextChapterUrl:
      next !== undefined ? `/read/${ASURA}/${ref}/${next}` : undefined,
    fictionUrl: `/read/${ASURA}/${ref}`,
  };
}
