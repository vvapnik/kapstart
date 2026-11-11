/**
 * The calculator island: capital → maximum house price per group of states.
 * Rendered at build time with the default capital (numbers end up in the HTML),
 * hydrated in the browser with `client:visible`. All math lives in src/core.
 */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { variants, type BrokerFilter } from "../core/calc";
import { STATES, type Lang, type StateCode } from "../core/rates";
import type { CalculatorStrings } from "../i18n";

export const DEFAULT_CAPITAL = 50_000;
const DEFAULT_NOTARY = "2";
const MAX_CAPITAL = 1_000_000;
const RANGE_MAX = 150_000;
const RANGE_STEP = 500;
const QUICK = [20_000, 30_000, 50_000, 75_000, 100_000];
const STORAGE_KEY = "kapstart-calc-v1";

const ALL_CODES = STATES.map((s) => s.code);

interface Saved {
  cap?: number;
  notary?: string;
  broker?: string;
  sel?: StateCode[];
  mk?: BrokerFilter;
}

/** "2,5" or "2.5" → 2.5; empty or invalid → undefined. */
function parsePct(text: string): number | undefined {
  const x = parseFloat(text.replace(",", "."));
  return Number.isFinite(x) && x >= 0 ? x : undefined;
}

function clampCapital(n: number): number {
  return Math.max(0, Math.min(MAX_CAPITAL, Math.round(n)));
}

interface Props {
  lang: Lang;
  /** Only this language's strings are passed, so the island ships one language. */
  strings: CalculatorStrings;
  defaultCapital?: number;
}

