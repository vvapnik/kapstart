// @ts-check
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";

// Static site (SSG). Only the calculator island will be hydrated.
export default defineConfig({
  site: "https://kapstart.vapnik.de",
  integrations: [preact()],
});
