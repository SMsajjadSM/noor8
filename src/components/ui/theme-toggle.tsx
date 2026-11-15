"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر حالت روشن/تاریک"
      className="relative grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:text-text"
    >
      <Sun className="size-5 hidden [[data-theme=dark]_&]:block" aria-hidden />
      <Moon className="size-5 block [[data-theme=dark]_&]:hidden" aria-hidden />
    </button>
  );
}
