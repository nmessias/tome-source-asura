/**
 * tome-source-asura — AsuraScans source plugin for Tome.
 *
 * Exports a `source` (Source) and a `feature` (Feature). Load with:
 *   bun add github:nmessias/tome-source-asura
 *   TOME_PLUGINS=tome-source-asura   # (append to existing list)
 *
 * Types and shared runtime come from the `tome` package (core).
 */
import type { Feature } from "tome";
import { asuraSource as source } from "./source";
import { migrateAsura } from "./migrations";

const feature: Feature = {
  name: "asura",
  migrations: migrateAsura,
};

export { source, feature };
