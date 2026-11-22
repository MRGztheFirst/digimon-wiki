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
    <header className="sticky top-0 z-40 bg-bar text-bar-fg shadow-[0_1px_0_rgba(0,0,0,.12)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Digimon Database — início">
          <Logo onBar />
          <Wordmark className="text-[17px] sm:text-[19px]" />
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
                  active ? "border-white font-medium text-white" : "border-transparent text-white/75 hover:text-white",
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
          <ThemeToggle onBar />
          <button
            className="btn h-9 w-9 border-white/25 p-0 text-white hover:border-white/60 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/15 bg-bar px-4 pb-4 pt-3 lg:hidden">
          <div className="mb-3 md:hidden">
            <SearchBox compact />
          </div>
          <nav className="grid" aria-label="Principal (móvel)">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-white/15 py-3 text-[15px] text-white last:border-0">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
