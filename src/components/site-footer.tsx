"use client";

import Link from "next/link";
import { Logo, Wordmark } from "./logo";
import { useI18n, useSitePathname } from "@/i18n/client";

export function SiteFooter() {
  const pathname = useSitePathname();
  const { t } = useI18n();
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
            {t("Enciclopédia feita por fã. Digimon, seus nomes e artes são propriedade de Bandai Namco e Toei Animation; este projeto não é afiliado a elas.")}
          </p>
        </div>
        <FooterCol title={t("Explorar")} links={[["/digimon", t("Enciclopédia")], ["/linhas", t("Linhas evolutivas")], ["/universos", t("Digimon por Universo")], ["/vantagens", t("Vantagens em batalha")], ["/curiosidades", t("Curiosidades")]]} />
        <FooterCol title={t("Classificações")} links={[["/estagios", t("Estágios")], ["/atributos", t("Atributos")], ["/tipos", t("Tipos")], ["/familias", t("Famílias")], ["/grupos", t("Grupos")]]} />
        <FooterCol title={t("Referência")} links={[["/fontes", t("Fontes")], ["/comparar", t("Comparador")], ["/universos/comparar", t("Comparar entre jogos")]]} />
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-muted md:px-6">
          {t("Fontes: perfis do")}{" "}
          <a href="https://digimon.net/reference/" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-fg hover:underline">Digimon Reference Book</a>{" "}
          {t("(Bandai); dados, evoluções e artes oficiais via")}{" "}
          <a href="https://wikimon.net/" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-fg hover:underline">Wikimon</a> {t("e")}{" "}
          <a href="https://digi-api.com/" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-fg hover:underline">Digi-API</a>.
        </p>
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
