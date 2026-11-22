"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SearchBox } from "./search-box";
import { Logo, Wordmark } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/digimon", label: "Enciclopédia" },
  { href: "/linhas", label: "Linhas evolutivas" },
  { href: "/universos", label: "Universos" },
  { href: "/comparar", label: "Comparar" },
  { href: "/curiosidades", label: "Curiosidades" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Digimon Database — início">
          <Logo />
          <span className="hidden sm:inline"><Wordmark /></span>
        </Link>
        <nav className="hidden h-full items-stretch gap-5 lg:flex" aria-label="Principal">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center whitespace-nowrap border-b-2 pt-0.5 text-sm transition-colors",
                  active ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {pathname !== "/" && (
            <div className="hidden w-56 md:block xl:w-72">
              <SearchBox compact />
            </div>
          )}
          <ThemeToggle />
          <button
            className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-bg px-4 pb-4 pt-3 lg:hidden">
          <div className="mb-3 md:hidden">
            <SearchBox compact />
          </div>
          <nav className="grid" aria-label="Principal (móvel)">
            {NAV.map((n, i) => (
              <Link key={n.href} href={n.href} className="flex items-baseline gap-3 border-b border-line py-3 text-[15px] last:border-0">
                <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
