"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

export function ThemeToggle({ onBar = false }: { onBar?: boolean }) {
  const { t } = useI18n();
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button onClick={toggle} className={onBar ? "btn h-9 w-9 border-white/25 p-0 text-white hover:border-white/60" : "btn btn-ghost h-9 w-9 p-0"} aria-label={dark ? t("Usar tema claro") : t("Usar tema escuro")} title={dark ? t("Tema claro") : t("Tema escuro")}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
