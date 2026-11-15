// Minimal in-memory fake of the GitHub REST endpoints this project uses. For tests only.
import http from "node:http";
import { createHash } from "node:crypto";

const sha = (x) => createHash("sha1").update(typeof x === "string" ? x : JSON.stringify(x)).digest("hex");
export function createFakeGithub({ owner = "o", repo = "r" } = {}) {
  const blobs = new Map(), trees = new Map(), commits = new Map(), refs = new Map(), deployments = new Map();
  const base = `/repos/${owner}/${repo}`;
  const putBlob = (b64) => { const id = sha("blob:" + b64); blobs.set(id, b64); return id; };
  const putTree = (flat) => { const id = sha(Object.entries(flat).sort()); trees.set(id, flat); return id; };
  const putCommit = (tree, parents, message) => { const id = sha({ tree, parents, message, n: commits.size }); commits.set(id, { sha: id, tree, parents, message, date: new Date().toISOString() }); return id; };
  const treeOf = (c) => trees.get(commits.get(c).tree);
  const ancestors = (c, out = new Set()) => { if (!c || out.has(c)) return out; out.add(c); commits.get(c).parents.forEach((p) => ancestors(p, out)); return out; };

  const api = {
    /** test helper: commit files directly to a branch */
    seed(branch, files, message = "seed") {
      const head = refs.get(branch); const flat = head ? { ...treeOf(head) } : {};
      for (const [p, text] of Object.entries(files)) flat[p] = text === null ? undefined : { sha: putBlob(Buffer.from(text).toString("base64")), type: "blob", mode: "100644" };
      for (const k of Object.keys(flat)) if (!flat[k]) delete flat[k];
      refs.set(branch, putCommit(putTree(flat), head ? [head] : [], message));
    },
    head: (b) => refs.get(b), files: (b) => Object.fromEntries(Object.entries(treeOf(refs.get(b))).map(([p, e]) => [p, e.sha])),
    text: (b, p) => { const e = treeOf(refs.get(b))[p]; return e && Buffer.from(blobs.get(e.sha), "base64").toString(); },
    setDeploy(commitSha, state) { deployments.set(commitSha, state); },
  };

  const handle = (method, url, body) => {
    const u = new URL(url, "http://x"); const p = u.pathname; if (!p.startsWith(base)) return [404, { message: "Not Found" }];
    const r = p.slice(base.length); let m;
    if (method === "GET" && (m = r.match(/^\/git\/ref\/heads\/(.+)$/))) return refs.has(m[1]) ? [200, { object: { sha: refs.get(m[1]) } }] : [404, { message: "Not Found" }];
    if (method === "POST" && r === "/git/refs") { const b = body.ref.replace("refs/heads/", ""); refs.set(b, body.sha); return [201, {}]; }
    if (method === "PATCH" && (m = r.match(/^\/git\/refs\/heads\/(.+)$/))) {
      const cur = refs.get(m[1]); if (!cur) return [404, { message: "Not Found" }];
      if (!body.force && !ancestors(body.sha).has(cur)) return [422, { message: "Update is not a fast forward" }];
      refs.set(m[1], body.sha); return [200, {}];
    }
    if (method === "GET" && (m = r.match(/^\/git\/commits\/(\w+)$/))) return commits.has(m[1]) ? [200, { sha: m[1], tree: { sha: commits.get(m[1]).tree } }] : [404, { message: "Not Found" }];
    if (method === "GET" && (m = r.match(/^\/git\/trees\/(\w+)$/))) return [200, { truncated: false, tree: Object.entries(trees.get(m[1])).map(([path, e]) => ({ path, ...e, size: Buffer.from(blobs.get(e.sha) ?? "", "base64").length })) }];
    if (method === "POST" && r === "/git/blobs") return [201, { sha: putBlob(body.content) }];
    if (method === "GET" && (m = r.match(/^\/git\/blobs\/(\w+)$/))) return blobs.has(m[1]) ? [200, { content: blobs.get(m[1]), encoding: "base64" }] : [404, { message: "Not Found" }];
    if (method === "POST" && r === "/git/trees") {
      const flat = { ...trees.get(body.base_tree) };
      for (const t of body.tree) { if (t.sha === null) delete flat[t.path]; else flat[t.path] = { sha: t.content !== undefined ? putBlob(Buffer.from(t.content).toString("base64")) : t.sha, type: "blob", mode: t.mode }; }
      return [201, { sha: putTree(flat) }];
    }
    if (method === "POST" && r === "/git/commits") return [201, { sha: putCommit(body.tree, body.parents, body.message) }];
    if (method === "GET" && (m = r.match(/^\/contents\/(.+)$/))) {
      const ref = u.searchParams.get("ref"); const e = refs.has(ref) && treeOf(refs.get(ref))[decodeURIComponent(m[1])];
      return e ? [200, { sha: e.sha, content: blobs.get(e.sha), encoding: "base64" }] : [404, { message: "Not Found" }];
    }
    if (method === "GET" && r === "/commits") { const out = []; let c = refs.get(u.searchParams.get("sha")); while (c && out.length < 10) { const k = commits.get(c); out.push({ sha: c, commit: { message: k.message, author: { date: k.date } } }); c = k.parents[0]; } return [200, out]; }
    if (method === "GET" && r === "/deployments") { const s = u.searchParams.get("sha"); return [200, deployments.has(s) ? [{ id: 1, sha: s }] : []]; }
    if (method === "GET" && r.startsWith("/deployments/")) return [200, [{ state: [...deployments.values()].pop(), environment_url: "https://example.vercel.app" }]];
    if (method === "POST" && r === "/merges") {
      const [b, h] = [refs.get(body.base), refs.get(body.head)];
      if (ancestors(b).has(h)) return [204, null];
      // Three-way merge (conflicts resolved in favour of the base branch, enough for these tests).
      const baseAnc = ancestors(b); let mb = null; const q = [h];
      while (q.length && !mb) { const c = q.shift(); if (baseAnc.has(c)) mb = c; else q.push(...commits.get(c).parents); }
      const [T, M, B] = [mb ? treeOf(mb) : {}, treeOf(h), treeOf(b)]; const flat = {};
      for (const f of new Set([...Object.keys(M), ...Object.keys(B), ...Object.keys(T)])) {
        const [t, m, d] = [T[f]?.sha, M[f]?.sha, B[f]?.sha];
        const pick = d === t ? M[f] : B[f];
        if (pick) flat[f] = pick; void m;
      }
      refs.set(body.base, putCommit(putTree(flat), [b, h], body.commit_message)); return [201, { sha: refs.get(body.base) }];
    }
    return [404, { message: `fake: unhandled ${method} ${r}` }];
  };
  const server = http.createServer((req, res) => {
    let raw = ""; req.on("data", (c) => (raw += c)); req.on("end", () => {
      const [status, json] = handle(req.method, req.url, raw ? JSON.parse(raw) : undefined);
      res.writeHead(status, { "Content-Type": "application/json" }); res.end(json === null ? "" : JSON.stringify(json));
    });
  });
  return { api, server };
}
