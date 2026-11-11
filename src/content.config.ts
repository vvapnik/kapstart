/**
 * Content collections. Prose lives in Markdown; every number on the pages comes from
 * src/core (rates.json), so texts never repeat a rate that could go stale.
 *
 *   src/content/states/{lang}/{slug}.md — one page per state and language (3 × 16)
 *   src/content/pages/{lang}/{name}.md  — other pages (index = start page)
 *
 * Completeness (every state in every v1 language) is checked in src/lib/content.ts,
 * which every page goes through, so a missing file fails `astro build`.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const CODES = [
  "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV",
  "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
] as const;

const seo = {
  /** <title>, ≤ 70 characters. */
  title: z.string().min(10).max(70),
  /** Meta description, 50–170 characters. */
  description: z.string().min(50).max(170),
};

const states = defineCollection({
  loader: glob({ pattern: "*/*.md", base: "./src/content/states" }),
  schema: z.object({
    ...seo,
    state: z.enum(CODES),
    h1: z.string().min(10),
    /** Lead paragraph under the H1. */
    lead: z.string().min(40),
    faq: z.array(z.object({ q: z.string().min(10), a: z.string().min(20) })).min(2),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*/*.md", base: "./src/content/pages" }),
  schema: z.object({
    ...seo,
    eyebrow: z.string(),
    h1: z.string().min(10),
  }),
});

export const collections = { states, pages };
