"use client";
import { useState } from "react";
import { api } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { settingsSchema, type Settings } from "@/lib/validation/schemas";
import { PageHead } from "@/components/admin/page-head";
import { Button, ErrorState, Field, inputCls, Skeleton, useToast } from "@/components/admin/ui";

const FIELDS: { key: keyof Settings; label: string; hint?: string; ltr?: boolean }[] = [
  { key: "currencyUnit", label: "واحد قیمت", hint: "کنار قیمت محصولات نمایش داده می‌شود؛ مثلاً تومان" },
  { key: "phone", label: "شماره تماس", hint: "برای دکمه تماس و خرید تلفنی؛ مثلاً 09121234567", ltr: true },
  { key: "whatsapp", label: "واتساپ", hint: "شماره با کد کشور، مثلاً 989121234567", ltr: true },
  { key: "telegram", label: "تلگرام", hint: "نام کاربری بدون @", ltr: true },
  { key: "instagram", label: "اینستاگرام", hint: "نام کاربری بدون @", ltr: true },
  { key: "email", label: "ایمیل", ltr: true },
  { key: "address", label: "نشانی (اختیاری)" },
];

export default function SettingsPage() {
  const toast = useToast();
  const load = useLoad(() => api<Settings>("GET", "/api/admin/settings"));
  const [form, setForm] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!form && load.data) setForm(load.data);

  async function save() {
    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    setErrors({});
    setBusy(true);
    try {
      await api("PUT", "/api/admin/settings", parsed.data);
      toast.ok("تنظیمات به‌عنوان پیش‌نویس ذخیره شد. برای اعمال در سایت منتشر کنید");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="تنظیمات سایت" hint="واحد قیمت و راه‌های ارتباطی که در صفحات عمومی نمایش داده می‌شوند." />
      {load.error ? <ErrorState message={load.error} onRetry={load.reload} /> : !form ? <Skeleton className="h-96 max-w-xl" /> : (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="max-w-xl space-y-5 rounded-2xl border border-line bg-surface p-5">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]}>
              {(i) => <input id={i} dir={f.ltr ? "ltr" : undefined} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls} />}
            </Field>
          ))}
          <Button type="submit" loading={busy}>ذخیره تنظیمات</Button>
        </form>
      )}
    </>
  );
}
