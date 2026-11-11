// Gatekeeper Worker: HTTP Basic Auth in front of the static assets while Kapstart is private.
// Credentials come from Worker secrets (wrangler secret put AUTH_USER / AUTH_PASS).
// To go public (TASK-29), remove "main" and "run_worker_first" from wrangler.jsonc.

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AUTH_USER?: string;
  AUTH_PASS?: string;
}

const REALM = 'Basic realm="Kapstart", charset="UTF-8"';
const encoder = new TextEncoder();

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

// Compare fixed-length SHA-256 digests without early exit, so timing reveals nothing.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function parseBasic(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const m = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(header);
  if (!m) return null;
  let decoded: string;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return null;
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).protocol !== "https:" && !/^(localhost|127\.0\.0\.1)$/.test(new URL(request.url).hostname)) {
      const url = new URL(request.url);
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (!env.AUTH_USER || !env.AUTH_PASS) {
      // Fail closed: never serve the site if the secrets are missing.
      return new Response("Auth not configured", { status: 503, headers: noStore });
    }
    const creds = parseBasic(request.headers.get("Authorization"));
    const okUser = await safeEqual(creds?.user ?? "", env.AUTH_USER);
    const okPass = await safeEqual(creds?.pass ?? "", env.AUTH_PASS);
    if (!creds || !(okUser && okPass)) {
      return new Response("Authentication required", {
        status: 401,
        headers: { ...noStore, "WWW-Authenticate": REALM },
      });
    }
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    out.headers.set("Cache-Control", "private, no-store");
    return out;
  },
};
