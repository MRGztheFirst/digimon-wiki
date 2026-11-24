import Link from "next/link";
import type { Metadata } from "next";
import { ChevronDown, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader } from "@/components/ui";
import { MEDIA_ICONS as ICONS, MediaTimeline, getTimelineFaces, timelineInclude } from "@/components/media-timeline";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, mediaKindOf, type MediaKind } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Digimon por Universo") };
}

export default async function UniversesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { t, ln, num } = await getI18n();
  const { tipo } = await searchParams;
  const filter = tipo && tipo in MEDIA_KINDS ? (tipo as MediaKind) : null;

  const [media, faces] = await Promise.all([
    db.media.findMany({ orderBy: [{ year: "asc" }, { name: "asc" }], include: timelineInclude }),
    getTimelineFaces(),
  ]);

  const main = media.filter((m) => !m.imported);
  const kindCount = (k: MediaKind) => main.filter((m) => mediaKindOf(m.kind) === k).length;
  const shown = main.filter((m) => !filter || mediaKindOf(m.kind) === filter);
  const years = [...new Set(shown.map((m) => m.year ?? 0))].sort((a, b) => a - b);

  const archive = MEDIA_KIND_KEYS.filter((k) => !filter || k === filter)
    .map((k) => ({
      key: k,
      list: media
        .filter((m) => m.imported && mediaKindOf(m.kind) === k)
        .sort((a, b) => b._count.evolutionContexts - a._count.evolutionContexts || ln(a).localeCompare(ln(b))),
    }))
    .filter((g) => g.list.length);

  const chip = (href: string, on: boolean, label: string, n: number, Icon?: React.ComponentType<{ size?: number; className?: string }>) => (
    <Link
      key={href}
      href={href}
      scroll={false}
      aria-current={on ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-fg/80 hover:border-fg/40 hover:text-fg",
      )}
    >
      {Icon && <Icon size={14} />}
      {label}
      <span className={cn("font-mono text-[11px] tabular-nums", on ? "opacity-80" : "text-muted")}>{n}</span>
    </Link>
  );

  return (
    <div>
      <PageHeader
        crumbs={[[null, t("Digimon por Universo")]]}
        eyebrow={t("Digimon por Universo")}
        title={t("Cada universo tem suas próprias regras")}
        subtitle={t("Evoluções, requisitos, estágios e até atributos podem mudar de um jogo ou mídia para outro. Aqui cada obra tem sua página — nada é tratado como regra universal.")}
      >
        <Link href="/universos/comparar" className="btn btn-primary"><Scale size={16} aria-hidden="true" /> {t("Comparar um Digimon entre jogos")}</Link>
      </PageHeader>

      <Container className="py-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t("Linha do tempo da franquia")}</h2>
            <p className="mt-1 text-sm text-muted">
              {shown.length === 1
                ? t("1 obra com página completa, de {year}.", { year: years[0] || "?" })
                : shown.length > 1 && t("{n} obras com página completa, de {from} a {to}.", { n: shown.length, from: years[0] || "?", to: years[years.length - 1] || "?" })}
            </p>
          </div>
          <nav aria-label={t("Filtrar por tipo")} className="flex flex-wrap gap-2">
            {chip("/universos", !filter, t("Todas"), main.length)}
            {MEDIA_KIND_KEYS.filter((k) => media.some((m) => mediaKindOf(m.kind) === k)).map((k) =>
              chip(`/universos?tipo=${k}`, filter === k, t(MEDIA_KINDS[k].plural), kindCount(k), ICONS[k]),
            )}
          </nav>
        </div>

        <MediaTimeline media={shown} faces={faces} empty={t("Nenhuma obra com página completa deste tipo ainda.")} />

        {archive.length > 0 && (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t("Acervo do Wikimon")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t("Obras citadas no Wikimon que, por enquanto, só têm a árvore evolutiva. O número é a quantidade de evoluções registradas.")}</p>
            <div className="mt-5 space-y-3">
              {archive.map((g) => {
                const Icon = ICONS[g.key];
                return (
                  <details key={g.key} className="group/more rounded-[8px] border border-line bg-surface" open={!!filter}>
                    <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium hover:text-primary [&::-webkit-details-marker]:hidden">
                      <Icon size={15} aria-hidden="true" className="shrink-0 text-muted" />
                      {t(MEDIA_KINDS[g.key].plural)}
                      <span className="font-mono text-[11px] tabular-nums text-muted">{g.list.length}</span>
                      <ChevronDown size={15} aria-hidden="true" className="ml-auto shrink-0 text-muted transition-transform group-open/more:rotate-180 motion-reduce:transition-none" />
                    </summary>
                    <ul className="grid gap-x-6 border-t border-line px-4 py-2 sm:grid-cols-2 xl:grid-cols-3">
                      {g.list.map((m) => (
                        <li key={m.id}>
                          <Link href={`/universos/${m.slug}`} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 text-sm hover:text-primary">
                            <span className="truncate" title={ln(m)}>{ln(m)}</span>
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{num(m._count.evolutionContexts)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
