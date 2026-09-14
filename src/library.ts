/**
 * AsuraScans local library service — mirrors tome-source-freewebnovel's
 * library (own table, per-user progress), nothing Asura-account specific.
 */
import { Database } from "bun:sqlite";
import { DB_PATH } from "tome";

export interface AsuraLibraryEntry {
  id: number;
  userId: string;
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  description: string | null;
  totalChapters: number;
  lastChapterRead: number;
  lastChapterSlug: string | null;
  addedAt: number;
  lastReadAt: number | null;
}

function getDb(): Database {
  return new Database(DB_PATH);
}

export function addToLibrary(
  userId: string,
  slug: string,
  title: string,
  author?: string,
  coverUrl?: string,
  description?: string,
  totalChapters?: number
): void {
  const db = getDb();
  try {
    db.run(
      `INSERT INTO asura_library (userId, slug, title, author, coverUrl, description, totalChapters, addedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
       ON CONFLICT(userId, slug) DO UPDATE SET
         title = excluded.title,
         author = COALESCE(excluded.author, asura_library.author),
         coverUrl = COALESCE(excluded.coverUrl, asura_library.coverUrl),
         description = COALESCE(excluded.description, asura_library.description),
         totalChapters = COALESCE(excluded.totalChapters, asura_library.totalChapters)`,
      [userId, slug, title, author || null, coverUrl || null, description || null, totalChapters || 0]
    );
  } finally {
    db.close();
  }
}

export function removeFromLibrary(userId: string, slug: string): void {
  const db = getDb();
  try {
    db.run(`DELETE FROM asura_library WHERE userId = ? AND slug = ?`, [
      userId,
      slug,
    ]);
  } finally {
    db.close();
  }
}

export function getLibrary(userId: string): AsuraLibraryEntry[] {
  const db = getDb();
  try {
    return db.query(
      `SELECT * FROM asura_library WHERE userId = ?
       ORDER BY COALESCE(lastReadAt, addedAt) DESC`
    ).all(userId) as AsuraLibraryEntry[];
  } finally {
    db.close();
  }
}

export function getLibraryEntry(
  userId: string,
  slug: string
): AsuraLibraryEntry | null {
  const db = getDb();
  try {
    return db.query(
      `SELECT * FROM asura_library WHERE userId = ? AND slug = ?`
    ).get(userId, slug) as AsuraLibraryEntry | null;
  } finally {
    db.close();
  }
}

export function isInLibrary(userId: string, slug: string): boolean {
  const db = getDb();
  try {
    return !!db.query(
      `SELECT 1 FROM asura_library WHERE userId = ? AND slug = ?`
    ).get(userId, slug);
  } finally {
    db.close();
  }
}

export function updateProgress(
  userId: string,
  slug: string,
  chapterNum: number,
  chapterSlug?: string
): void {
  const db = getDb();
  try {
    db.run(
      `UPDATE asura_library
       SET lastChapterRead = MAX(lastChapterRead, ?),
           lastChapterSlug = CASE WHEN ? > lastChapterRead THEN ? ELSE lastChapterSlug END,
           lastReadAt = unixepoch()
       WHERE userId = ? AND slug = ?`,
      [chapterNum, chapterNum, chapterSlug || String(chapterNum), userId, slug]
    );
  } finally {
    db.close();
  }
}

export function updateTotalChapters(
  userId: string,
  slug: string,
  totalChapters: number
): void {
  const db = getDb();
  try {
    db.run(`UPDATE asura_library SET totalChapters = ? WHERE userId = ? AND slug = ?`, [
      totalChapters,
      userId,
      slug,
    ]);
  } finally {
    db.close();
  }
}
