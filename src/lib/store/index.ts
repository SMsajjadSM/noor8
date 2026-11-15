import { githubStore } from "./github";
import { localStore } from "./local";
import type { Store } from "./types";

export function getStore(): Store {
  if (process.env.CONTENT_STORE === "local" && process.env.NODE_ENV !== "production") return localStore;
  return githubStore;
}
export type { Store, Change, FileEntry } from "./types";
