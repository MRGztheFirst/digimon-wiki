import Link from "next/link";
import { ArrowUpRight, BookOpen, Clapperboard, Egg, Gamepad2, Layers, Sparkles, Tv } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DigimonAvatar } from "./digimon-avatar";
import { MEDIA_KINDS, mediaKindOf } from "@/lib/constants";
import { cn, yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export const MEDIA_ICONS = { anime: Tv, movie: Clapperboard, manga: BookOpen, game: Gamepad2, vpet: Egg, card: Layers, other: Sparkles };
const FACES = 5;

export const timelineInclude = { _count: { select: { appearances: true, evolutionContexts: true, features: true } } } satisfies Prisma.MediaInclude;
export type TimelineMedia = Prisma.MediaGetPayload<{ include: typeof timelineInclude }>;
type Face = { id: number; name: string; imageUrl: string | null };

export async function getTimelineFaces(): Promise<Map<number, Face[]>> {
  const [appearances, frequent] = await Promise.all([
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
  return faces;
}

export async function MediaTimeline({ media, faces, debuts, empty }: { media: TimelineMedia[]; faces: Map<number, Face[]>; debuts?: Map<number, number>; empty: string }) {
  const { t, td, ln, num } = await getI18n();
  const years = [...new Set([...media.map((m) => m.year ?? 0), ...(debuts ? debuts.keys() : [])])].sort((a, b) => a - b);

  if (!media.length && !debuts?.size) return <p className="card p-6 text-center text-sm text-muted">{empty}</p>;

  return (
    <ol>
      {years.map((y, yi) => {
        const items = media.filter((m) => (m.year ?? 0) === y);
        const debut = debuts?.get(y) ?? 0;
        return (
          <li key={y} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-8">
            <div>
              <div className="sticky top-20 flex items-center justify-end pt-3 font-display text-xl font-semibold tabular-nums leading-none tracking-tight text-fg/90 sm:pt-4 sm:text-3xl">
                {y || "?"}
                <span className="absolute -right-[21px] h-[9px] w-[9px] rounded-full border-2 border-primary bg-bg sm:-right-[37px]" aria-hidden="true" />
              </div>
            </div>
            <div className={cn("border-l border-line pl-5 sm:pl-8", yi === years.length - 1 ? "pb-2" : "pb-10")}>
              {items.length > 0 && (
                <div className="grid gap-3 xl:grid-cols-2">
                  {items.map((m, mi) => {
                    const k = mediaKindOf(m.kind);
                    const Icon = MEDIA_ICONS[k];
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
              )}
              {debut > 0 && (
                <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted", items.length > 0 ? "mt-3" : "mt-3 sm:mt-4")}>
                  <Sparkles size={12} className="text-primary" aria-hidden="true" />
                  {t("{n} estreias documentadas", { n: num(debut) })}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
