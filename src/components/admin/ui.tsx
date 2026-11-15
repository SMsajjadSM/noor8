"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Inbox, Loader2, X } from "lucide-react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Button ---------- */
const variants = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary: "border border-line bg-surface text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
};
export function Button({ variant = "primary", loading, className, children, disabled, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; loading?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      disabled={disabled || loading}
      className={cx("inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Fields ---------- */
export const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none";
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id)}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 text-sm">
      <span className={cx("relative h-6 w-11 rounded-full transition", checked ? "bg-accent" : "bg-line")}>
        <span className={cx("absolute top-0.5 size-5 rounded-full bg-white transition-all", checked ? "right-0.5" : "right-[22px]")} />
      </span>
      {label}
    </button>
  );
}

/* ---------- Badge ---------- */
const tones = { ok: "bg-ok/15 text-ok", muted: "bg-surface-2 text-muted", accent: "bg-accent-soft text-accent", danger: "bg-danger/15 text-danger" };
export const Badge = ({ tone = "muted", children }: { tone?: keyof typeof tones; children: ReactNode }) => (
  <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>
);

/* ---------- States ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("animate-pulse rounded-lg bg-surface-2", className)} />;
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <Inbox className="size-8 text-muted" aria-hidden />
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
      <AlertTriangle className="size-5 text-danger" aria-hidden />
      <span className="flex-1">{message}</span>
      {onRetry && <Button variant="secondary" onClick={onRetry}>تلاش دوباره</Button>}
    </div>
  );
}

/* ---------- Confirm dialog (native <dialog>) ---------- */
export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel, busy }: {
  open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onCancel(); }} onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-0 text-text backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-[pop_.18s_ease-out]">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm leading-7 text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>انصراف</Button>
          <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}

/* ---------- Toasts ---------- */
type Toast = { id: number; kind: "ok" | "error"; text: string };
const ToastCtx = createContext<{ ok: (t: string) => void; error: (t: string) => void }>({ ok() {}, error() {} });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ ok: (t) => push("ok", t), error: (t) => push("error", t) }}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 left-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
        {list.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm shadow-lg animate-[pop_.2s_ease-out]">
            {t.kind === "ok" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="بستن" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}><X className="size-4 text-muted" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
