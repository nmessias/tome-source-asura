/**
 * AsuraScans migrations — asura_library table for local progress tracking.
 */
import type { Database } from "bun:sqlite";

export function migrateAsura(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS "asura_library" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "userId" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "author" TEXT,
      "coverUrl" TEXT,
      "description" TEXT,
      "totalChapters" INTEGER DEFAULT 0,
      "lastChapterRead" INTEGER DEFAULT 0,
      "lastChapterSlug" TEXT,
      "addedAt" INTEGER NOT NULL,
      "lastReadAt" INTEGER,
      UNIQUE("userId", "slug"),
      FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS "idx_asura_library_user"
    ON "asura_library" ("userId", "lastReadAt" DESC)
  `);
}
