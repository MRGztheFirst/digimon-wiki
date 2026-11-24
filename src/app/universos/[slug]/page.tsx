import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronDown, ChevronUp, GitBranch, Layers, ListChecks, Scale, Sparkles, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect, type CardDigimon } from "@/lib/queries";
import { Breadcrumbs, Container, Section } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { DigimonCard, DigimonChip, EmptyState } from "@/components/digimon-card";
import { MEDIA_ICONS } from "@/components/media-timeline";
import { EVOLUTION_KINDS, FEATURE_CATEGORIES, MEDIA_KINDS, evoKindOf, mediaKindOf, type FeatureCategory } from "@/lib/constants";
import { cn, yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t, td, ln } = await getI18n();
  const m = await db.media.findUnique({ where: { slug }, select: { name: true, nameJp: true, description: true } });
  return { title: m ? ln(m) : t("Universo"), description: td(m?.description) ?? undefined };
}

const FEATURE_ICONS: Record<FeatureCategory, React.ReactNode> = {
  "evolution-system": <GitBranch size={18} />,
  requirements: <ListChecks size={18} />,
  "exclusive-system": <Star size={18} />,
  particularity: <Sparkles size={18} />,
};

const GROUP_PREVIEW = 24;
const EVO_LIMIT = 300;
const FACES = 5;

const delay = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

