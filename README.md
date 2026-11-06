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
- `src/core/rates.json` — the single source of rates, with sources and check date.

Development is done with the help of Claude Code (Anthropic).
