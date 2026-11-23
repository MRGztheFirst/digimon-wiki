import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, ChevronDown, Clapperboard, Egg, Gamepad2, Layers, Scale, Sparkles, Tv } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, mediaKindOf, type MediaKind } from "@/lib/constants";
import { cn, yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Digimon por Universo") };
}

const ICONS = { anime: Tv, movie: Clapperboard, manga: BookOpen, game: Gamepad2, vpet: Egg, card: Layers, other: Sparkles };
const FACES = 5;

type Face = { id: number; name: string; imageUrl: string | null };

export default async function UniversesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { t, td, ln, num } = await getI18n();
  const { tipo } = await searchParams;
  const filter = tipo && tipo in MEDIA_KINDS ? (tipo as MediaKind) : null;

  const [media, appearances, frequent] = await Promise.all([
    db.media.findMany({
      orderBy: [{ year: "asc" }, { name: "asc" }],
      include: { _count: { select: { appearances: true, evolutionContexts: true, features: true } } },
    }),
    db.appearance.findMany({
      where: { media: { imported: false }, digimon: { imageUrl: { not: null } } },
      orderBy: { id: "asc" },
      select: { mediaId: true, digimon: { select: { id: true, name: true, imageUrl: true } } },
    }),
    db.$queryRaw<{ mediaId: number; id: number; name: string; imageUrl: string | null; n: bigint }[]>`
      SELECT ec.mediaId AS mediaId, d.id AS id, d.name AS name, d.imageUrl AS imageUrl, COUNT(*) AS n
      FROM EvolutionContext ec
      JOIN Evolution e ON e.id = ec.evolutionId
      JOIN Digimon d ON d.id = e.fromId
      JOIN Media m ON m.id = ec.mediaId
      WHERE m.imported = 0 AND d.imageUrl IS NOT NULL
      GROUP BY ec.mediaId, d.id
      ORDER BY ec.mediaId, n DESC, d.number ASC`,
  ]);

  const faces = new Map<number, Face[]>();
  for (const { mediaId, ...d } of [...appearances.map((a) => ({ mediaId: a.mediaId, ...a.digimon })), ...frequent.map(({ n: _n, ...r }) => r)]) {
    const list = faces.get(mediaId) ?? [];
    if (list.length < FACES && !list.some((f) => f.id === d.id)) list.push(d);
    faces.set(mediaId, list);
  }

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

        {shown.length > 0 ? (
          <ol>
            {years.map((y, yi) => {
              const items = shown.filter((m) => (m.year ?? 0) === y);
              return (
                <li key={y} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-8">
                  <div>
                    <div className="sticky top-20 flex items-center justify-end pt-3 font-display text-xl font-semibold tabular-nums leading-none tracking-tight text-fg/90 sm:pt-4 sm:text-3xl">
                      {y || "?"}
                      <span className="absolute -right-[21px] h-[9px] w-[9px] rounded-full border-2 border-primary bg-bg sm:-right-[37px]" aria-hidden="true" />
                    </div>
                  </div>
                  <div className={cn("border-l border-line pl-5 sm:pl-8", yi === years.length - 1 ? "pb-2" : "pb-10")}>
                    <div className="grid gap-3 xl:grid-cols-2">
                      {items.map((m, mi) => {
                        const k = mediaKindOf(m.kind);
                        const Icon = ICONS[k];
                        const list = faces.get(m.id) ?? [];
                        const rest = Math.max(0, m._count.appearances - list.length);
                        const wide = items.length % 2 === 1 && mi === items.length - 1;
                        const stats = [
                          m._count.appearances > 0 && `${num(m._count.appearances)} Digimon`,
                          m._count.evolutionContexts > 0 && (m._count.evolutionContexts === 1 ? t("1 evolução") : t("{n} evoluções", { n: num(m._count.evolutionContexts) })),
                          m._count.features > 0 && (m._count.features === 1 ? t("1 sistema") : t("{n} sistemas", { n: num(m._count.features) })),
                        ].filter(Boolean);
                        return (
                          <Link
                            key={m.id}
                            href={`/universos/${m.slug}`}
                            className={cn("card group relative flex flex-col overflow-hidden p-5 transition-colors hover:border-[var(--media)]", wide && "xl:col-span-2 xl:flex-row xl:items-end xl:gap-10")}
                            style={{ "--media": m.color } as React.CSSProperties}
                          >
                            <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.18] bg-[var(--media)] transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none" aria-hidden="true" />
                            <ArrowUpRight size={15} aria-hidden="true" className="absolute right-4 top-4 text-muted transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg motion-reduce:transition-none motion-reduce:transform-none" />
                            <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 pr-6 font-mono text-[11px] uppercase tracking-wider text-muted">
                              <Icon size={13} aria-hidden="true" style={{ color: m.color }} />
                              <span>{t(MEDIA_KINDS[k].label)}</span>
                              {m.endYear && m.endYear !== m.year && <span>· {yearRange(m.year, m.endYear)}</span>}
                              {m.platform && <span className="truncate normal-case tracking-normal">· {m.platform}</span>}
                            </div>
                            <h3 className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight">{ln(m)}</h3>
                            {m.description && <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">{td(m.description)}</p>}
                            </div>
                            <div className={cn("mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4", wide && "xl:shrink-0 xl:flex-col xl:items-end xl:pt-0")}>
                              {list.length > 0 && (
                                <div className="flex items-center">
                                  {list.map((f, i) => (
                                    <span key={f.id} className={cn("block h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-surface", i > 0 && "-ml-2")}>
                                      <DigimonAvatar name={f.name} imageUrl={f.imageUrl} rounded="rounded-none" className="h-full w-full" />
                                    </span>
                                  ))}
                                  {rest > 0 && <span className="-ml-2 flex h-9 min-w-9 items-center justify-center rounded-full bg-surface-2 px-1.5 font-mono text-[11px] text-muted ring-2 ring-surface">+{num(rest)}</span>}
                                </div>
                              )}
                              {stats.length > 0 && <div className="flex flex-wrap gap-x-3 text-xs text-muted">{stats.map((s) => <span key={s as string}>{s}</span>)}</div>}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="card p-6 text-center text-sm text-muted">{t("Nenhuma obra com página completa deste tipo ainda.")}</p>
        )}

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
