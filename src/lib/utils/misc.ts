/** Today as YYYY-MM-DD in Tehran time. */
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });

export async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) await fn(items[i++] as T);
    }),
  );
}
