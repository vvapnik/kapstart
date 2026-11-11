// @ts-check
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";

// Static site (SSG). Only the calculator island will be hydrated.
export default defineConfig({
  site: "https://kapstart.vapnik.de",
  integrations: [preact()],
  // The root opens the German calculator. A fixed redirect, not by Accept-Language;
  // public/_redirects makes it a real 301 on Cloudflare, Astro writes a fallback page.
  redirects: { "/": "/de/" },
});
