/**
 * AsuraScans source adapter — comics (manhwa/manga/manhua) for Tome.
 *
 * Content comes from Asura's public JSON API (see api.ts); no scraping, no
 * account needed. Refs: fiction = API slug, chapter = chapter number.
 * Read in the reader's scrolled mode (paged multicol would slice tall panels).
 */
import type { Source } from "tome";
import type { Fiction, LibraryEntry } from "tome";
import { searchComics, getComic, getComicChapter } from "./api";
import {
  getLibrary,
  getLibraryEntry,
  isInLibrary,
  addToLibrary,
  removeFromLibrary,
  updateProgress,
  updateTotalChapters,
} from "./library";

const ASURA = "asura";

function parseChapterNum(ref: string): number | null {
  const num = parseInt(ref, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export const asuraSource: Source = {
  name: ASURA,
  displayName: "AsuraScans",
  description: "Read comics from asurascans.com — best in scrolled mode",
  capabilities: {
    search: true,
    follows: false,
    history: false,
    toplists: false,
    readLater: false,
    bookmarks: false,
    library: true,
    credentials: false,
  },
  navLinks: [
    { href: `/read/${ASURA}/search`, label: "Search" },
    { href: `/read/${ASURA}/library`, label: "Library" },
  ],
  libraryActions: [{ href: `/read/${ASURA}/search`, label: "Search Comics" }],

  // ---- core trio ----
  async search(query) {
    return searchComics(query);
  },
  async getFiction(ref, userId): Promise<Fiction | null> {
    const fiction = await getComic(ref);
    if (!fiction || !userId) return fiction;
    if (isInLibrary(userId, ref)) {
      const entry = getLibraryEntry(userId, ref);
      const lastChapterRead = entry?.lastChapterRead || 0;
      if (fiction.chapters?.length) {
        updateTotalChapters(userId, ref, fiction.chapters.length);
      }
      fiction.isInLibrary = true;
      if (lastChapterRead > 0) {
        const nums = (fiction.chapters || []).map((c) => c.id as number);
        const next = nums.find((n) => n > lastChapterRead);
        if (next !== undefined) {
          fiction.continueChapterSlug = String(next);
          fiction.continueChapterLabel = `Ch. ${next}`;
        }
        fiction.chapters = fiction.chapters?.map((c) => ({
          ...c,
          isRead: (c.id as number) <= lastChapterRead,
        }));
      }
    }
    return fiction;
  },
  async getChapter(ref, chapterRef, userId) {
    const num = parseChapterNum(chapterRef);
    if (num === null) return null;
    const chapter = await getComicChapter(ref, num);
    if (!chapter) return null;
    if (userId && isInLibrary(userId, ref)) {
      updateProgress(userId, ref, num, String(num));
    }
    return chapter;
  },

  // ---- capability ops ----
  async getLibrary(userId): Promise<LibraryEntry[]> {
    return getLibrary(userId).map((e) => ({
      ref: e.slug,
      kind: "series",
      title: e.title,
      author: e.author ?? undefined,
      coverUrl: e.coverUrl ?? undefined,
      description: e.description ?? undefined,
      totalChapters: e.totalChapters,
      lastChapterRead: e.lastChapterRead,
      continueChapterRef:
        e.lastChapterRead > 0 &&
        (e.totalChapters === 0 || e.lastChapterRead < e.totalChapters)
          ? String(e.lastChapterRead + 1)
          : undefined,
      completed: e.totalChapters > 0 && e.lastChapterRead >= e.totalChapters,
    }));
  },
  isInLibrary(userId, ref) {
    return isInLibrary(userId, ref);
  },
  async addToLibrary(userId, ref) {
    try {
      const fiction = await getComic(ref);
      if (fiction) {
        addToLibrary(
          userId,
          ref,
          fiction.title,
          fiction.author,
          fiction.coverUrl,
          fiction.description,
          fiction.chapters?.length
        );
      } else {
        addToLibrary(userId, ref, ref);
      }
    } catch {
      addToLibrary(userId, ref, ref);
    }
  },
  removeFromLibrary(userId, ref) {
    removeFromLibrary(userId, ref);
  },
  updateProgress(userId, fictionRef, chapterRef) {
    const num = parseChapterNum(chapterRef);
    if (num === null) return;
    if (isInLibrary(userId, fictionRef)) {
      updateProgress(userId, fictionRef, num, String(num));
    }
  },
};
