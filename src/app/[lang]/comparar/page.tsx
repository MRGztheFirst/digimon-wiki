import Link from "next/link";
import type { Metadata } from "next";
import { Diff, Equal, Plus, RotateCcw, X } from "lucide-react";
import { db } from "@/lib/db";
import { Breadcrumbs, Container, Missing, Section } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { AttributeBadge, EvoKindBadge, FamilyBadge, Pill, StageBadge } from "@/components/badges";
import { DigimonPickerNav } from "@/components/digimon-picker-nav";
import { cn, paramList } from "@/lib/utils";
import { ELEMENTS, GENERAL, STAT_GAMES, statScorer, type StatKey } from "@/lib/game-stats";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t("Comparador de Digimon") };
}

const MAX = 4;
const MODES = { "1x1": 2, "2x2": 4 } as const;
type Mode = keyof typeof MODES;
const PREVIEW = 5;
const MATCHUPS: [string, string[]][] = [
  ["Rivais de sempre", ["agumon", "gabumon"]],
  ["A fusão e suas origens", ["wargreymon", "metalgarurumon", "omegamon"]],
  ["Primos dinossauros", ["greymon", "geogreymon", "tyranomon"]],
  ["Royal Knights", ["omegamon", "dukemon", "alphamon", "examon"]],
];
const highlight ="border-primary/60 bg-primary/10 text-fg";
const pillHit = "border-primary/60! bg-primary/10!";

type Mon = { slug: string; name: string; imageUrl: string | null; stage: { color: string } | null };

const sharedBy = <T,>(sets: Set<T>[]) => (sets.length > 1 ? new Set([...sets[0]].filter((x) => sets.every((s) => s.has(x)))) : new Set<T>());
const uniqBy = <T,>(items: T[], key: (x: T) => string) => [...new Map(items.map((x) => [key(x), x])).values()];
const href = (s: string[], m: Mode) => `/comparar?${s.length ? `d=${s.join(",")}&` : ""}modo=${m}`;

function Vs() {
  return (
    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center self-center justify-self-center rounded-full border border-line bg-surface font-brand text-xs font-bold text-muted">
      VS
    </span>
  );
}

