# tome-source-asura

AsuraScans source plugin for [Tome](https://github.com/nmessias/tome) — read
manhwa/manga/manhua on e-ink and mobile. Content comes from Asura's public
JSON API (no scraping, no account). Capabilities: `search`, local `library`.

## Install

```bash
bun add github:nmessias/tome-source-asura
# append to the existing list in .env:
# TOME_PLUGINS=tome-source-royalroad,tome-source-freewebnovel,tome-source-asura
# restart Tome
```

## Reading comics

Chapters are full-page images — use the reader's **scrolled mode**
(settings → mode). Paged multicol will slice tall panels.

## Refs

- Fiction ref = API slug (`nano-machine`)
- Chapter ref = chapter number (`329`)

## Notes

- Premium (`is_premium`) chapters are skipped — they need an Asura account,
  which this plugin doesn't model. They 404 like any missing chapter.
- Novels (`type: novel` in search) are not readable yet — the novels API is a
  separate surface. Comics only for now.
