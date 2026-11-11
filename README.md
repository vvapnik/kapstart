# Kapstart

Welches Haus deckt mein Eigenkapital bei 100 % Finanzierung? Kapstart rechnet für alle
16 Bundesländer aus, bis zu welchem Kaufpreis das Eigenkapital die Kaufnebenkosten
(Grunderwerbsteuer, Notar und Grundbuch, Makler) deckt.

Site: `kapstart.vapnik.de` (not live yet).

## Development

```bash
npm install
npm test        # Vitest: formula and rates
npm run dev     # Astro dev server
npm run build   # static site in dist/
```

- `src/core/calc.ts` — the formula, plain TypeScript without dependencies.
- `src/core/rates.json` — the single source of rates (incl. GrESt history), with sources and check date.
- `src/i18n/{de,en,ru}.json` — UI strings; `de.json` is the reference, a missing or extra
  key in another language fails the build.
- `src/content/states/{lang}/{state}.md` — prose and FAQ of the 48 state pages,
  `src/content/pages/{lang}/index.md` — start pages. A missing file fails the build.
  Numbers are never written into the Markdown tables: they come from `src/core`.
- URLs: `/` → 301 to `/de/` (fixed, not by Accept-Language), `/{lang}/` calculator,
  `/{lang}/{kaufnebenkosten|closing-costs|raskhody-pri-pokupke}/{state}/`.

Development is done with the help of Claude Code (Anthropic).
