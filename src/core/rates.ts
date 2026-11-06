/**
 * Typed view of rates.json — the single source of rates for all languages and pages.
 * Edit the numbers in rates.json; this file only adds types and lookups.
 */
import data from "./rates.json";

export type Lang = "de" | "en" | "ru";

export type StateCode =
  | "BW" | "BY" | "BE" | "BB" | "HB" | "HH" | "HE" | "MV"
  | "NI" | "NW" | "RP" | "SL" | "SN" | "ST" | "SH" | "TH";

export interface StateRates {
  code: StateCode;
  name: Record<Lang, string>;
  /** Grunderwerbsteuer, % of the price. */
  grestPct: number;
  /** Date the current GrESt rate took effect (ISO). */
  grestSince: string;
  /** Notary + land registry, % of the price (estimate). */
  notaryPct: number;
  /** Customary total broker commission incl. VAT, %. */
  brokerTotalPct: number;
  /** Buyer's share of the commission incl. VAT, % (half of the total, § 656c BGB). */
  brokerBuyerPct: number;
  /** Regional caveats, German. */
  brokerNote?: string;
}

export interface Source {
  title: string;
  url: string;
  /** "Stand" of the source (ISO date). */
  asOf: string;
}

export interface Rates {
  /** Date the data was last checked against the sources (ISO). */
  checked: string;
  sources: { grest: Source; notary: Source; broker: Source };
  states: StateRates[];
}

export const RATES = data as Rates;
export const STATES: readonly StateRates[] = RATES.states;

const BY_CODE = new Map(STATES.map((s) => [s.code, s]));

export function getState(code: StateCode): StateRates {
  const s = BY_CODE.get(code);
  if (!s) throw new Error(`Unknown state: ${code}`);
  return s;
}
