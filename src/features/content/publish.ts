import { ApiError } from "@/lib/errors";
import {
  branchHead, commitTree, ensureDraftBranch, fullTree, gh, ghConfig, GitHubError, readBlobText, type TreeEntry,
} from "@/lib/github/client";
import { getStore } from "@/lib/store";
import { pool } from "@/lib/utils/misc";
import { imagePathSchema } from "@/lib/validation/schemas";

const isContent = (p: string) => p.startsWith("data/") || p.startsWith("public/photo/");
export type DiffItem = { path: string; status: "added" | "modified" | "deleted"; draftSha: string | null; mainSha: string | null };

function requireGithub() {
  if (getStore().mode !== "github") throw new ApiError(501, "LOCAL_MODE", "انتشار فقط با اتصال GitHub ممکن است");
}
const blobs = (t: TreeEntry[]) => new Map(t.filter((e) => e.type === "blob" && isContent(e.path)).map((e) => [e.path, e.sha]));

async function load() {
  const c = ghConfig();
  const [draftHead, mainHead] = [await ensureDraftBranch(), await branchHead(c.main)];
  const [draftTree, mainTree] = [await fullTree(draftHead), await fullTree(mainHead)];
  return { c, draftHead, mainHead, draft: blobs(draftTree), main: blobs(mainTree) };
}

function diffMaps(draft: Map<string, string>, main: Map<string, string>): DiffItem[] {
  const out: DiffItem[] = [];
  for (const [path, sha] of draft) {
    const m = main.get(path) ?? null;
    if (m !== sha) out.push({ path, status: m ? "modified" : "added", draftSha: sha, mainSha: m });
  }
  for (const [path, sha] of main) if (!draft.has(path)) out.push({ path, status: "deleted", draftSha: null, mainSha: sha });
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const imagesIn = (json: unknown): string[] => {
  const found = new Set<string>();
  (function walk(v: unknown) {
    if (typeof v === "string") {
      if (imagePathSchema.safeParse(v).success) found.add(v);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(json);
  return [...found];
};

export async function getDeployStatus(sha: string) {
  const deployments = await gh<{ id: number }[]>(`/deployments?sha=${sha}&per_page=1`);
  const d = deployments[0];
  if (!d) return { state: "unknown" as const };
  const statuses = await gh<{ state: string; target_url?: string; environment_url?: string }[]>(`/deployments/${d.id}/statuses?per_page=1`);
  const s = statuses[0];
  return { state: (s?.state ?? "pending") as string, url: s?.environment_url ?? s?.target_url };
}

export async function publishStatus() {
  requireGithub();
  const { c, draftHead, mainHead, draft, main } = await load();
  const commits = await gh<{ sha: string; commit: { message: string; author: { date: string } } }[]>(
    `/commits?sha=${c.draft}&per_page=10`,
  );
  return {
    diff: diffMaps(draft, main),
    mainHead,
    draftHead,
    recent: commits.map((x) => ({ sha: x.sha.slice(0, 7), message: x.commit.message.split("\n")[0], date: x.commit.author.date })),
    deploy: await getDeployStatus(mainHead).catch(() => ({ state: "unknown" as const })),
  };
}

export async function publish(paths: "all" | string[]) {
  requireGithub();
  const { c, draft, main } = await load();
  const diff = diffMaps(draft, main);
  const byPath = new Map(diff.map((d) => [d.path, d]));
  let selected: DiffItem[];
  if (paths === "all") selected = diff;
  else {
    const unknown = paths.filter((p) => !byPath.has(p));
    if (unknown.length) throw new ApiError(400, "NOT_CHANGED", "برخی موارد تغییری برای انتشار ندارند", unknown);
    selected = paths.map((p) => byPath.get(p) as DiffItem);
  }
  const chosen = new Map(selected.map((d) => [d.path, d]));

  // Published content must never point at an image that is not on main: pull in changed images it references.
  const dataFiles = selected.filter((d) => d.path.startsWith("data/") && d.draftSha);
  await pool(dataFiles, 6, async (d) => {
    for (const img of imagesIn(JSON.parse(await readBlobText(d.draftSha as string)))) {
      const dep = byPath.get(`public${img}`);
      if (dep && dep.status !== "deleted") chosen.set(dep.path, dep);
    }
  });

  // Never delete an image that content on main would still reference after this publish.
  const deletedImages = [...chosen.values()].filter((d) => d.status === "deleted" && d.path.startsWith("public/photo/"));
  if (deletedImages.length) {
    const finalData = new Map<string, string>();
    for (const [p, sha] of main) if (p.startsWith("data/")) finalData.set(p, sha);
    for (const d of chosen.values()) {
      if (!d.path.startsWith("data/")) continue;
      if (d.status === "deleted") finalData.delete(d.path);
      else finalData.set(d.path, d.draftSha as string);
    }
    const refs = new Set<string>();
    await pool([...finalData.values()], 6, async (sha) => imagesIn(JSON.parse(await readBlobText(sha))).forEach((i) => refs.add(`public${i}`)));
    const blocked = deletedImages.filter((d) => refs.has(d.path)).map((d) => d.path);
    if (blocked.length) throw new ApiError(409, "IN_USE", "تصویری که هنوز در محتوای منتشرشده استفاده می‌شود قابل حذف نیست", blocked);
  }

  const items = [...chosen.values()];
  if (!items.length) throw new ApiError(400, "NOTHING", "تغییری برای انتشار وجود ندارد");
  // Reuse the draft blobs by SHA: nothing is re-uploaded and only content files reach main.
  const commitSha = await commitTree(
    c.main,
    items.map((d) => ({ path: d.path, sha: d.status === "deleted" ? null : d.draftSha })),
    `publish: ${items.length} content change${items.length > 1 ? "s" : ""}`,
  );
  return { commitSha, published: items.map((d) => d.path) };
}

/** Bring non-content changes (code) from main into the draft branch. */
export async function syncDraft() {
  requireGithub();
  const c = ghConfig();
  await ensureDraftBranch();
  try {
    const r = await gh<{ sha: string } | undefined>(`/merges`, {
      method: "POST",
      body: { base: c.draft, head: c.main, commit_message: "sync: merge main into content-drafts" },
    });
    return { merged: Boolean(r) };
  } catch (e) {
    if (e instanceof GitHubError && e.ghStatus === 409) {
      throw new ApiError(409, "MERGE_CONFLICT", "هماهنگ‌سازی با تعارض روبه‌رو شد؛ باید در GitHub دستی حل شود");
    }
    throw e;
  }
}
