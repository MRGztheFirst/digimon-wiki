import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, ChevronDown, Clapperboard, Egg, Gamepad2, Layers, Scale, Sparkles, Tv } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader } from "@/components/ui";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, mediaKindOf } from "@/lib/constants";
import { cn, yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Digimon por Universo") };
}

const ICONS = { anime: Tv, movie: Clapperboard, manga: BookOpen, game: Gamepad2, vpet: Egg, card: Layers, other: Sparkles };
const COLS = "sm:grid-cols-[84px_minmax(0,1fr)_repeat(3,76px)_16px]";

export default async function UniversesPage() {
  const { t, td, ln, num } = await getI18n();
  const media = await db.media.findMany({
    orderBy: [{ year: "asc" }, { name: "asc" }],
    include: { _count: { select: { appearances: true, evolutionContexts: true, features: true } } },
  });

  const kinds = MEDIA_KIND_KEYS.map((k) => {
    const list = media.filter((m) => mediaKindOf(m.kind) === k);
    return {
      key: k,
      main: list.filter((m) => !m.imported),
      extra: list.filter((m) => m.imported).sort((a, b) => b._count.evolutionContexts - a._count.evolutionContexts || ln(a).localeCompare(ln(b))),
    };
  }).filter((g) => g.main.length || g.extra.length);

  const stat = (n: number) => <span className={cn("font-mono text-sm tabular-nums sm:text-right", n ? "text-fg" : "text-muted/60")}>{n ? num(n) : "—"}</span>;

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
        <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label={t("Nesta página")}>
            <div className="lg:sticky lg:top-24">
              <div className="label mb-3 hidden lg:block">{t("Nesta página")}</div>
              <ul className="flex flex-wrap gap-2 text-sm lg:block lg:space-y-1 lg:border-l lg:border-line">
                {kinds.map((g) => {
                  const Icon = ICONS[g.key];
                  return (
                    <li key={g.key}>
                      <a
                        href={`#${g.key}`}
                        className="flex items-center gap-2 rounded-[6px] border border-line bg-surface px-2.5 py-1.5 text-muted transition-colors hover:border-fg/40 hover:text-fg lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:bg-transparent lg:py-1 lg:pl-3 lg:hover:border-primary"
                      >
                        <Icon size={14} aria-hidden="true" className="shrink-0" />
                        <span className="flex-1">{t(MEDIA_KINDS[g.key].plural)}</span>
                        <span className="font-mono text-[11px] tabular-nums text-muted">{g.main.length + g.extra.length}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-14">
            {kinds.map((g) => {
              const Icon = ICONS[g.key];
              return (
                <section key={g.key} id={g.key} className="scroll-mt-20">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                    <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight">
                      <Icon size={20} aria-hidden="true" className="text-primary" />
                      {t(MEDIA_KINDS[g.key].plural)}
                    </h2>
                    <span className="text-sm text-muted">
                      {[g.main.length && t("{n} com página completa", { n: g.main.length }), g.extra.length && t("{n} citadas no Wikimon", { n: g.extra.length })].filter(Boolean).join(" · ")}
                    </span>
                  </div>

                  {g.main.length > 0 && (
                    <div className="overflow-hidden rounded-[8px] border border-line">
                      <div className={cn("hidden gap-4 border-b border-line bg-surface-2/60 px-4 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted sm:grid", COLS)}>
                        <span>{t("Ano")}</span>
                        <span>{t("Obra")}</span>
                        <span className="text-right">Digimon</span>
                        <span className="text-right">{t("Evoluções")}</span>
                        <span className="text-right">{t("Sistemas")}</span>
                        <span />
                      </div>
                      {g.main.map((m) => (
                        <Link
                          key={m.id}
                          href={`/universos/${m.slug}`}
                          className={cn("group relative grid gap-x-4 gap-y-1 border-b border-line bg-surface py-4 pl-5 pr-4 transition-colors last:border-0 hover:bg-surface-2/60 sm:items-center", COLS)}
                        >
                          <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: m.color }} aria-hidden="true" />
                          <span className="font-mono text-xs tabular-nums text-muted sm:text-sm">{yearRange(m.year, m.endYear)}</span>
                          <span className="min-w-0">
                            <span className="block font-semibold leading-tight transition-colors group-hover:text-primary">{ln(m)}</span>
                            {m.platform && <span className="mt-0.5 block text-xs text-muted">{m.platform}</span>}
                            {m.description && <span className="mt-1 line-clamp-2 block max-w-2xl text-sm text-muted">{td(m.description)}</span>}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted sm:hidden">
                            <span>{num(m._count.appearances)} Digimon</span>
                            <span>{t("{n} evoluções", { n: num(m._count.evolutionContexts) })}</span>
                            <span>{t("{n} sistemas", { n: num(m._count.features) })}</span>
                          </span>
                          <span className="hidden sm:contents">
                            {stat(m._count.appearances)}
                            {stat(m._count.evolutionContexts)}
                            {stat(m._count.features)}
                          </span>
                          <ArrowRight size={16} aria-hidden="true" className="hidden text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:transform-none sm:block" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {g.extra.length > 0 && (
                    <details className={cn("group/more rounded-[8px] border border-line bg-surface", g.main.length > 0 && "mt-3")} open={!g.main.length}>
                      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium hover:text-primary [&::-webkit-details-marker]:hidden">
                        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-muted transition-transform group-open/more:rotate-180 motion-reduce:transition-none" />
                        {t("Outras obras citadas no Wikimon ({n})", { n: g.extra.length })}
                        <span className="ml-auto hidden text-xs font-normal text-muted sm:block">{t("Só a árvore evolutiva")}</span>
                      </summary>
                      <ul className="grid gap-x-6 border-t border-line px-4 py-2 sm:grid-cols-2 xl:grid-cols-3">
                        {g.extra.map((m) => (
                          <li key={m.id}>
                            <Link href={`/universos/${m.slug}`} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 text-sm hover:text-primary">
                              <span className="truncate" title={ln(m)}>{ln(m)}</span>
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{num(m._count.evolutionContexts)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
