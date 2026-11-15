import { getStore } from "@/lib/store";
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from "@/lib/validation/schemas";

const FILE = "data/settings.json";

export async function getSettings(): Promise<Settings> {
  const f = await getStore().readFile(FILE);
  if (!f) return DEFAULT_SETTINGS;
  const parsed = settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...JSON.parse(f.text) });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveSettings(raw: unknown): Promise<Settings> {
  const next = settingsSchema.parse(raw);
  await getStore().commit([{ path: FILE, text: JSON.stringify(next, null, 2) + "\n" }], "content: update settings");
  return next;
}
