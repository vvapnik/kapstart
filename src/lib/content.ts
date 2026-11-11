/**
 * Lookups over the content collections with a completeness check: a state page or a
 * start page missing in any v1 language throws, so the build fails instead of
 * silently skipping a route.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { LANGS, STATE_SLUG } from "../i18n";
import { STATES, type Lang, type StateCode } from "../core/rates";

type StateEntry = CollectionEntry<"states">;
type PageEntry = CollectionEntry<"pages">;

let cache: Promise<{ states: Map<string, StateEntry>; pages: Map<string, PageEntry> }> | undefined;

/** "{lang}/{name}" from the file path (glob ids drop a trailing "index"). */
function key(e: { id: string; filePath?: string }): string {
  return (e.filePath ?? e.id).replace(/\.md$/, "").split("/").slice(-2).join("/");
}

async function load() {
  const [states, pages] = await Promise.all([getCollection("states"), getCollection("pages")]);
  const s = new Map(states.map((e) => [key(e), e]));
  const p = new Map(pages.map((e) => [key(e), e]));
  const problems: string[] = [];

  for (const lang of LANGS) {
    if (!p.has(`${lang}/index`)) problems.push(`pages/${lang}/index.md is missing`);
    for (const st of STATES) {
      const id = `${lang}/${STATE_SLUG[st.code]}`;
      const e = s.get(id);
      if (!e) problems.push(`states/${id}.md is missing`);
      else if (e.data.state !== st.code)
        problems.push(`states/${id}.md has state: ${e.data.state}, expected ${st.code}`);
    }
  }
  const known = new Set(LANGS.flatMap((l) => STATES.map((st) => `${l}/${STATE_SLUG[st.code]}`)));
  for (const id of s.keys()) if (!known.has(id)) problems.push(`states/${id}.md is not a known lang/state`);

  if (problems.length) throw new Error(`Content is incomplete:\n- ${problems.join("\n- ")}`);
  return { states: s, pages: p };
}

function content() {
  return (cache ??= load());
}

export async function getStatePage(lang: Lang, code: StateCode): Promise<StateEntry> {
  return (await content()).states.get(`${lang}/${STATE_SLUG[code]}`)!;
}

export async function getPage(lang: Lang, name: string): Promise<PageEntry> {
  const e = (await content()).pages.get(`${lang}/${name}`);
  if (!e) throw new Error(`pages/${lang}/${name}.md is missing`);
  return e;
}