export default async function MediaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t, td, ln, num } = await getI18n();
  const [m, stageOrder] = await Promise.all([
    db.media.findUnique({
      where: { slug },
      include: {
        features: { include: { source: true }, orderBy: { order: "asc" } },
        stages: { include: { stage: true }, orderBy: { stage: { order: "asc" } } },
        appearances: { include: { digimon: { select: { ...cardSelect, _count: { select: { appearances: true } } } } }, orderBy: { digimon: { number: "asc" } } },
        evolutionContexts: {
          include: {
            evolution: {
              include: {
                from: { select: cardSelect },
                to: { select: cardSelect },
                partners: { include: { digimon: { select: { name: true } } } },
                _count: { select: { contexts: true } },
              },
            },
          },
        },
      },
    }),
    db.stage.findMany({ select: { slug: true, order: true } }),
  ]);
  if (!m) notFound();

  const order = new Map(stageOrder.map((s) => [s.slug, s.order]));
  const rank = (d: CardDigimon) => order.get(d.stage?.slug ?? "") ?? 999;
  const byRank = (a: CardDigimon, b: CardDigimon) => rank(a) - rank(b) || a.number - b.number;

  const cast = new Map<number, { d: CardDigimon; n: number }>();
  const bump = (d: CardDigimon, w: number) => {
    const c = cast.get(d.id);
    if (c) c.n += w;
    else cast.set(d.id, { d, n: w });
  };
  m.appearances.forEach((a) => bump(a.digimon, 1000));
  m.evolutionContexts.forEach((c) => {
    bump(c.evolution.from, 1);
    bump(c.evolution.to, 1);
  });
  const faces = [...cast.values()].filter((x) => rank(x.d) > 0).sort((a, b) => b.n - a.n || a.d.number - b.d.number).slice(0, FACES).map((x) => x.d);

  const stageMap = new Map<string, { name: string; color: string; order: number; n: number }>();
  for (const { d } of cast.values()) {
    if (!d.stage) continue;
    const s = stageMap.get(d.stage.slug);
    if (s) s.n++;
    else stageMap.set(d.stage.slug, { name: d.stage.name, color: d.stage.color, order: rank(d), n: 1 });
  }
  const dist = [...stageMap.values()].sort((a, b) => a.order - b.order);
  const staged = dist.reduce((a, s) => a + s.n, 0);

  const groupMap = new Map<number, { from: CardDigimon; items: typeof m.evolutionContexts }>();
  for (const c of m.evolutionContexts) {
    const g = groupMap.get(c.evolution.from.id);
    if (g) g.items.push(c);
    else groupMap.set(c.evolution.from.id, { from: c.evolution.from, items: [c] });
  }
  const groups = [...groupMap.values()].sort((a, b) => byRank(a.from, b.from));
  groups.forEach((g) => g.items.sort((a, b) => byRank(a.evolution.to, b.evolution.to)));
  let budget = EVO_LIMIT;
  const shownGroups = groups.filter((g) => {
    if (budget <= 0) return false;
    budget -= g.items.length;
    return true;
  });
  const more = shownGroups.length > GROUP_PREVIEW + 4;
  const exclusiveCount = m.evolutionContexts.filter((c) => c.evolution._count.contexts === 1).length;
  const exclusiveDigimon = m.appearances.filter((a) => a.digimon._count.appearances === 1);

  const kind = mediaKindOf(m.kind);
  const Icon = MEDIA_ICONS[kind];
  const years = yearRange(m.year, m.endYear);
  const altName = locale === "ja" ? m.name : m.nameJp;
  const featureCats = (Object.keys(FEATURE_CATEGORIES) as FeatureCategory[]).filter((cat) => m.features.some((f) => f.category === cat));
  const expand = "mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border border-dashed border-line py-2 text-xs font-medium text-muted transition-colors hover:border-primary/60 hover:text-primary peer-focus-visible:border-primary peer-focus-visible:text-primary";
  const stats: [string, number][] = [
    [t("Evoluções"), m.evolutionContexts.length],
    ["Digimon", cast.size],
    [t("Só nesta obra"), exclusiveCount],
  ];

  return (
    <div>
      <div className="relative overflow-hidden border-b border-line" style={{ "--media": m.color } as React.CSSProperties}>
        <span className="grow-x absolute inset-x-0 top-0 h-[3px] bg-[var(--media)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background:radial-gradient(56rem_26rem_at_88%_-10%,var(--media),transparent_70%)]" aria-hidden="true" />
        <Container className="relative pb-10 pt-8">
          <Breadcrumbs items={[["/universos", t("Universos")], [null, ln(m)]]} />
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end lg:gap-14">
            <div className="min-w-0">
              <div className="rise-in flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                <Icon size={14} aria-hidden="true" style={{ color: m.color }} />
                <span>{t(MEDIA_KINDS[kind].label)}</span>
                {years && <span>· {years}</span>}
                {m.platform && <span className="normal-case tracking-normal">· {m.platform}</span>}
              </div>
              <h1 style={delay(60)} className="rise-in mt-3 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">{ln(m)}</h1>
              {altName && <div style={delay(120)} className={cn("rise-in mt-2 text-lg text-muted", locale !== "ja" && "font-jp")}>{altName}</div>}
              {m.description && <p style={delay(160)} className="rise-in mt-4 max-w-2xl text-[15px] leading-relaxed text-fg/80">{td(m.description)}</p>}
              <div style={delay(220)} className="rise-in mt-6 flex flex-wrap gap-2">
                <Link href={`/universos/comparar?m=${m.slug}`} className="btn btn-primary"><Scale size={16} aria-hidden="true" /> {t("Comparar com outra obra")}</Link>
                <Link href={`/digimon?${kind === "game" ? "jogo" : kind === "anime" || kind === "movie" ? "anime" : "midia"}=${m.slug}`} className="btn btn-ghost">{t("Buscar Digimon desta obra")}</Link>
              </div>
            </div>
            {faces.length > 0 && (
              <ul className="grid w-full max-w-[20rem] grid-cols-4 grid-rows-2 gap-2" aria-label={t("Digimon de destaque")}>
                {faces.map((d, i) => (
                  <li key={d.id} style={delay(180 + i * 80)} className={cn("pop-in", i === 0 && "col-span-2 row-span-2")}>
                    <Link href={`/digimon/${d.slug}`} title={d.name} className="group block transition-transform duration-200 hover:-translate-y-1 motion-reduce:transform-none">
                      <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe sizes={i === 0 ? "160px" : "80px"} priority={i === 0}
                        className="aspect-square w-full transition-[filter] duration-200 group-hover:brightness-[0.94]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(m.evolutionContexts.length > 0 || cast.size > 0) && (
            <dl style={delay(260)} className="rise-in mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-[8px] border border-line bg-line md:grid-cols-[repeat(3,minmax(0,9rem))_minmax(0,1fr)]">
              {stats.map(([label, n]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="label">{label}</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums">{num(n)}</dd>
                </div>
              ))}
              {dist.length > 0 && (
                <div className="col-span-3 bg-surface px-4 py-3 md:col-span-1">
                  <dt className="label">{t("Digimon por estágio")}</dt>
                  <dd className="mt-2">
                    <div style={delay(420)} className="grow-x flex h-2 gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
                      {dist.map((s) => <span key={s.name} className="h-full" style={{ width: `${(s.n / staged) * 100}%`, background: s.color }} />)}
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                      {dist.map((s) => (
                        <li key={s.name} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
                          {t(s.name)}
                          <span className="font-mono tabular-nums text-fg/80">{num(s.n)}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Container>
      </div>

      <Container className="space-y-12 py-10">
        {featureCats.length > 0 && (
          <Section title={t("Regras deste universo")}>
            <div className="grid gap-4 md:grid-cols-2">
              {featureCats.map((cat) => (
                <div key={cat} className="reveal card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><span className="text-primary" aria-hidden="true">{FEATURE_ICONS[cat]}</span>{t(FEATURE_CATEGORIES[cat])}</h3>
                  <ul className="space-y-4">
                    {m.features.filter((f) => f.category === cat).map((f) => (
                      <li key={f.id}>
                        <h4 className="font-semibold">{td(f.title)}</h4>
                        <p className="mt-1 text-sm text-muted">{td(f.body)}</p>
                        {f.source?.url && <a href={f.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">{t("Fonte:")} {f.source.title}</a>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {m.stages.length > 0 && (
          <Section title={t("Estágios disponíveis")} icon={<Layers size={20} />}>
            <div className="flex flex-wrap gap-2">
              {m.stages.map((s) => (
                <Link key={s.stageId} href={`/estagios/${s.stage.slug}`} className="rounded-[4px] border px-3 py-2 text-sm" style={{ borderColor: `${s.stage.color}66`, background: `${s.stage.color}14` }}>
                  <span className="font-semibold">{td(s.localName) ?? ln(s.stage)}</span>
                  {s.notes && <span className="text-xs text-muted"> — {td(s.notes)}</span>}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section id="evolucoes" title={t("Evoluções registradas nesta obra ({n})", { n: num(m.evolutionContexts.length) })}
          description={exclusiveCount > 0
            ? t("Agrupadas pelo Digimon de origem. O ponto marca as evoluções que, nesta wiki, só existem neste universo.")
            : t("Agrupadas pelo Digimon de origem.")}>
          {groups.length ? (
            <div className="group/evo">
              {more && <input type="checkbox" id="evo-more" className="peer sr-only" />}
              <ol className="card divide-y divide-line/70 px-4 sm:px-5">
                {shownGroups.map((g, i) => {
                  const notes = g.items.filter((c) => c.requirements || c.notes);
                  return (
                    <li key={g.from.id} className={cn("reveal gap-x-4 gap-y-2.5 py-3.5 sm:grid-cols-[13rem_1rem_minmax(0,1fr)] sm:items-start", more && i >= GROUP_PREVIEW ? "hidden group-has-checked/evo:grid" : "grid")}>
                      <Link href={`/linhas/${g.from.slug}?midia=${m.slug}`} title={t("Ver a linha evolutiva nesta obra")} className="group/from flex min-w-0 items-center gap-3">
                        <DigimonAvatar name={g.from.name} imageUrl={g.from.imageUrl} color={g.from.stage?.color} stripe sizes="44px" className="h-11 w-11 shrink-0 transition-transform duration-200 group-hover/from:scale-105 motion-reduce:transform-none" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover/from:text-primary">{g.from.name}</span>
                          {g.from.stage && <span className="block truncate text-xs text-muted">{t(g.from.stage.name)}</span>}
                        </span>
                      </Link>
                      <ArrowRight size={16} aria-hidden="true" className="mt-[14px] hidden text-muted sm:block" />
                      <div className="min-w-0 sm:pt-[5px]">
                        <ul className="flex flex-wrap gap-1.5">
                          {g.items.map((c) => {
                            const ev = c.evolution;
                            const k = evoKindOf(ev.kind);
                            const only = ev._count.contexts === 1;
                            return (
                              <li key={c.id}>
                                <DigimonChip d={ev.to} size="sm" suffix={
                                  <>
                                    {ev.partners.length > 0 && <span className="text-xs text-muted">+ {ev.partners.map((p) => p.digimon.name).join(", ")}</span>}
                                    {k !== "normal" && <span className="font-mono text-[10px] uppercase tracking-wider text-muted" title={t(EVOLUTION_KINDS[k].label)}>{t(EVOLUTION_KINDS[k].short)}</span>}
                                    {only && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title={t("Só nesta obra")}><span className="sr-only">{t("Só nesta obra")}</span></span>}
                                  </>
                                } />
                              </li>
                            );
                          })}
                        </ul>
                        {notes.map((c) => (
                          <p key={c.id} className="mt-2 text-xs text-muted">
                            <span className="font-medium text-fg/80">{c.evolution.to.name}:</span> {[td(c.requirements), td(c.notes)].filter(Boolean).join(" · ")}
                          </p>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {more && (
                <>
                  <label htmlFor="evo-more" className={`${expand} group-has-checked/evo:hidden`}>{t("Ver mais {n}", { n: num(shownGroups.length - GROUP_PREVIEW) })}<ChevronDown size={14} aria-hidden="true" /></label>
                  <label htmlFor="evo-more" className={`${expand} hidden group-has-checked/evo:flex`}>{t("Ver menos")}<ChevronUp size={14} aria-hidden="true" /></label>
                </>
              )}
              {groups.length > shownGroups.length && (
                <p className="mt-3 text-xs text-muted">{t("Mostrando {shown} de {n} Digimon de origem. Para ver o resto, abra a linha evolutiva de um Digimon e escolha esta obra.", { shown: num(shownGroups.length), n: num(groups.length) })}</p>
              )}
            </div>
          ) : <EmptyState>{t("Nenhuma evolução cadastrada para esta obra ainda.")}</EmptyState>}
        </Section>

        {m.appearances.length > 0 && (
          <Section title={t("Digimon disponíveis ({n})", { n: num(m.appearances.length) })} icon={<Users size={20} />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {m.appearances.map((a) => (
                <DigimonCard key={a.id} d={a.digimon} className="reveal" extra={(a.role || a.form) && <div className="line-clamp-2 text-[11px] text-muted">{[td(a.role), td(a.form)].filter(Boolean).join(" · ")}</div>} />
              ))}
            </div>
          </Section>
        )}

        {exclusiveDigimon.length > 0 && (
          <Section title={t("Digimon que não aparecem em outras obras cadastradas")} icon={<Star size={20} />} description={t("Calculado a partir das aparições registradas nesta wiki — pode mudar conforme novos dados forem adicionados.")}>
            <div className="flex flex-wrap gap-2">{exclusiveDigimon.map((a) => <DigimonChip key={a.id} d={a.digimon} size="sm" />)}</div>
          </Section>
        )}
      </Container>
    </div>
  );
}
