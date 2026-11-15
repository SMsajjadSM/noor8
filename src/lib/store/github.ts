import { ensureDraftBranch, commitTree, createBlob, fullTree, ghConfig, gh, readBlobText, GitHubError, type TreeChange } from "@/lib/github/client";
import type { Change, FileEntry, Store } from "./types";

export const githubStore: Store = {
  mode: "github",
  async list(dir) {
    const head = await ensureDraftBranch();
    const prefix = `${dir}/`;
    return (await fullTree(head))
      .filter((t) => t.type === "blob" && t.path.startsWith(prefix) && !t.path.slice(prefix.length).includes("/"))
      .map((t): FileEntry => ({ path: t.path, sha: t.sha, size: t.size ?? 0 }));
  },
  readText: (e) => readBlobText(e.sha),
  async readFile(p) {
    const c = ghConfig();
    await ensureDraftBranch();
    try {
      const r = await gh<{ sha: string; content: string }>(`/contents/${p}?ref=${c.draft}`);
      return { sha: r.sha, text: Buffer.from(r.content, "base64").toString("utf8") };
    } catch (e) {
      if (e instanceof GitHubError && e.ghStatus === 404) return null;
      throw e;
    }
  },
  async readBinary(p) {
    const c = ghConfig();
    await ensureDraftBranch();
    try {
      const meta = await gh<{ sha: string }>(`/contents/${p}?ref=${c.draft}`);
      const blob = await gh<{ content: string }>(`/git/blobs/${meta.sha}`);
      return Buffer.from(blob.content, "base64");
    } catch (e) {
      if (e instanceof GitHubError && e.ghStatus === 404) return null;
      throw e;
    }
  },
  async commit(changes: Change[], message) {
    await ensureDraftBranch();
    const tc: TreeChange[] = [];
    for (const c of changes) {
      if ("remove" in c) tc.push({ path: c.path, sha: null });
      else if ("text" in c) tc.push({ path: c.path, content: c.text });
      else tc.push({ path: c.path, sha: await createBlob(c.base64) });
    }
    await commitTree(ghConfig().draft, tc, message);
  },
};
