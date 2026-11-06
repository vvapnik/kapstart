/**
 * UI strings of the calculator island, taken over from the prototype.
 * TASK-28.3 moves them into src/i18n/{de,en,ru}.json.
 */
import type { Lang } from "../core/rates";

const de = {
  capLabel: "Mein Eigenkapital für Kaufnebenkosten",
  capAria: "Eigenkapital in Euro",
  rangeAria: "Eigenkapital, Schieberegler",
  capSec: "Eigenkapital",
  filters: "Filter",
  states: "Bundesländer",
  all: "Alle Bundesländer",
  none: "Keine Bundesländer gewählt",
  nSel: "Bundesländer gewählt: ",
  makler: "Makler",
  mkAll: "Alle",
  mkWith: "Nur mit Makler",
  mkWithout: "Nur ohne",
  only: "nur",
  onlyAria: "Nur ",
  mkPrefix: "Makler",
  grest: "Grunderwerbsteuer",
  grestShort: "GrESt",
  notarShort: "Notar",
  results: "Maximaler Kaufpreis",
  emptyFilter: "Keine Varianten für diese Filter.",
  emptyNone: "Wähle mindestens ein Bundesland aus.",
  assumptions: "Annahmen",
  notarLbl: "Notar + Grundbuch, %",
  maklerLbl: "Makler (Käuferanteil inkl. MwSt.), %",
  maklerPlaceholder: "je nach Land",
  reset: "Zurücksetzen",
  note:
    "Die Bank finanziert 100 % des Kaufpreises, das Eigenkapital deckt nur die Kaufnebenkosten: Grunderwerbsteuer (Sätze 2026), Notar und Grundbuch (~2 %) und, falls ein Makler beteiligt ist, der übliche Käuferanteil im jeweiligen Land (2,98–3,57 % inkl. MwSt.). Kaufpreis = Eigenkapital ÷ Summe der Prozentsätze, abgerundet auf 100 €.",
  loc: "de-DE",
};

export type CalculatorStrings = typeof de;

const en: CalculatorStrings = {
  capLabel: "My capital for purchase side costs",
  capAria: "Capital in euros",
  rangeAria: "Capital, slider",
  capSec: "Capital",
  filters: "Filters",
  states: "Federal states",
  all: "All states",
  none: "No states selected",
  nSel: "States selected: ",
  makler: "Broker",
  mkAll: "All",
  mkWith: "With broker only",
  mkWithout: "Without only",
  only: "only",
  onlyAria: "Only ",
  mkPrefix: "Broker",
  grest: "Grunderwerbsteuer",
  grestShort: "Transfer tax",
  notarShort: "Notary",
  results: "Maximum purchase price",
  emptyFilter: "No options match these filters.",
  emptyNone: "Select at least one state.",
  assumptions: "Assumptions",
  notarLbl: "Notary + land registry, %",
  maklerLbl: "Broker (buyer's share incl. VAT), %",
  maklerPlaceholder: "per state",
  reset: "Reset",
  note:
    "The bank finances 100% of the price; your capital covers only the side costs: Grunderwerbsteuer (2026 rates), notary and land registry (~2%) and, if a broker is involved, the buyer's customary share in that state (2.98–3.57% incl. VAT). Price = capital ÷ sum of percentages, rounded down to €100.",
  loc: "en-GB",
};

const ru: CalculatorStrings = {
  capLabel: "Мой капитал на доп. расходы",
  capAria: "Капитал в евро",
  rangeAria: "Капитал, ползунок",
  capSec: "Капитал",
  filters: "Фильтры",
  states: "Земли",
  all: "Все земли",
  none: "Земли не выбраны",
  nSel: "Выбрано земель: ",
  makler: "Маклер",
  mkAll: "Все",
  mkWith: "Только с маклером",
  mkWithout: "Только без",
  only: "только",
  onlyAria: "Только ",
  mkPrefix: "Makler",
  grest: "Grunderwerbsteuer",
  grestShort: "GrESt",
  notarShort: "Нотариус",
  results: "Максимальная цена дома",
  emptyFilter: "Нет вариантов под выбранные фильтры.",
  emptyNone: "Выбери хотя бы одну землю в списке.",
  assumptions: "Допущения",
  notarLbl: "Нотариус + Grundbuch, %",
  maklerLbl: "Маклер (доля покупателя с НДС), %",
  maklerPlaceholder: "по земле",
  reset: "Сбросить",
  note:
    "Банк финансирует 100% цены, капитал уходит только на доп. расходы: Grunderwerbsteuer (ставки 2026 года), нотариус и Grundbuch (~2%) и, если есть маклер, обычная доля покупателя в этой земле (2,98–3,57% с НДС). Цена = капитал ÷ сумма процентов, округлена вниз до 100 €.",
  loc: "ru-RU",
};

export const CALCULATOR_STRINGS: Record<Lang, CalculatorStrings> = { de, en, ru };
