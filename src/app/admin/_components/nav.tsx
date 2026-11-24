"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, ExternalLink, GitBranch, Gauge, Layers, Shield, Tag, Tv, Users, Star, Clapperboard, Library } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV: [string, string, typeof Gauge][] = [
  ["/admin", "Painel", Gauge],
  ["/admin/digimon", "Digimon", Library],
  ["/admin/evolucoes", "Evoluções", GitBranch],
  ["/admin/aparicoes", "Aparições", Tv],
  ["/admin/midias", "Jogos e mídias", Clapperboard],
  ["/admin/classificacoes/estagios", "Estágios", Layers],
  ["/admin/classificacoes/atributos", "Atributos", Shield],
  ["/admin/classificacoes/tipos", "Tipos", Tag],
  ["/admin/classificacoes/familias", "Famílias", Users],
  ["/admin/classificacoes/grupos", "Grupos", Star],
  ["/admin/fontes", "Fontes", BookMarked],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display font-bold">Editar a wiki</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="scroll-slim flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Edição">
        {NAV.map(([href, label, Icon]) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-medium", active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}>
              <Icon size={16} className={active ? "text-primary" : ""} />
              {label}
            </Link>
          );
        })}
        <div className="my-2 hidden border-t border-line lg:block" />
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
          <ExternalLink size={16} /> Voltar à wiki
        </Link>
      </nav>
    </aside>
  );
}
