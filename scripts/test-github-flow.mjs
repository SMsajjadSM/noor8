// End-to-end test of the draft/publish flow against an in-memory fake GitHub.
// Usage: see docs/TESTING.md
import fs from "node:fs";
import path from "node:path";
import { createFakeGithub } from "./fake-github.mjs";

const BASE = process.env.BASE ?? "http://localhost:3103";
const { api, server } = createFakeGithub();
await new Promise((r) => server.listen(4010, r));

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const seed = {};
for (const f of [...walk("data"), ...walk("public/photo")]) seed[f] = fs.readFileSync(f);
seed["src/code.txt"] = "v1";
api.seed("main", seed, "initial");

let failed = 0;
const check = (name, ok, extra = "") => { if (!ok) failed++; console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  → " + extra : ""}`); };

const login = await fetch(BASE + "/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "S3cret-pass" }) });
const cookie = login.headers.get("set-cookie").split(";")[0];
const csrf = (await login.json()).data.csrf;
const call = async (method, url, body, form) => {
  const r = await fetch(BASE + url, { method, headers: { Cookie: cookie, "x-csrf-token": csrf, ...(body ? { "Content-Type": "application/json" } : {}) }, body: form ?? (body ? JSON.stringify(body) : undefined) });
  return { s: r.status, j: await r.json() };
};
const prod = (slug, image = "/photo/products/herz-pack.webp") => ({ slug, name: "محصول " + slug, desc: "d", price: 1000, icon: "ring", image, tag: null, details: "", order: 100, published: true });
const mainFiles = () => api.files("main");

const list = await call("GET", "/api/admin/products");
check("list products (creates draft branch from main)", list.s === 200 && list.j.data.items.length === 8 && api.head("content-drafts") === api.head("main"), `items=${list.j.data?.items.length}`);

const mainBefore = api.head("main");
const p1 = await call("POST", "/api/admin/products", prod("test-one"));
check("create product commits to draft only", p1.s === 201 && api.head("main") === mainBefore && !!api.text("content-drafts", `data/products/${p1.j.data.id}.json`));

const st1 = await call("GET", "/api/admin/publish");
check("publish status shows 1 added", st1.s === 200 && st1.j.data.diff.length === 1 && st1.j.data.diff[0].status === "added", JSON.stringify(st1.j.data.diff.map((d) => d.status)));

const img = fs.readFileSync("public/photo/products/armband-plain.webp");
const fd = new FormData(); fd.set("folder", "products"); fd.set("file", new File([img], "New Pic.webp", { type: "image/webp" }));
const up = await call("POST", "/api/admin/media", null, fd);
const newImg = up.j.data?.path;
check("upload image to draft", up.s === 201 && !!api.files("content-drafts")["public" + newImg], newImg);
const p2 = await call("POST", "/api/admin/products", prod("test-two", newImg));
check("create product using new image", p2.s === 201);

const p2file = `data/products/${p2.j.data.id}.json`, p1file = `data/products/${p1.j.data.id}.json`;
const pub1 = await call("POST", "/api/admin/publish", { paths: [p2file] });
check("publish selected item also publishes its new image", pub1.s === 200 && pub1.j.data.published.includes("public" + newImg), JSON.stringify(pub1.j.data.published));
check("main has item + image, NOT the unselected item", !!mainFiles()[p2file] && !!mainFiles()["public" + newImg] && !mainFiles()[p1file]);
check("non-content files untouched on main", api.text("main", "src/code.txt") === "v1");

const again = await call("POST", "/api/admin/publish", { paths: [p2file] });
check("re-publishing unchanged item is rejected", again.s === 400 && again.j.error.code === "NOT_CHANGED");

const pubAll = await call("POST", "/api/admin/publish", { paths: "all" });
check("publish all publishes the remaining item", pubAll.s === 200 && pubAll.j.data.published.length === 1 && !!mainFiles()[p1file]);
const st2 = await call("GET", "/api/admin/publish");
check("nothing left to publish", st2.j.data.diff.length === 0);

// image deletion safety
const cur = await call("GET", `/api/admin/products/${p2.j.data.id}`);
await call("PUT", `/api/admin/products/${p2.j.data.id}`, { ...prod("test-two"), sha: cur.j.data.sha });
const delUsed = await call("DELETE", `/api/admin/media?path=${encodeURIComponent(newImg)}`);
check("draft delete of now-unused image allowed", delUsed.s === 200);
const blocked = await call("POST", "/api/admin/publish", { paths: ["public" + newImg] });
check("publishing image deletion is blocked while main content still uses it", blocked.s === 409 && blocked.j.error.code === "IN_USE", blocked.j.error?.code);
const okAll = await call("POST", "/api/admin/publish", { paths: "all" });
check("publishing item change + image deletion together succeeds", okAll.s === 200 && !mainFiles()["public" + newImg]);

// sync main -> draft
api.seed("main", { "src/code.txt": "v2" }, "code change on main");
const sync1 = await call("POST", "/api/admin/publish/sync");
check("sync merges main code changes into draft", sync1.s === 200 && sync1.j.data.merged === true && api.text("content-drafts", "src/code.txt") === "v2");
const sync2 = await call("POST", "/api/admin/publish/sync");
check("second sync is a no-op", sync2.s === 200 && sync2.j.data.merged === false);
const st3 = await call("GET", "/api/admin/publish");
check("code changes never appear as publishable content", st3.j.data.diff.length === 0, JSON.stringify(st3.j.data.diff));

api.setDeploy(api.head("main"), "success");
const st4 = await call("GET", "/api/admin/publish");
check("deploy status is read for the latest main commit", st4.j.data.deploy.state === "success", JSON.stringify(st4.j.data.deploy));

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
server.close(); process.exit(failed ? 1 : 0);
