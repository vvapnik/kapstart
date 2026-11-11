/**
 * UI strings and URLs for the v1 languages.
 *
 * de.json is the reference: its shape is the `Strings` type, and en.json / ru.json must
 * have exactly the same keys. `tsc` reports a wrong shape, and `assertSameKeys` below
 * throws at import time, so `astro build` fails as well when a key is missing or extra.
 */
import de from "./de.json";
import en from "./en.json";
import ru from "./ru.json";
import type { Lang, StateCode } from "../core/rates";

export type Strings = typeof de;
export type CalculatorStrings = Strings["calc"];

export const LANGS: readonly Lang[] = ["de", "en", "ru"];
export const DEFAULT_LANG: Lang = "de";

/** Lists every key path of a JSON object, e.g. "site.stand". */
export function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

/** Throws if `other` lacks a key of `ref` or has a key `ref` does not have. */
export function assertSameKeys(ref: unknown, other: unknown, name: string): void {
  const a = new Set(keyPaths(ref));
  const b = new Set(keyPaths(other));
  const missing = [...a].filter((k) => !b.has(k));
  const extra = [...b].filter((k) => !a.has(k));
  if (missing.length || extra.length) {
    throw new Error(
      `i18n/${name}.json does not match de.json.` +
        (missing.length ? ` Missing: ${missing.join(", ")}.` : "") +
        (extra.length ? ` Extra: ${extra.join(", ")}.` : ""),
    );
  }
}

// `satisfies` makes tsc check en/ru against the type inferred from de.json.
const STRINGS = { de, en, ru } satisfies Record<Lang, Strings>;
for (const lang of LANGS) assertSameKeys(de, STRINGS[lang], lang);

export function t(lang: Lang): Strings {
  return STRINGS[lang];
}

export function isLang(x: string | undefined): x is Lang {
  return (LANGS as readonly string[]).includes(x ?? "");
}

// --- URLs ------------------------------------------------------------------

/** Localized path segment of the state pages: /de/kaufnebenkosten/nrw/. */
export const SECTION: Record<Lang, string> = {
  de: "kaufnebenkosten",
  en: "closing-costs",
  ru: "raskhody-pri-pokupke",
};

/** State slugs: German names, the way people search for them in every language. */
export const STATE_SLUG: Record<StateCode, string> = {
  BW: "baden-wuerttemberg",
  BY: "bayern",
  BE: "berlin",
  BB: "brandenburg",
  HB: "bremen",
  HH: "hamburg",
  HE: "hessen",
  MV: "mecklenburg-vorpommern",
  NI: "niedersachsen",
  NW: "nrw",
  RP: "rheinland-pfalz",
  SL: "saarland",
  SN: "sachsen",
  ST: "sachsen-anhalt",
  SH: "schleswig-holstein",
  TH: "thueringen",
};

export function homePath(lang: Lang): string {
  return `/${lang}/`;
}

export function statePath(lang: Lang, code: StateCode): string {
  return `/${lang}/${SECTION[lang]}/${STATE_SLUG[code]}/`;
}

/** Number formatting shared by pages and tables. */
export function formatters(lang: Lang) {
  const loc = t(lang).calc.loc;
  // Narrow no-break spaces (ru) render inconsistently; use a plain no-break space.
  const nf = (n: number, o?: Intl.NumberFormatOptions) =>
    n.toLocaleString(loc, o).replace(/ /g, " ");
  return {
    nf,
    eur: (n: number) => `${nf(n)} €`,
    pct: (n: number) => `${nf(n, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`,
    date: (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }),
  };
}
