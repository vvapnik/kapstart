import { describe, expect, it } from "vitest";
import {
  costBreakdown,
  maxPrice,
  maxPriceForBasisPoints,
  toBasisPoints,
  totalPct,
  variants,
  type BrokerFilter,
} from "./calc";
import { RATES, STATES, getState, type StateCode } from "./rates";

const ALL_CODES: StateCode[] = [
  "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV",
  "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
];

// GrESt per Deutsches Notarinstitut, Stand 28.01.2026 (also used by the prototype).
const GREST: Record<StateCode, number> = {
  BW: 5.0, BY: 3.5, BE: 6.0, BB: 6.5, HB: 5.5, HH: 5.5, HE: 6.0, MV: 6.0,
  NI: 5.0, NW: 6.5, RP: 5.0, SL: 6.5, SN: 5.5, ST: 5.0, SH: 6.5, TH: 5.0,
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

describe("rates.json", () => {
  it("has exactly the 16 states, once each", () => {
    expect(STATES.map((s) => s.code).sort()).toEqual([...ALL_CODES].sort());
  });

  it("has the DNotI GrESt rates", () => {
    for (const s of STATES) expect(s.grestPct, s.code).toBe(GREST[s.code]);
  });

  it("has plausible notary and broker values", () => {
    for (const s of STATES) {
      expect(s.notaryPct, s.code).toBeGreaterThan(1);
      expect(s.notaryPct, s.code).toBeLessThanOrEqual(2.5);
      expect(s.brokerTotalPct, s.code).toBeGreaterThan(0);
      expect(s.brokerTotalPct, s.code).toBeLessThanOrEqual(7.14);
      // § 656c BGB: the buyer pays at most half; the table rounds the half to cents.
      expect(Math.abs(s.brokerBuyerPct - s.brokerTotalPct / 2), s.code).toBeLessThanOrEqual(0.005);
    }
  });

  it("has names in every language and valid dates", () => {
    for (const s of STATES) {
      for (const lang of ["de", "en", "ru"] as const) expect(s.name[lang], s.code).toBeTruthy();
      expect(s.grestSince, s.code).toMatch(isoDate);
    }
  });

  it("names a source with a date for every kind of rate", () => {
    expect(RATES.checked).toMatch(isoDate);
    for (const src of Object.values(RATES.sources)) {
      expect(src.url).toMatch(/^https:\/\//);
      expect(src.asOf).toMatch(isoDate);
      expect(src.asOf <= RATES.checked).toBe(true);
    }
  });

  it("rejects unknown codes", () => {
    expect(() => getState("XX" as StateCode)).toThrow();
  });
});

describe("maxPrice", () => {
  it("divides capital by the sum of percentages", () => {
    // BY: 3.5 + 2 + 3.57 = 9.07 % → 25 000 / 0.0907 = 275 633.9… → 275 600
    expect(totalPct("BY")).toBe(9.07);
    expect(maxPrice(25_000, "BY")).toBe(275_600);
    // Without broker: 5.5 % → 454 545.4… → 454 500
    expect(maxPrice(25_000, "BY", { withBroker: false })).toBe(454_500);
  });

  it("uses each state's own broker share by default", () => {
    // HE: 6 + 2 + 2.98 = 10.98 %
    expect(totalPct("HE")).toBe(10.98);
    expect(maxPrice(10_980, "HE")).toBe(100_000);
    // HH: 5.5 + 2 + 3.12
    expect(totalPct("HH")).toBe(10.62);
  });

  it("accepts overrides", () => {
    expect(totalPct("HE", { brokerPct: 3.57, notaryPct: 1.5 })).toBe(11.07);
    expect(totalPct("HE", { brokerPct: 3.57, withBroker: false })).toBe(8);
  });

  it("is exact at round numbers, where floating point would drift", () => {
    // 10 013 / 0.085 is exactly 117 800, but 10013 / (8.5 / 100) gives 117 799.999… in
    // floats, so the prototype shows 117 700. This is the one intended deviation.
    expect(Math.floor(10_013 / (8.5 / 100) / 100) * 100).toBe(117_700);
    expect(maxPrice(10_013, "NW", { withBroker: false })).toBe(117_800);
    expect(costBreakdown(117_800, "NW", { withBroker: false }).total).toBeCloseTo(10_013, 6);
    for (const s of STATES) {
      const bp = toBasisPoints(totalPct(s.code));
      // capital that buys exactly €100 000 or €1 000 000
      expect(maxPriceForBasisPoints(bp * 10, bp), s.code).toBe(100_000);
      expect(maxPriceForBasisPoints(bp * 100, bp), s.code).toBe(1_000_000);
      // one cent less drops to the step below
      expect(maxPriceForBasisPoints(bp * 10 - 0.01, bp), s.code).toBe(99_900);
    }
  });

  it("returns multiples of €100 whose costs fit the capital, for every state", () => {
    for (const code of ALL_CODES) {
      for (const capital of [1, 99, 1_000, 12_345, 25_000, 80_000, 500_000, 10_000_000]) {
        for (const withBroker of [false, true]) {
          const price = maxPrice(capital, code, { withBroker });
          expect(price % 100, code).toBe(0);
          const cost = (p: number) => costBreakdown(p, code, { withBroker }).total;
          expect(cost(price), `${code} ${capital}`).toBeLessThanOrEqual(capital + 1e-6);
          expect(cost(price + 100), `${code} ${capital}`).toBeGreaterThan(capital);
        }
      }
    }
  });

  it("handles edge input", () => {
    expect(maxPrice(0, "BY")).toBe(0);
    expect(maxPrice(-5_000, "BY")).toBe(0);
    expect(maxPrice(Number.NaN, "BY")).toBe(0);
    expect(maxPrice(Number.POSITIVE_INFINITY, "BY")).toBe(0);
    expect(maxPrice(1, "BY")).toBe(0); // €1 buys nothing at the €100 step
    expect(maxPriceForBasisPoints(25_000, 0)).toBe(0);
    expect(maxPriceForBasisPoints(25_000, -100)).toBe(0);
    // Zero percentages are allowed.
    expect(maxPrice(5_500, "BW", { notaryPct: 0, withBroker: false })).toBe(110_000);
  });

  it("grows with capital and shrinks with costs", () => {
    let prev = 0;
    for (let capital = 0; capital <= 100_000; capital += 777) {
      const p = maxPrice(capital, "NW");
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(maxPrice(25_000, "BY")).toBeGreaterThan(maxPrice(25_000, "NW"));
    expect(maxPrice(25_000, "NW", { withBroker: false })).toBeGreaterThan(maxPrice(25_000, "NW"));
  });
});

describe("costBreakdown", () => {
  it("splits the costs of a price", () => {
    const c = costBreakdown(300_000, "BE");
    expect(c.grest).toBeCloseTo(18_000, 6);
    expect(c.notary).toBeCloseTo(6_000, 6);
    expect(c.broker).toBeCloseTo(10_710, 6);
    expect(c.total).toBeCloseTo(34_710, 6);
    expect(costBreakdown(300_000, "BE", { withBroker: false }).broker).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Parity with the prototype «Капитал → дом.html» (render() in its inline script).
// The prototype applies one notary % and one broker % to all states.

const PROTO_STATES: [StateCode, number][] = [
  ["BY", 3.5], ["BW", 5.0], ["NI", 5.0], ["RP", 5.0], ["ST", 5.0], ["TH", 5.0],
  ["HH", 5.5], ["SN", 5.5], ["HB", 5.5], ["BE", 6.0], ["HE", 6.0], ["MV", 6.0],
  ["BB", 6.5], ["NW", 6.5], ["SL", 6.5], ["SH", 6.5],
];

function prototypeItems(
  cap: number,
  selected: Set<StateCode>,
  notar: number,
  makler: number,
  mk: BrokerFilter,
) {
  const TAXES = [...new Set(PROTO_STATES.map((s) => s[1]))];
  const items: { br: boolean; tax: number; p: number; st: StateCode[]; price: number }[] = [];
  [false, true].forEach((br) => {
    if (mk === "with" && !br) return;
    if (mk === "without" && br) return;
    TAXES.forEach((tax) => {
      const st = PROTO_STATES.filter((s) => s[1] === tax && selected.has(s[0])).map((s) => s[0]);
      if (!st.length) return;
      const p = tax + notar + (br ? makler : 0);
      items.push({ br, tax, p, st, price: p > 0 ? Math.floor(cap / (p / 100) / 100) * 100 : 0 });
    });
  });
  items.sort((a, b) => a.p - b.p);
  return items;
}

describe("parity with the prototype", () => {
  const capitals = [
    0, 1, 500, 10_000, 20_000, 25_000, 30_000, 40_000, 55_555, 80_000, 123_456, 500_000,
  ];
  const settings: [number, number][] = [
    [2, 3.57], // prototype defaults
    [1.5, 3.57],
    [2, 2.98],
    [2, 0],
    [0, 0],
  ];
  const selections: StateCode[][] = [ALL_CODES, ["BY"], ["BE", "HE", "MV"], ["HH", "NW", "TH"]];

  for (const [notar, makler] of settings) {
    for (const mk of ["all", "with", "without"] as const) {
      it(`matches for notary ${notar} %, broker ${makler} %, filter ${mk}`, () => {
        let compared = 0;
        for (const sel of selections) {
          for (const cap of capitals) {
            const proto = prototypeItems(cap, new Set(sel), notar, makler, mk);
            const ours = variants(cap, sel, { notaryPct: notar, brokerPct: makler, broker: mk });
            const norm = (x: { withBroker: boolean; grestPct: number; totalPct: number; price: number; states: StateCode[] }) => ({
              withBroker: x.withBroker,
              grestPct: x.grestPct,
              totalPct: x.totalPct,
              price: x.price,
              states: [...x.states].sort(),
            });
            expect(ours.map(norm)).toEqual(
              proto.map((i) =>
                norm({
                  withBroker: i.br,
                  grestPct: i.tax,
                  totalPct: Math.round(i.p * 100) / 100,
                  price: i.price,
                  states: i.st,
                }),
              ),
            );
            compared += proto.length;
          }
        }
        expect(compared).toBeGreaterThan(0);
      });
    }
  }

  it("matches maxPrice per state on a dense capital grid with prototype defaults", () => {
    for (const [code, tax] of PROTO_STATES) {
      for (let cap = 0; cap <= 80_000; cap += 500) {
        // the prototype's slider range and step
        const p = tax + 2 + 3.57;
        const proto = Math.floor(cap / (p / 100) / 100) * 100;
        expect(maxPrice(cap, code, { notaryPct: 2, brokerPct: 3.57 }), `${code} ${cap}`).toBe(proto);
      }
    }
  });
});

describe("variants", () => {
  it("keeps cards for different broker shares apart when using state defaults", () => {
    // BE (6 + 2 + 3.57) and HE (6 + 2 + 2.98) share GrESt but not the broker share.
    const v = variants(25_000, ["BE", "HE"], { broker: "with" });
    expect(v.map((x) => x.states)).toEqual([["HE"], ["BE"]]);
  });

  it("returns nothing for an empty selection", () => {
    expect(variants(25_000, [])).toEqual([]);
  });

  it("orders cards by total percentage, highest price first", () => {
    const v = variants(25_000, ALL_CODES);
    for (let i = 1; i < v.length; i++) {
      expect(v[i]!.totalPct).toBeGreaterThanOrEqual(v[i - 1]!.totalPct);
      expect(v[i]!.price).toBeLessThanOrEqual(v[i - 1]!.price);
    }
    expect(v.flatMap((x) => x.states).sort()).toEqual([...ALL_CODES, ...ALL_CODES].sort());
  });
});
