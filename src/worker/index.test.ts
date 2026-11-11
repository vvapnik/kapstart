import { describe, expect, it } from "vitest";
import worker, { parseBasic, safeEqual, type Env } from "./index";

const assets = { fetch: async () => new Response("calculator", { status: 200 }) };
const env: Env = { ASSETS: assets, AUTH_USER: "user", AUTH_PASS: "pa:ss" };
const req = (auth?: string, url = "https://kapstart.vapnik.de/") =>
  new Request(url, auth ? { headers: { Authorization: auth } } : {});
const basic = (u: string, p: string) => "Basic " + btoa(`${u}:${p}`);

describe("basic auth worker", () => {
  it("rejects requests without credentials", async () => {
    const res = await worker.fetch(req(), env);
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
    expect(await res.text()).not.toContain("calculator");
  });
  it("rejects wrong password and wrong user", async () => {
    expect((await worker.fetch(req(basic("user", "nope")), env)).status).toBe(401);
    expect((await worker.fetch(req(basic("x", "pa:ss")), env)).status).toBe(401);
    expect((await worker.fetch(req("Bearer abc"), env)).status).toBe(401);
  });
  it("serves assets with correct credentials", async () => {
    const res = await worker.fetch(req(basic("user", "pa:ss")), env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("calculator");
    expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
  });
  it("fails closed when secrets are missing", async () => {
    const res = await worker.fetch(req(basic("", "")), { ASSETS: assets });
    expect(res.status).toBe(503);
  });
  it("redirects http to https", async () => {
    const res = await worker.fetch(req(undefined, "http://kapstart.vapnik.de/x"), env);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://kapstart.vapnik.de/x");
  });
  it("helpers", async () => {
    expect(parseBasic(basic("a", "b:c"))).toEqual({ user: "a", pass: "b:c" });
    expect(parseBasic("Basic !!!")).toBeNull();
    expect(await safeEqual("a", "a")).toBe(true);
    expect(await safeEqual("a", "b")).toBe(false);
  });
});
