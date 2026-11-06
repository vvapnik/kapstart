/**
 * Capital → maximum house price.
 *
 * The bank finances 100 % of the purchase price; the buyer's capital covers only the
 * purchase side costs (Kaufnebenkosten): Grunderwerbsteuer, notary + land registry and,
 * optionally, the buyer's share of the broker commission. All of them are a percentage
 * of the price, so
 *
 *     price = capital ÷ (sum of percentages), rounded down to €100.
 *
 * Arithmetic runs on integers (euro cents and hundredths of a percent), so results do
 * not depend on floating-point noise. Percentages are therefore read to two decimals.
 * No dependencies besides rates.ts.
 */
import { STATES, getState, type StateCode } from "./rates";

/** Prices are rounded down to this step, in euros. */
export const PRICE_STEP = 100;

export interface CostOptions {
  /** Notary + land registry, %. Default: the state's value from rates.json. */
  notaryPct?: number;
  /** Buyer's broker share incl. VAT, %. Default: the state's customary share. */
  brokerPct?: number;
  /** Whether a broker is involved. Default: true. */
  withBroker?: boolean;
}

export interface CostBreakdown {
  price: number;
  grest: number;
  notary: number;
  broker: number;
  total: number;
}

/** Percent → hundredths of a percent (basis points), e.g. 3.57 → 357. */
export function toBasisPoints(pct: number): number {
  return Number.isFinite(pct) ? Math.round(pct * 100) : 0;
}

interface ResolvedRates {
  grestPct: number;
  notaryPct: number;
  brokerPct: number;
}

function resolve(code: StateCode, opts: CostOptions = {}): ResolvedRates {
  const s = getState(code);
  const withBroker = opts.withBroker ?? true;
  return {
    grestPct: s.grestPct,
    notaryPct: opts.notaryPct ?? s.notaryPct,
    brokerPct: withBroker ? (opts.brokerPct ?? s.brokerBuyerPct) : 0,
  };
}

/** Sum of all side-cost percentages for a state, in basis points. */
export function totalBasisPoints(code: StateCode, opts?: CostOptions): number {
  const r = resolve(code, opts);
  return toBasisPoints(r.grestPct) + toBasisPoints(r.notaryPct) + toBasisPoints(r.brokerPct);
}

/** Sum of all side-cost percentages for a state, in %. */
export function totalPct(code: StateCode, opts?: CostOptions): number {
  return totalBasisPoints(code, opts) / 100;
}

/**
 * Highest price (multiple of €100) whose side costs at `basisPoints` fit into `capital`.
 * Returns 0 for non-positive or non-finite input.
 */
export function maxPriceForBasisPoints(capital: number, basisPoints: number): number {
  if (!Number.isFinite(capital) || capital <= 0 || basisPoints <= 0) return 0;
  // price = capital / (bp / 10 000); in units of €100: capital·100 / bp = cents / bp.
  const cents = Math.floor(capital * 100);
  return Math.floor(cents / basisPoints) * PRICE_STEP;
}

/** Highest house price the capital covers in a state. */
export function maxPrice(capital: number, code: StateCode, opts?: CostOptions): number {
  return maxPriceForBasisPoints(capital, totalBasisPoints(code, opts));
}

/** Side costs of a given price in a state, in euros (not rounded). */
export function costBreakdown(price: number, code: StateCode, opts?: CostOptions): CostBreakdown {
  const r = resolve(code, opts);
  const part = (pct: number) => (price * toBasisPoints(pct)) / 10_000;
  const grest = part(r.grestPct);
  const notary = part(r.notaryPct);
  const broker = part(r.brokerPct);
  return { price, grest, notary, broker, total: grest + notary + broker };
}

export type BrokerFilter = "all" | "with" | "without";

export interface VariantOptions {
  notaryPct?: number;
  brokerPct?: number;
  broker?: BrokerFilter;
}

/** One result card: states that share the same broker case and total percentage. */
export interface Variant {
  withBroker: boolean;
  grestPct: number;
  /** Total side costs, %. */
  totalPct: number;
  price: number;
  states: StateCode[];
}

/**
 * Result cards for the calculator: the selected states grouped by broker case and
 * total percentage, cheapest side costs (= highest price) first. States keep the
 * order of rates.json within a card.
 */
export function variants(
  capital: number,
  codes: Iterable<StateCode>,
  opts: VariantOptions = {},
): Variant[] {
  const selected = new Set(codes);
  const filter = opts.broker ?? "all";
  const cases = [false, true].filter((b) => filter === "all" || (filter === "with") === b);

  const groups = new Map<string, Variant & { bp: number }>();
  for (const withBroker of cases) {
    for (const s of STATES) {
      if (!selected.has(s.code)) continue;
      const costOpts = { notaryPct: opts.notaryPct, brokerPct: opts.brokerPct, withBroker };
      const bp = totalBasisPoints(s.code, costOpts);
      const key = `${withBroker}|${s.grestPct}|${bp}`;
      const g = groups.get(key);
      if (g) g.states.push(s.code);
      else
        groups.set(key, {
          withBroker,
          grestPct: s.grestPct,
          totalPct: bp / 100,
          price: maxPriceForBasisPoints(capital, bp),
          states: [s.code],
          bp,
        });
    }
  }

  return [...groups.values()]
    .sort(
      (a, b) =>
        a.bp - b.bp ||
        Number(a.withBroker) - Number(b.withBroker) ||
        a.grestPct - b.grestPct,
    )
    .map(({ bp: _bp, ...v }) => v);
}
