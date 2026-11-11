import { describe, expect, it } from "vitest";
import de from "./de.json";
import { LANGS, SECTION, STATE_SLUG, assertSameKeys, statePath, t } from "./index";
import { STATES } from "../core/rates";

describe("i18n", () => {
  it("has the same keys in every language", () => {
    for (const lang of LANGS) expect(() => assertSameKeys(de, t(lang), lang)).not.toThrow();
  });

  it("reports a missing key", () => {
    const broken = structuredClone(de) as Record<string, any>;
    delete broken.site.stand;
    expect(() => assertSameKeys(de, broken, "xx")).toThrow(/Missing: site\.stand/);
  });

  it("has no empty strings", () => {
    for (const lang of LANGS)
      for (const v of Object.values(t(lang)).flatMap((g) => Object.values(g)))
        expect(String(v).trim(), lang).not.toBe("");
  });

  it("builds unique, URL-safe state paths", () => {
    const paths = LANGS.flatMap((l) => STATES.map((s) => statePath(l, s.code)));
    expect(new Set(paths).size).toBe(48);
    for (const p of paths) expect(p).toMatch(/^\/[a-z]{2}\/[a-z-]+\/[a-z-]+\/$/);
    expect(statePath("de", "NW")).toBe("/de/kaufnebenkosten/nrw/");
    expect(Object.keys(STATE_SLUG)).toHaveLength(16);
    expect(Object.keys(SECTION)).toEqual([...LANGS]);
  });
});
