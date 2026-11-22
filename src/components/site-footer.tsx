"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Wordmark } from "./logo";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <Wordmark />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Enciclopédia feita por fã. Digimon, seus nomes e artes são propriedade de Bandai Namco e Toei Animation; este projeto não é afiliado a elas.
          </p>
        </div>
        <FooterCol title="Explorar" links={[["/digimon", "Enciclopédia"], ["/linhas", "Linhas evolutivas"], ["/universos", "Digimon por Universo"], ["/curiosidades", "Curiosidades"]]} />
        <FooterCol title="Classificações" links={[["/estagios", "Estágios"], ["/atributos", "Atributos"], ["/tipos", "Tipos"], ["/familias", "Famílias"], ["/grupos", "Grupos"]]} />
        <FooterCol title="Referência" links={[["/fontes", "Fontes e confiabilidade"], ["/comparar", "Comparador"], ["/universos/comparar", "Comparar entre jogos"]]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="label mb-4">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-fg/80 hover:text-primary">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
