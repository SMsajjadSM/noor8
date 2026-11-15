export type FileEntry = { path: string; sha: string; size: number };
export type Change = { path: string } & ({ text: string } | { base64: string } | { remove: true });

export interface Store {
  readonly mode: "github" | "local";
  /** Direct children files of a directory (draft branch). */
  list(dir: string): Promise<FileEntry[]>;
  readText(entry: { path: string; sha: string }): Promise<string>;
  /** Read one file by path; null if absent. */
  readFile(path: string): Promise<{ text: string; sha: string } | null>;
  /** Raw bytes of one file (draft branch); null if absent. */
  readBinary(path: string): Promise<Buffer | null>;
  /** Apply all changes in ONE commit. */
  commit(changes: Change[], message: string): Promise<void>;
}
