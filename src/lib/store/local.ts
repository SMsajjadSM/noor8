import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Change, FileEntry, Store } from "./types";

/** Development-only store that writes into the working tree. Never used in production. */
const sha = (b: Buffer) => createHash("sha1").update(b).digest("hex");

export const localStore: Store = {
  mode: "local",
  async list(dir) {
    const abs = path.join(/* turbopackIgnore: true */ process.cwd(), dir);
    let names: string[] = [];
    try {
      names = await fs.readdir(abs);
    } catch {
      return [];
    }
    const out: FileEntry[] = [];
    for (const n of names) {
      const st = await fs.stat(path.join(abs, n));
      if (st.isFile()) out.push({ path: `${dir}/${n}`, size: st.size, sha: sha(await fs.readFile(path.join(abs, n))) });
    }
    return out;
  },
  async readText(e) {
    return fs.readFile(path.join(/* turbopackIgnore: true */ process.cwd(), e.path), "utf8");
  },
  async readFile(p) {
    try {
      const buf = await fs.readFile(path.join(/* turbopackIgnore: true */ process.cwd(), p));
      return { text: buf.toString("utf8"), sha: sha(buf) };
    } catch {
      return null;
    }
  },
  async readBinary(p) {
    try {
      return await fs.readFile(path.join(/* turbopackIgnore: true */ process.cwd(), p));
    } catch {
      return null;
    }
  },
  async commit(changes: Change[]) {
    for (const c of changes) {
      const abs = path.join(/* turbopackIgnore: true */ process.cwd(), c.path);
      if ("remove" in c) await fs.rm(abs, { force: true });
      else {
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, "text" in c ? c.text : Buffer.from(c.base64, "base64"));
      }
    }
  },
};
