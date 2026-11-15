export const faNum = (n: number) => n.toLocaleString("fa-IR");
export const formatPrice = (n: number, unit: string) => `${faNum(n)} ${unit}`;
/** "2026-11-09" -> Persian (Jalali) long date for display. The stored value stays ISO for SEO. */
export const jalali = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(new Date(`${iso}T12:00:00`));
