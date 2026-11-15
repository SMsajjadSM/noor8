import { ApiError, ConfigError } from "@/lib/errors";

// GITHUB_API_URL exists only so scripts/ can test against a fake server; it is ignored in production.
const API = (process.env.NODE_ENV !== "production" && process.env.GITHUB_API_URL) || "https://api.github.com";

export class GitHubError extends ApiError {
  constructor(public ghStatus: number, message: string) {
    super(ghStatus === 409 || ghStatus === 422 ? 409 : 502, "GITHUB", message);
  }
}

export function ghConfig() {
  const e = process.env;
  const missing = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"].filter((k) => !e[k]);
  if (missing.length) throw new ConfigError(`متغیرهای محیطی تنظیم نشده‌اند: ${missing.join("، ")}`);
  return {
    token: e.GITHUB_TOKEN as string,
    owner: e.GITHUB_OWNER as string,
    repo: e.GITHUB_REPO as string,
    main: e.GITHUB_MAIN_BRANCH || "main",
    draft: e.GITHUB_DRAFT_BRANCH || "content-drafts",
  };
}

export async function gh<T>(p: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const c = ghConfig();
  const res = await fetch(`${API}/repos/${c.owner}/${c.repo}${p}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new GitHubError(res.status, data.message ?? `GitHub ${res.status}`);
  return data as T;
}

export type TreeEntry = { path: string; mode: string; type: string; sha: string; size?: number };
export type TreeChange = { path: string; sha: string | null } | { path: string; content: string };

export async function branchHead(branch: string): Promise<string> {
  const r = await gh<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
  return r.object.sha;
}

export async function ensureDraftBranch(): Promise<string> {
  const c = ghConfig();
  try {
    return await branchHead(c.draft);
  } catch (e) {
    if (!(e instanceof GitHubError) || e.ghStatus !== 404) throw e;
    const base = await branchHead(c.main);
    await gh(`/git/refs`, { method: "POST", body: { ref: `refs/heads/${c.draft}`, sha: base } });
    return base;
  }
}

export async function commitTreeSha(commit: string) {
  return (await gh<{ tree: { sha: string } }>(`/git/commits/${commit}`)).tree.sha;
}

export async function fullTree(commit: string): Promise<TreeEntry[]> {
  const r = await gh<{ tree: TreeEntry[]; truncated: boolean }>(`/git/trees/${await commitTreeSha(commit)}?recursive=1`);
  if (r.truncated) throw new ApiError(502, "GITHUB", "مخزن برای پردازش بیش از حد بزرگ است");
  return r.tree;
}

export async function createBlob(base64: string) {
  return (await gh<{ sha: string }>(`/git/blobs`, { method: "POST", body: { content: base64, encoding: "base64" } })).sha;
}

export async function readBlobText(sha: string) {
  const r = await gh<{ content: string }>(`/git/blobs/${sha}`);
  return Buffer.from(r.content, "base64").toString("utf8");
}

/** Create one commit on `branch` applying tree changes; retries once on a fast-forward race. */
export async function commitTree(branch: string, changes: TreeChange[], message: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const head = await branchHead(branch);
    const tree = await gh<{ sha: string }>(`/git/trees`, {
      method: "POST",
      body: {
        base_tree: await commitTreeSha(head),
        tree: changes.map((c) => ({ path: c.path, mode: "100644", type: "blob", ...("content" in c ? { content: c.content } : { sha: c.sha }) })),
      },
    });
    const commit = await gh<{ sha: string }>(`/git/commits`, { method: "POST", body: { message, tree: tree.sha, parents: [head] } });
    try {
      await gh(`/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
      return commit.sha;
    } catch (e) {
      if (attempt === 0 && e instanceof GitHubError && e.ghStatus === 422) continue;
      throw e;
    }
  }
}