export default function Calculator({ lang, strings: t, defaultCapital = DEFAULT_CAPITAL }: Props) {
  // Narrow no-break spaces (ru, fr…) render inconsistently; use a plain no-break space.
  const nf = (n: number, o?: Intl.NumberFormatOptions) =>
    n.toLocaleString(t.loc, o).replace(/ /g, " ");
  const eur = (n: number) => `${nf(n)} €`;
  const pct = (n: number) => `${nf(n, { maximumFractionDigits: 2 })} %`;
  const stateName = (code: StateCode) => STATES.find((s) => s.code === code)!.name[lang];

  const [capital, setCapital] = useState(defaultCapital);
  const [capText, setCapText] = useState(nf(defaultCapital));
  const [selected, setSelected] = useState<Set<StateCode>>(() => new Set(ALL_CODES));
  const [mk, setMk] = useState<BrokerFilter>("all");
  const [notaryText, setNotaryText] = useState(DEFAULT_NOTARY);
  const [brokerText, setBrokerText] = useState("");
  const [ddOpen, setDdOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const ddBtnRef = useRef<HTMLButtonElement>(null);

  const setCap = (n: number) => {
    const c = clampCapital(n);
    setCapital(c);
    setCapText(nf(c));
  };

  // Restore saved input after hydration, so the server HTML and first render match.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Saved | null;
      if (s) {
        if (typeof s.cap === "number") setCap(s.cap);
        if (typeof s.notary === "string") setNotaryText(s.notary);
        if (typeof s.broker === "string") setBrokerText(s.broker);
        if (Array.isArray(s.sel)) setSelected(new Set(s.sel.filter((c) => ALL_CODES.includes(c))));
        if (s.mk === "all" || s.mk === "with" || s.mk === "without") setMk(s.mk);
      }
    } catch {
      /* storage unavailable: keep defaults */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const s: Saved = { cap: capital, notary: notaryText, broker: brokerText, sel: [...selected], mk };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [loaded, capital, notaryText, brokerText, selected, mk]);

  // Close the states dropdown on outside click and Escape.
  useEffect(() => {
    if (!ddOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!ddRef.current?.contains(e.target as Node)) setDdOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDdOpen(false);
        ddBtnRef.current?.focus();
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ddOpen]);

  const notaryPct = parsePct(notaryText) ?? 0;
  const brokerPct = parsePct(brokerText); // undefined → each state's customary share
  const cards = useMemo(
    () => variants(capital, selected, { notaryPct, brokerPct, broker: mk }),
    [capital, selected, notaryPct, brokerPct, mk],
  );
  const maxPrice = Math.max(1, ...cards.map((c) => c.price));

  const sortedStates = useMemo(
    () => [...STATES].sort((a, b) => a.name[lang].localeCompare(b.name[lang], t.loc)),
    [lang],
  );
  const allSelected = selected.size === ALL_CODES.length;
  const ddLabel = allSelected
    ? t.all
    : selected.size === 0
      ? t.none
      : selected.size <= 3
        ? ALL_CODES.filter((c) => selected.has(c)).map(stateName).join(", ")
        : t.nSel + selected.size;

  const toggle = (code: StateCode, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(code);
    else next.delete(code);
    setSelected(next);
  };

  const onCapInput = (text: string) => {
    setCapText(text);
    const n = parseInt(text.replace(/\D/g, ""), 10);
    setCapital(clampCapital(Number.isFinite(n) ? n : 0));
  };

  const resetAssumptions = () => {
    setNotaryText(DEFAULT_NOTARY);
    setBrokerText("");
  };

  return (
    <div class="calc">
      <section class="capital" aria-label={t.capSec}>
        <label for="cap">{t.capLabel}</label>
        <div class="cap-row">
          <div class="cap-input">
            <input
              id="cap"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={t.capAria}
              value={capText}
              onInput={(e) => onCapInput(e.currentTarget.value)}
              onBlur={() => setCapText(nf(capital))}
            />
            <span aria-hidden="true">€</span>
          </div>
          <div class="chips">
            {QUICK.map((c) => (
              <button
                type="button"
                class="chip"
                aria-pressed={capital === c}
                onClick={() => setCap(c)}
              >
                {nf(c)}
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={RANGE_MAX}
          step={RANGE_STEP}
          value={Math.min(RANGE_MAX, capital)}
          aria-label={t.rangeAria}
          onInput={(e) => setCap(Number(e.currentTarget.value))}
        />
      </section>

      <section class="filters" aria-label={t.filters}>
        <div class="fgroup">
          <span class="eyebrow">{t.states}</span>
          <div class="dd" ref={ddRef}>
            <button
              type="button"
              class="dd-btn"
              ref={ddBtnRef}
              aria-expanded={ddOpen}
              aria-controls="dd-panel"
              onClick={() => setDdOpen(!ddOpen)}
            >
              <span>{ddLabel}</span>
              <span class="car" aria-hidden="true">▼</span>
            </button>
            <div class="dd-panel" id="dd-panel" hidden={!ddOpen}>
              <label>
                <input
                  type="checkbox"
                  checked={allSelected}
                  indeterminate={!allSelected && selected.size > 0}
                  onChange={(e) =>
                    setSelected(e.currentTarget.checked ? new Set(ALL_CODES) : new Set())
                  }
                />
                <span>{t.all}</span>
              </label>
              <div class="sep" />
              {sortedStates.map((s) => (
                <div class="opt" key={s.code}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.has(s.code)}
                      onChange={(e) => toggle(s.code, e.currentTarget.checked)}
                    />
                    <span>{s.name[lang]}</span>
                    <span class="code">{s.code}</span>
                  </label>
                  <button
                    type="button"
                    class="only"
                    aria-label={t.onlyAria + s.name[lang]}
                    onClick={() => setSelected(new Set([s.code]))}
                  >
                    {t.only}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div class="fgroup">
          <span class="eyebrow">{t.makler}</span>
          <div class="seg" role="group" aria-label={t.makler}>
            {(
              [
                ["all", t.mkAll],
                ["with", t.mkWith],
                ["without", t.mkWithout],
              ] as const
            ).map(([v, label]) => (
              <button type="button" aria-pressed={mk === v} onClick={() => setMk(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section class="cards" aria-live="polite" aria-label={t.results}>
        {cards.length === 0 && (
          <p class="empty">{selected.size ? t.emptyFilter : t.emptyNone}</p>
        )}
        {cards.map((c) => {
          const brokerShare = Math.round((c.totalPct - c.grestPct - notaryPct) * 100) / 100;
          return (
            <article
              class={c.withBroker ? "card broker" : "card"}
              key={`${c.withBroker}-${c.grestPct}-${c.totalPct}`}
            >
              <div class="c-head">
                <span class="c-title">
                  {c.withBroker && (
                    <span class="mk">
                      {t.mkPrefix} {pct(brokerShare)} ·{" "}
                    </span>
                  )}
                  {pct(c.grestPct)} {t.grest}
                </span>
                <span class="c-price num">{eur(c.price)}</span>
              </div>
              <div class="track">
                <div class="fill" style={{ width: `${(c.price / maxPrice) * 100}%` }} />
              </div>
              <div class="c-meta">
                <span>{c.states.map(stateName).join(", ")}</span>
                <span
                  class="c-pct num"
                  title={
                    `${t.grestShort} ${pct(c.grestPct)} + ${t.notarShort} ${pct(notaryPct)}` +
                    (c.withBroker ? ` + ${t.mkPrefix} ${pct(brokerShare)}` : "")
                  }
                >
                  {pct(c.totalPct)}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <details>
        <summary>{t.assumptions}</summary>
        <div class="set">
          <div class="f">
            <label for="notary">{t.notarLbl}</label>
            <input
              id="notary"
              type="text"
              inputMode="decimal"
              value={notaryText}
              onInput={(e) => setNotaryText(e.currentTarget.value)}
            />
          </div>
          <div class="f">
            <label for="broker">{t.maklerLbl}</label>
            <input
              id="broker"
              type="text"
              inputMode="decimal"
              placeholder={t.maklerPlaceholder}
              value={brokerText}
              onInput={(e) => setBrokerText(e.currentTarget.value)}
            />
          </div>
        </div>
        <button type="button" class="chip reset" onClick={resetAssumptions}>
          {t.reset}
        </button>
      </details>

      <p class="note">{t.note}</p>
    </div>
  );
}