function Cols({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5", className)} style={{ gridTemplateColumns: "var(--cols)" }}>{children}</div>;
}

function Board({ cols, heads, children }: { cols: number; heads: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="scroll-slim -mx-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="min-w-(--min) lg:min-w-0" style={{ ["--min" as string]: `${cols * 11}rem`, ["--cols" as string]: `repeat(${cols}, minmax(0, 1fr))` }}>
        <Cols className="mb-4 border-b border-line pb-3 lg:hidden">{heads}</Cols>
        {children}
      </div>
    </div>
  );
}

function Row({ label, tag, children }: { label: string; tag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-b border-line/70 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="label">{label}</span>
        {tag}
      </div>
      <Cols>{children}</Cols>
    </div>
  );
}

function Tag({ same, children }: { same: boolean; children: React.ReactNode }) {
  return <span className={cn("rounded-[4px] px-1.5 py-px font-mono text-[10px] uppercase tracking-wider", same ? "bg-surface-2 text-muted" : "bg-primary/12 text-primary")}>{children}</span>;
}

function MonChip({ m, hit, extra }: { m: Mon; hit?: boolean; extra?: React.ReactNode }) {
  return (
    <Link href={`/digimon/${m.slug}`} className={cn("flex min-w-0 items-center gap-2 rounded-[6px] border py-1 pl-1 pr-2 text-[13px] transition-colors hover:border-primary/70", hit ? highlight : "border-line bg-surface")}>
      <DigimonAvatar name={m.name} imageUrl={m.imageUrl} color={m.stage?.color} stripe className="h-8 w-8 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{m.name}</span>
      {extra}
    </Link>
  );
}

function Folded({ items, more, less, inner = "flex flex-col gap-1.5" }: { items: React.ReactNode[]; more: string; less: string; inner?: string }) {
  if (items.length <= PREVIEW) return <>{items}</>;
  return (
    <>
      {items.slice(0, PREVIEW)}
      <details className="group/more basis-full">
        <summary className="cursor-pointer list-none text-[13px] font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open/more:hidden">{more}</span>
          <span className="hidden group-open/more:inline">{less}</span>
        </summary>
        <div className={cn("mt-1.5", inner)}>{items.slice(PREVIEW)}</div>
      </details>
    </>
  );
}

export default async function ComparePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await localeFromParams(params);
  const sp = await searchParams;
  const { t, td, ln } = await getI18n();
  const raw = [...new Set(paramList(sp.d))];
  const mode: Mode = sp.modo === "1x1" || sp.modo === "2x2" ? sp.modo : raw.length > 2 ? "2x2" : "1x1";
  const cap = MODES[mode];
  const wide = mode === "1x1";
  const slugs = raw.slice(0, cap);
  const monSelect = { name: true, slug: true, imageUrl: true, stage: { select: { color: true } } } as const;
  const [found, examples, allStats] = await Promise.all([
    db.digimon.findMany({
      where: { slug: { in: slugs } },
      include: {
        stage: true,
        attribute: true,
        types: { include: { type: true } },
        families: { include: { family: true } },
        groups: { include: { group: true } },
        attacks: { orderBy: { order: "asc" } },
        abilities: true,
        appearances: { include: { media: true } },
        evolutionsFrom: { include: { to: { select: monSelect }, contexts: { include: { media: { select: { name: true, nameJp: true, kind: true } } } } } },
        evolutionsTo: { include: { from: { select: monSelect } } },
        gameStats: true,
      },
    }),
    db.digimon.findMany({ where: { slug: { in: slugs.length ? [] : MATCHUPS.flatMap(([, s]) => s) } }, select: monSelect }),
    slugs.length ? db.gameStats.findMany({ select: { game: true, hp: true, mp: true, atk: true, def: true, spi: true, spd: true, apt: true } }) : Promise.resolve([]),
  ]);
  const list = slugs.map((s) => found.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => !!d);
  type D = (typeof list)[number];
  const n = list.length;
  const listSlugs = list.map((d) => d.slug);

  const next = (d: D) => uniqBy(d.evolutionsFrom, (e) => e.to.slug);
  const prev = (d: D) => uniqBy(d.evolutionsTo, (e) => e.from.slug);
  const sharedTypes = sharedBy(list.map((d) => new Set(d.types.map((x) => x.typeId))));
  const sharedFamilies = sharedBy(list.map((d) => new Set(d.families.map((x) => x.familyId))));
  const sharedGroups = sharedBy(list.map((d) => new Set(d.groups.map((x) => x.groupId))));
  const sharedNext = sharedBy(list.map((d) => new Set(d.evolutionsFrom.map((e) => e.to.slug))));
  const sharedPrev = sharedBy(list.map((d) => new Set(d.evolutionsTo.map((e) => e.from.slug))));
  const sharedMedia = sharedBy(list.map((d) => new Set(d.appearances.map((a) => a.mediaId))));
  const sharedMediaList = n > 1 ? uniqBy(list[0].appearances.filter((a) => sharedMedia.has(a.mediaId)), (a) => String(a.mediaId)) : [];
  const ids = (xs: number[]) => [...xs].sort((a, b) => a - b).join();
  const games = (d: D) => {
    const m = new Map<string, string[]>();
    d.evolutionsFrom.forEach((e) => e.contexts.filter((c) => c.media.kind === "game").forEach((c) => m.set(ln(c.media), [...new Set([...(m.get(ln(c.media)) ?? []), e.to.name])])));
    return [...m];
  };

  const allRows: { label: string; key: (d: D) => string; render: (d: D) => React.ReactNode }[] = [
    { label: t("Estágio"), key: (d) => d.stage?.slug ?? "", render: (d) => <StageBadge stage={d.stage} /> },
    { label: t("Atributo"), key: (d) => d.attribute?.slug ?? "", render: (d) => <AttributeBadge attribute={d.attribute} /> },
    {
      label: t("Tipo"),
      key: (d) => ids(d.types.map((x) => x.typeId)),
      render: (d) => d.types.map((x) => <Pill key={x.typeId} href={`/tipos/${x.type.slug}`} className={cn(sharedTypes.has(x.typeId) && pillHit)}>{ln(x.type)}</Pill>),
    },
    {
      label: t("Família"),
      key: (d) => ids(d.families.map((x) => x.familyId)),
      render: (d) => d.families.map((f) => <FamilyBadge key={f.familyId} family={f.family} suffix={f.status !== "official" ? " (?)" : ""} className={cn(sharedFamilies.has(f.familyId) && pillHit)} />),
    },
    {
      label: t("Grupo"),
      key: (d) => ids(d.groups.map((x) => x.groupId)),
      render: (d) => d.groups.map((g) => <Pill key={g.groupId} href={`/grupos/${g.group.slug}`} className={cn(sharedGroups.has(g.groupId) && pillHit)}>{ln(g.group)}</Pill>),
    },
  ];
  const rows = allRows.filter((r) => list.some((d) => r.key(d) !== ""));
  const same = (r: (typeof rows)[number]) => new Set(list.map(r.key)).size === 1;
  const differs = n > 1 ? rows.filter((r) => !same(r)) : [];

  const first = list[0];
  const allSame = (f: (d: D) => string | undefined) => new Set(list.map(f)).size === 1;
  const common: React.ReactNode[] = n > 1 ? [
    first.stage && allSame((d) => d.stage?.slug) && <StageBadge key="stage" stage={first.stage} link={false} />,
    first.attribute && allSame((d) => d.attribute?.slug) && <AttributeBadge key="attr" attribute={first.attribute} link={false} />,
    ...first.types.filter((x) => sharedTypes.has(x.typeId)).map((x) => <Pill key={`t${x.typeId}`}>{ln(x.type)}</Pill>),
    ...first.families.filter((f) => sharedFamilies.has(f.familyId)).map((f) => <FamilyBadge key={`f${f.familyId}`} family={f.family} link={false} />),
    ...first.groups.filter((g) => sharedGroups.has(g.groupId)).map((g) => <Pill key={`g${g.groupId}`}>{ln(g.group)}</Pill>),
    sharedNext.size > 0 && <Pill key="next" color="var(--primary)">{t("{n} evoluções em comum", { n: sharedNext.size })}</Pill>,
    sharedMedia.size > 0 && <Pill key="media" color="var(--primary)">{t("{n} obras juntos", { n: sharedMedia.size })}</Pill>,
  ].filter(Boolean) : [];

  const game = STAT_GAMES.find((g) => g.key === sp.jogo) ?? GENERAL;
  const general = game.key === GENERAL.key;
  const scorer = statScorer(allStats);
  const score = (d: D, k: StatKey) => scorer.score(d.gameStats, k);
  const statsOf = (d: D) => {
    if (!general) return d.gameStats.find((s) => s.game === game.key);
    if (!d.gameStats.length) return undefined;
    return { hp: score(d, "hp"), mp: score(d, "mp"), atk: score(d, "atk"), def: score(d, "def"), spi: score(d, "spi"), spd: score(d, "spd"), apt: null, strong: null, weak: null };
  };
  const maxOf = (k: StatKey) => (general ? 100 : scorer.max(game.key, k));
  const withStats = list.filter((d) => statsOf(d));
  const wins = new Map(list.map((d) => [d.id, 0]));
  if (withStats.length > 1) {
    for (const [k] of game.stats) {
      const vals = withStats.map((d) => statsOf(d)?.[k] ?? -1);
      const top = Math.max(...vals);
      if (top >= 0) withStats.forEach((d, i) => vals[i] === top && wins.set(d.id, (wins.get(d.id) ?? 0) + 1));
    }
  }
  const bestWins = Math.max(0, ...wins.values());
  const statInfo = (d: D | undefined, k: StatKey) => {
    const v = d ? (statsOf(d)?.[k] ?? null) : null;
    const max = maxOf(k);
    const lead = v !== null && withStats.length > 1 && v === Math.max(...withStats.map((o) => statsOf(o)?.[k] ?? -1));
    return { v, lead, pct: v !== null && max ? Math.max(2, (v / max) * 100) : 0, fill: lead || withStats.length === 1 ? "bg-primary" : "bg-fg/25" };
  };
  const duelHead = (d: D | undefined, left: boolean) =>
    d ? (
      <div className={cn("flex min-w-0 items-center gap-2", !left && "flex-row-reverse text-right")}>
        <DigimonAvatar name={d.name} imageUrl={d.imageUrl} className="h-8 w-8 shrink-0" />
        <span className="truncate text-sm font-semibold">{d.name}</span>
      </div>
    ) : (
      <span className={cn("text-sm text-muted", !left && "text-right")}>{t("Vaga livre")}</span>
    );
  const absent = (d: D | undefined) => {
    if (!d) return <span className="text-sm text-muted">{t("Vaga livre")}</span>;
    const elsewhere = STAT_GAMES.find((g) => g.key !== game.key && d.gameStats.some((s) => s.game === g.key));
    return (
      <>
        <span className="text-sm font-medium">{general ? t("{name} ainda não tem status registrados.", { name: d.name }) : t("Sem status de {name} em {game}.", { name: d.name, game: game.short })}</span>
        {elsewhere ? (
          <Link href={`${href(listSlugs, mode)}&jogo=${elsewhere.key}#status`} className="text-[13px] font-medium text-accent hover:underline">
            {t("Ver em {game}", { game: elsewhere.short })} →
          </Link>
        ) : (
          <span className="max-w-64 text-xs leading-relaxed text-muted">{t("Ele não tem ficha em nenhum dos jogos com status: Cyber Sleuth, Time Stranger, Sunburst & Moonlight e Super Xros Wars.")}</span>
        )}
      </>
    );
  };
  const duelSide = (d: D | undefined, k: StatKey, left: boolean) => {
    const s = statInfo(d, k);
    if (s.v === null) return null;
    return (
      <div className={cn("flex items-center gap-2.5", left && "flex-row-reverse")}>
        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <span className={cn("block h-full rounded-full", left && "ml-auto", s.fill)} style={{ width: `${s.pct}%` }} />
        </span>
        <span className={cn("w-9 shrink-0 font-mono text-xs", left ? "text-left" : "text-right", s.lead ? "font-semibold text-fg" : "text-muted")}>{s.v}</span>
      </div>
    );
  };
  const elements = (v: string | null | undefined) =>
    v ? v.split(",").map((e) => e.trim()).filter(Boolean).map((e) => <Pill key={e} color={ELEMENTS[e]?.[1]}>{t(ELEMENTS[e]?.[0] ?? e)}</Pill>) : [];

  const heads = list.map((d) => (
    <div key={d.id} className="flex min-w-0 items-center gap-2">
      <DigimonAvatar name={d.name} imageUrl={d.imageUrl} className="h-7 w-7 shrink-0" />
      <span className="truncate text-sm font-semibold">{d.name}</span>
    </div>
  ));
  const more = (count: number) => t("Ver mais {n}", { n: count });
  const hasEvos = list.some((d) => d.evolutionsFrom.length || d.evolutionsTo.length);
  const hasGames = list.some((d) => games(d).length);
  const hasAbilities = list.some((d) => d.abilities.length);

  const filled = (d: D) => (
    <div key={d.id} className="card group fade-in relative flex h-full flex-col overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: d.stage?.color ?? "var(--line)" }} />
      <Link
        href={href(listSlugs.filter((s) => s !== d.slug), mode)}
        aria-label={t("Remover {name}", { name: d.name })}
        className="absolute right-2 top-2.5 z-10 rounded-md bg-surface/80 p-1 text-muted backdrop-blur transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <X size={15} />
      </Link>
      {wide ? (
        <Link href={`/digimon/${d.slug}`} className="flex flex-1 items-center gap-4 p-4 sm:gap-5 sm:p-5">
          <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} sizes="144px" className="aspect-square w-28 shrink-0 sm:w-36" />
          <div className="min-w-0 flex-1 pr-5">
            <div className="truncate font-display text-xl font-bold tracking-tight group-hover:text-primary">{d.name}</div>
            {d.nameJp && <div className="truncate font-jp text-xs text-muted">{d.nameJp}</div>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StageBadge stage={d.stage} link={false} />
              <AttributeBadge attribute={d.attribute} link={false} />
            </div>
            {d.summary && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{td(d.summary)}</p>}
          </div>
        </Link>
      ) : (
        <Link href={`/digimon/${d.slug}`} className="flex flex-1 flex-col items-center p-3 pt-4 text-center">
          <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} sizes="128px" className="aspect-square w-full max-w-32" />
          <div className="mt-2.5 w-full truncate font-display text-[15px] font-bold tracking-tight group-hover:text-primary">{d.name}</div>
          {d.nameJp && <div className="w-full truncate font-jp text-[11px] text-muted">{d.nameJp}</div>}
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <StageBadge stage={d.stage} link={false} />
            <AttributeBadge attribute={d.attribute} link={false} />
          </div>
        </Link>
      )}
    </div>
  );
  const empty = (i: number) => (
    <div key={`slot-${i}`} className={cn("flex h-full flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-line bg-bg p-4 text-center", wide ? "min-h-44" : "min-h-56", i !== n && "opacity-60")}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Plus size={20} />
      </span>
      {i === n ? (
        <>
          <span className="label">{n ? t("Adicionar outro Digimon") : t("Escolha o primeiro Digimon")}</span>
          <div className="w-full max-w-60 text-left">
            <DigimonPickerNav basePath="/comparar" param="d" keep={{ modo: mode }} append={listSlugs} placeholder={t("Buscar Digimon...")} />
          </div>
        </>
      ) : (
        <span className="label">{t("Vaga livre")}</span>
      )}
    </div>
  );
  const slotNodes = Array.from({ length: cap }, (_, i) => (list[i] ? filled(list[i]) : empty(i)));
  const team = (k: number) => (
    <div className="flex flex-col">
      <div className="label mb-2">{t("Time {n}", { n: k + 1 })}</div>
      <div className="grid flex-1 grid-cols-2 gap-3">{slotNodes.slice(k * 2, k * 2 + 2)}</div>
    </div>
  );

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <Container className="py-8 md:py-10">
          <Breadcrumbs items={[[null, t("Comparador")]]} />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Comparador de Digimon")}</h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
                {t("Escolha até {n} Digimon e veja, de relance, no que eles se parecem e no que diferem.", { n: MAX })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label={t("Formato da comparação")} className="inline-flex rounded-[7px] border border-line bg-bg p-0.5">
                {(Object.keys(MODES) as Mode[]).map((m) => (
                  <Link
                    key={m}
                    href={href(listSlugs.slice(0, MODES[m]), m)}
                    title={m === "1x1" ? t("Duelo: um contra um") : t("Times: dois contra dois")}
                    aria-current={m === mode ? "true" : undefined}
                    className={cn("rounded-[5px] px-3 py-1 text-[13px] font-medium transition-colors", m === mode ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
                  >
                    <span className="font-brand font-bold">{m === "1x1" ? "1×1" : "2×2"}</span>
                    <span className="ml-1.5 hidden sm:inline">{m === "1x1" ? t("Duelo") : t("Times")}</span>
                  </Link>
                ))}
              </div>
              {n > 0 && (
                <Link href={href([], mode)} className="btn btn-ghost h-8 px-3 text-[13px]">
                  <RotateCcw size={14} />
                  {t("Limpar comparação")}
                </Link>
              )}
            </div>
          </div>

          {wide ? (
            <div className="mt-8 grid items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              {slotNodes[0]}
              <Vs />
              {slotNodes[1]}
            </div>
          ) : (
            <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              {team(0)}
              <Vs />
              {team(1)}
            </div>
          )}

          {n === 1 && <p className="mt-5 text-sm text-muted">{t("Adicione mais um Digimon para ver o que eles têm em comum.")}</p>}

          {n > 1 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] border border-line bg-bg p-4">
                <div className="label mb-2.5 flex items-center gap-1.5"><Equal size={14} />{t("Em comum")}</div>
                {common.length ? <div className="flex flex-wrap gap-1.5">{common}</div> : <p className="text-sm text-muted">{t("Nada em comum por aqui.")}</p>}
              </div>
              <div className="rounded-[8px] border border-line bg-bg p-4">
                <div className="label mb-2.5 flex items-center gap-1.5"><Diff size={14} />{t("Diferem em")}</div>
                {differs.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {differs.map((r) => <span key={r.label} className="rounded-[5px] bg-primary/12 px-2 py-[3px] text-[12px] font-medium text-primary">{r.label}</span>)}
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t("Mesma classificação em tudo.")}</p>
                )}
              </div>
            </div>
          )}
        </Container>
      </section>

      <Container className="space-y-14 py-10">
        {n === 0 ? (
          <Section title={t("Confrontos prontos")} description={t("Comece por um destes confrontos ou busque qualquer Digimon acima.")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MATCHUPS.map(([title, s]) => {
                const mons = s.map((slug) => examples.find((m) => m.slug === slug)).filter((m): m is NonNullable<typeof m> => !!m);
                return (
                  <Link key={title} href={href(s, s.length > 2 ? "2x2" : "1x1")} className="card group flex flex-col gap-4 p-4 transition-colors hover:border-primary/70">
                    <span className="flex items-center pl-1">
                      {mons.map((m, i) => (
                        <span key={m.slug} className="relative -ml-5 transition-[margin] duration-500 ease-out first:ml-0 group-hover:-ml-2 group-hover:first:ml-0 motion-reduce:transition-none" style={{ zIndex: mons.length - i }}>
                          <DigimonAvatar name={m.name} imageUrl={m.imageUrl} className="h-16 w-16 ring-2 ring-surface" />
                        </span>
                      ))}
                    </span>
                    <span>
                      <span className="block font-brand text-lg font-semibold leading-tight group-hover:text-primary">{t(title)}</span>
                      <span className="mt-1 block truncate font-mono text-[10.5px] uppercase tracking-wider text-muted">{mons.map((m) => m.name).join(" × ")}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Section>
        ) : (
          <>
            <Section
              title={t("Classificação")}
              action={n > 1 && (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={cn("h-3 w-3 rounded-[3px] border", highlight)} />
                  {t("Compartilhado por todos")}
                </span>
              )}
            >
              <Board cols={cap} heads={heads}>
                {rows.map((r) => (
                  <Row key={r.label} label={r.label} tag={n > 1 && <Tag same={same(r)}>{same(r) ? t("Igual") : t("difere")}</Tag>}>
                    {list.map((d) => <div key={d.id} className="flex flex-wrap gap-1.5">{r.key(d) !== "" ? r.render(d) : <Missing />}</div>)}
                  </Row>
                ))}
              </Board>
            </Section>

            <Section
              id="status"
              title={t("Status base")}
              description={
                general
                  ? t("Nota de 0 a 100 em cada status: mostra onde o Digimon fica em relação a todos os outros. 50 é a média. Calculada a partir dos jogos que têm ficha de status.")
                  : t("Números do nível inicial em {game}. Cada jogo tem os seus, então eles não valem para outros jogos.", { game: game.name })
              }
            >
              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <div role="group" aria-label={t("Jogo")} className="inline-flex max-w-full flex-wrap rounded-[7px] border border-line bg-surface p-0.5">
                  {[GENERAL, ...STAT_GAMES].map((g) => (
                    <Link
                      key={g.key}
                      href={g.key === GENERAL.key ? `${href(listSlugs, mode)}#status` : `${href(listSlugs, mode)}&jogo=${g.key}#status`}
                      aria-current={g.key === game.key ? "true" : undefined}
                      className={cn("rounded-[5px] px-3 py-1 text-[13px] font-medium transition-colors", g.key === game.key ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
                    >
                      {g.key === GENERAL.key ? t("Nota geral") : g.short}
                    </Link>
                  ))}
                </div>
                {general && <span className="text-xs text-muted">{t("Ou veja os números de cada jogo.")}</span>}
              </div>

              {withStats.length === 0 ? (
                <div className="card p-6 text-sm text-muted">
                  {general
                    ? n > 1 ? t("Nenhum destes Digimon tem status registrados ainda.") : t("{name} ainda não tem status registrados.", { name: list[0].name })
                    : n > 1 ? t("Nenhum destes Digimon tem status registrados em {game}.", { game: game.name }) : t("{name} não tem status registrados em {game}.", { name: list[0].name, game: game.name })}
                </div>
              ) : (
                <>
                  {withStats.length > 1 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {list.map((d) => {
                        const has = !!statsOf(d);
                        const w = wins.get(d.id) ?? 0;
                        return (
                          <div key={d.id} className={cn("flex items-center gap-2.5 rounded-[8px] border py-1.5 pl-1.5 pr-3.5", has && w === bestWins && w > 0 ? highlight : "border-line bg-surface")}>
                            <DigimonAvatar name={d.name} imageUrl={d.imageUrl} className="h-9 w-9 shrink-0" />
                            <div className="leading-tight">
                              <div className="text-sm font-semibold">{d.name}</div>
                              <div className="text-xs text-muted">{has ? t("Lidera em {n} de {m} status", { n: w, m: game.stats.length }) : t("Sem dados neste jogo")}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {wide ? (
                    <div className="card grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] overflow-hidden sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]">
                      <div className="border-b border-line px-4 py-3 sm:px-5" style={{ gridColumn: 1, gridRow: 1 }}>{duelHead(list[0], true)}</div>
                      <div className="flex items-center justify-center border-b border-line font-brand text-xs font-bold text-muted" style={{ gridColumn: 2, gridRow: 1 }}>VS</div>
                      <div className="border-b border-line px-4 py-3 sm:px-5" style={{ gridColumn: 3, gridRow: 1 }}>{duelHead(list[1], false)}</div>
                      {[0, 1].map((side) =>
                        !(list[side] && statsOf(list[side])) ? (
                          <div
                            key={`absent-${side}`}
                            className="flex flex-col items-center justify-center gap-1.5 bg-bg/70 p-6 text-center"
                            style={{ gridColumn: side ? 3 : 1, gridRow: `2 / span ${game.stats.length}` }}
                          >
                            {absent(list[side])}
                          </div>
                        ) : null,
                      )}
                      {game.stats.map(([k, abbr, full], i) => {
                        const line = i < game.stats.length - 1 ? "border-b border-line/60" : "";
                        return [0, 1, 2].map((col) => {
                          if (col === 1) {
                            return (
                              <div key={`${k}-mid`} className={cn("bg-surface-2/40 px-1 py-3 text-center", line)} style={{ gridColumn: 2, gridRow: i + 2 }}>
                                <div className="font-brand text-sm font-bold leading-none">{abbr}</div>
                                <div className="mt-1 truncate text-[11px] text-muted">{t(full)}</div>
                              </div>
                            );
                          }
                          const d = list[col ? 1 : 0];
                          if (!d || !statsOf(d)) return null;
                          return (
                            <div key={`${k}-${col}`} className={cn("flex items-center px-4 py-3 sm:px-5", line)} style={{ gridColumn: col + 1, gridRow: i + 2 }}>
                              <div className="w-full">{duelSide(d, k, col === 0)}</div>
                            </div>
                          );
                        });
                      })}
                    </div>
                  ) : (
                    <Board cols={cap} heads={heads}>
                      <Cols>
                        {list.map((d) => (
                          <div key={d.id} className="card p-4">
                            {statsOf(d) ? (
                              <ul className="space-y-3">
                                {game.stats.map(([k, abbr, full]) => {
                                  const s = statInfo(d, k);
                                  return (
                                    <li key={k} title={t(full)} className="grid grid-cols-[2.5rem_1fr_2.25rem] items-center gap-2">
                                      <span className="font-brand text-xs font-bold">{abbr}</span>
                                      <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                                        <span className={cn("block h-full rounded-full", s.fill)} style={{ width: `${s.pct}%` }} />
                                      </span>
                                      <span className={cn("text-right font-mono text-xs", s.lead ? "font-semibold text-fg" : "text-muted")}>{s.v ?? "—"}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 py-4 text-center">{absent(d)}</div>
                            )}
                          </div>
                        ))}
                      </Cols>
                    </Board>
                  )}
                  <p className="mt-2 text-xs text-muted">{general ? t("Barra cheia = 100, o topo entre todos os Digimon com ficha.") : t("A barra cheia equivale ao maior valor do jogo.")} {t("Fontes: Wikimon e Tamerdex.")}</p>

                  {withStats.some((d) => statsOf(d)?.strong || statsOf(d)?.weak) && (
                    <div className="mt-6">
                      <Board cols={cap} heads={heads}>
                        <Row label={t("Elementos")}>
                          {list.map((d) => {
                            const s = statsOf(d);
                            return (
                              <div key={d.id} className="space-y-1.5">
                                {s ? (
                                  <>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="w-12 text-xs text-muted">{t("Forte")}</span>
                                      {elements(s.strong).length ? elements(s.strong) : <span className="text-xs text-muted/70">—</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="w-12 text-xs text-muted">{t("Fraco")}</span>
                                      {elements(s.weak).length ? elements(s.weak) : <span className="text-xs text-muted/70">—</span>}
                                    </div>
                                  </>
                                ) : (
                                  <Missing>{t("Sem dados neste jogo")}</Missing>
                                )}
                              </div>
                            );
                          })}
                        </Row>
                      </Board>
                    </div>
                  )}
                </>
              )}
            </Section>

            {hasEvos && (
              <Section title={t("Evoluções")} description={n > 1 ? t("Evoluções compartilhadas aparecem em destaque.") : undefined}>
                <Board cols={cap} heads={heads}>
                  <Row label={t("Evolui de")}>
                    {list.map((d) => {
                      const items = prev(d).map((e) => <MonChip key={e.id} m={e.from} hit={sharedPrev.has(e.from.slug)} />);
                      return <div key={d.id} className="flex min-w-0 flex-col gap-1.5">{items.length ? <Folded items={items} more={more(items.length - PREVIEW)} less={t("Ver menos")} /> : <Missing />}</div>;
                    })}
                  </Row>
                  <Row label={t("Evolui para")}>
                    {list.map((d) => {
                      const items = next(d).map((e) => <MonChip key={e.id} m={e.to} hit={sharedNext.has(e.to.slug)} extra={e.kind !== "normal" ? <EvoKindBadge kind={e.kind} /> : null} />);
                      return <div key={d.id} className="flex min-w-0 flex-col gap-1.5">{items.length ? <Folded items={items} more={more(items.length - PREVIEW)} less={t("Ver menos")} /> : <Missing />}</div>;
                    })}
                  </Row>
                  {hasGames && (
                    <Row label={t("Diferenças entre jogos")}>
                      {list.map((d) => {
                        const g = games(d);
                        return (
                          <div key={d.id} className="min-w-0">
                            {g.length ? (
                              <details className="group/games">
                                <summary className="cursor-pointer list-none text-[13px] font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
                                  {t("Ver por jogo ({n})", { n: g.length })}
                                </summary>
                                <ul className="mt-2 space-y-2">
                                  {g.map(([game, names]) => (
                                    <li key={game} className="text-[13px] leading-snug">
                                      <span className="block font-medium">{game}</span>
                                      <span className="text-muted">{names.join(", ")}</span>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : (
                              <Missing />
                            )}
                          </div>
                        );
                      })}
                    </Row>
                  )}
                </Board>
              </Section>
            )}

            <Section title={t("Golpes")}>
              <Board cols={cap} heads={heads}>
                <Row label={t("Golpes")}>
                  {list.map((d) => {
                    const items = d.attacks.map((a, i) => (
                      <div key={a.id} className="flex gap-2.5 text-sm leading-snug">
                        <span className="w-5 shrink-0 pt-px font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0">
                          <span className="block">{a.name}</span>
                          {a.localizedName && <span className="block text-xs text-muted">{a.localizedName}</span>}
                        </span>
                      </div>
                    ));
                    return <div key={d.id} className="flex min-w-0 flex-col gap-2">{items.length ? <Folded items={items} more={more(items.length - PREVIEW)} less={t("Ver menos")} inner="flex flex-col gap-2" /> : <Missing />}</div>;
                  })}
                </Row>
                {hasAbilities && (
                  <Row label={t("Habilidades")}>
                    {list.map((d) => <div key={d.id} className="flex flex-wrap gap-1.5">{d.abilities.length ? d.abilities.map((a) => <Pill key={a.id}>{td(a.name)}</Pill>) : <Missing />}</div>)}
                  </Row>
                )}
              </Board>
            </Section>

            <Section title={t("Aparições")}>
              {sharedMediaList.length > 0 && (
                <div className="mb-6 rounded-[8px] border border-primary/40 bg-primary/5 p-4">
                  <div className="label mb-2.5">{t("Aparecem juntos em:")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sharedMediaList.map((a) => <Pill key={a.mediaId} color={a.media.color} href={`/universos/${a.media.slug}`}>{ln(a.media)}</Pill>)}
                  </div>
                </div>
              )}
              <Board cols={cap} heads={heads}>
                <Row label={n > 1 ? t("Só este aparece em") : t("Aparições")}>
                  {list.map((d) => {
                    const own = d.appearances.filter((a) => !sharedMedia.has(a.mediaId) && list.every((o) => o.id === d.id || !o.appearances.some((x) => x.mediaId === a.mediaId)));
                    const items = own.map((a) => (
                      <Pill key={a.mediaId} color={a.media.color} href={`/universos/${a.media.slug}`} className="max-w-full whitespace-normal! leading-tight">{ln(a.media)}</Pill>
                    ));
                    return (
                      <div key={d.id} className="flex min-w-0 flex-wrap content-start gap-1.5">
                        {items.length ? <Folded items={items} more={more(items.length - PREVIEW)} less={t("Ver menos")} inner="flex flex-wrap gap-1.5" /> : <Missing>{t("Nenhuma exclusiva")}</Missing>}
                      </div>
                    );
                  })}
                </Row>
              </Board>
            </Section>
          </>
        )}
      </Container>
    </div>
  );
}
