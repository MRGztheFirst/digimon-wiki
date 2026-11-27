import Link from "next/link";
import { Shuffle } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { randomDigimon } from "@/lib/random";
import { SearchBox } from "@/components/search-box";
import { DigimonCard, DigimonGrid } from "@/components/digimon-card";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { Container, Section, SeeAll } from "@/components/ui";
import { MEDIA_KINDS } from "@/lib/constants";
import { yearRange } from "@/lib/utils";
import { AttributeIcon, FamilyIcon } from "@/components/icons";
import { getI18n, localeFromParams } from "@/i18n/server";
import { ExploreGrid, type ExploreData } from "@/components/explore-grid";

export const revalidate = 3600;

const POPULAR_LINES = ["agumon", "gabumon", "patamon", "tailmon", "v-mon", "guilmon", "renamon", "terriermon", "agnimon", "omegamon"];
const QUICK = ["agumon", "omegamon", "tailmon", "imperialdramon-fighter-mode", "beelzebumon"];
const WALL = ["agumon", "gabumon", "tailmon", "patamon", "guilmon", "renamon", "v-mon", "omegamon", "wargreymon", "beelzebumon", "dukemon", "sakuyamon", "angewomon", "piyomon", "tentomon", "gomamon", "palmon", "terriermon", "impmon", "lucemon", "alphamon", "imperialdramon-fighter-mode", "metalgarurumon", "devimon", "agnimon", "gaomon", "shoutmon", "leomon", "seraphimon", "examon"];
const CHAIN = ["koromon", "agumon", "greymon", "metalgreymon", "wargreymon"];
const KNIGHTS = ["omegamon", "dukemon", "alphamon", "examon", "magnamon", "ulforce-v-dramon", "jesmon", "gankoomon"];
const DUEL = ["agumon", "gabumon"];
const FUSION = ["xv-mon", "stingmon", "paildramon"];
const STAIR: Record<string, string> = {
  digiovo: "digitama", "em-treinamento-1": "botamon", "em-treinamento-2": "koromon", novato: "agumon",
  campeao: "greymon", perfeito: "metalgreymon", mega: "wargreymon",
};
const SHOWCASE = [...new Set([...WALL, ...CHAIN, ...KNIGHTS, ...DUEL, ...FUSION, ...Object.values(STAIR)])];

function splitName(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*\((.*)\)$/);
  return m ? [m[1], m[2]] : [name, null];
}

function TaxonRow({ href, color, share, count, icon, title, sub }: {
  href: string; color: string; share: number; count: string; icon: React.ReactNode; title: string; sub?: string | null;
}) {
  return (
    <Link href={href} style={{ "--tint": `color-mix(in oklab, ${color} 10%, transparent)` } as React.CSSProperties}
      className="group flex items-center gap-3 border-b border-line/70 px-1.5 py-2 transition-colors hover:bg-(--tint)">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{ background: `color-mix(in oklab, ${color} 18%, var(--surface))` }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-medium group-hover:text-primary">{title}</span>
        {sub && <span className="block truncate text-[11px] text-muted">{sub}</span>}
      </span>
      <span className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span className="grow-x block h-full rounded-full" style={{ width: `${Math.max(4, share * 100)}%`, background: color }} />
      </span>
      <span className="w-9 text-right font-mono text-xs tabular-nums text-muted">{count}</span>
    </Link>
  );
}


export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  const { locale, t, td, ln, num: fmt } = await getI18n();
  const [counts, featured, popular, recent, random, stages, attributes, types, families, media, lineRoots, quick, showcase, newest] = await Promise.all([
    Promise.all([db.digimon.count(), db.evolution.count(), db.media.count(), db.digimonType.count()]),
    db.digimon.findMany({ where: { featured: true, imageUrl: { not: null } }, select: { ...cardSelect, summary: true, romaji: true } }),
    db.digimon.findMany({ select: cardSelect, take: 6, orderBy: [{ viewCount: "desc" }, { number: "asc" }] }),
    db.digimon.findMany({ select: cardSelect, take: 6, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    randomDigimon(6),
    db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } }),
    db.attribute.findMany({ include: { _count: { select: { digimon: true } } } }),
    db.digimonType.findMany({ include: { _count: { select: { digimon: true } } }, orderBy: { digimon: { _count: "desc" } }, take: 18 }),
    db.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } }),
    db.media.findMany({ where: { kind: { in: ["anime", "game"] }, imported: false }, orderBy: { year: "asc" } }),
    db.digimon.findMany({ where: { slug: { in: POPULAR_LINES } }, select: { ...cardSelect, _count: { select: { evolutionsFrom: true, evolutionsTo: true } } } }),
    db.digimon.findMany({ where: { slug: { in: QUICK } }, select: { slug: true, name: true } }),
    db.digimon.findMany({ where: { slug: { in: SHOWCASE }, imageUrl: { not: null } }, select: { slug: true, name: true, imageUrl: true, stage: { select: { name: true, color: true } } } }),
    db.digimon.findMany({ where: { drbYear: { not: null } }, select: cardSelect, take: 12, orderBy: [{ drbYear: "desc" }, { viewCount: "desc" }, { number: "asc" }] }),
  ]);
  const [nDigimon, nEvo, nMedia, nTypes] = counts;
  const spot = featured.length ? featured[Math.floor(Math.random() * featured.length)] : null;
  const lines = POPULAR_LINES.map((s) => lineRoots.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => !!d);
  const quickLinks = QUICK.map((s) => quick.find((q) => q.slug === s)).filter((q): q is NonNullable<typeof q> => !!q);
  const mainStages = stages.filter((s) => !s.isSpecial);
  const maxAttr = Math.max(1, ...attributes.map((a) => a._count.digimon));
  const maxFamily = Math.max(1, ...families.map((f) => f._count.digimon));
  const maxType = Math.max(1, ...types.map((ty) => ty._count.digimon));
  const pick = (slug: string) => showcase.find((m) => m.slug === slug);
  const picks = (slugs: string[]) => slugs.map(pick).filter((m): m is NonNullable<typeof m> => !!m);
  const explore: ExploreData = {
    encyclopedia: { href: "/digimon", title: t("Enciclopédia"), stat: `${fmt(nDigimon)} Digimon` },
    lines: { href: "/linhas", title: t("Linhas evolutivas"), stat: t("{n} evoluções", { n: fmt(nEvo) }) },
    universes: { href: "/universos", title: t("Digimon por Universo"), stat: t("{n} obras", { n: fmt(nMedia) }) },
    stages: { href: "/estagios", title: t("Estágios"), stat: t("{n} estágios", { n: stages.length }) },
    attributes: { href: "/atributos", title: t("Atributos"), stat: t("{n} atributos", { n: attributes.length }) },
    types: { href: "/tipos", title: t("Tipos"), stat: t("{n} tipos", { n: fmt(nTypes) }) },
    families: { href: "/familias", title: t("Famílias"), stat: t("{n} famílias", { n: families.length }) },
    groups: { href: "/grupos", title: t("Grupos"), stat: t("Royal Knights e outros") },
    compare: { href: "/comparar", title: t("Comparador"), stat: t("Até 4 lado a lado") },
    trivia: { href: "/curiosidades", title: t("Curiosidades"), stat: t("Fusões e variantes") },
    wall: picks(WALL),
    chain: picks(CHAIN).map((m) => ({ ...m, stage: m.stage && { ...m.stage, name: t(m.stage.name) } })),
    knights: picks(KNIGHTS),
    duel: [pick(DUEL[0]), pick(DUEL[1])],
    fusion: [pick(FUSION[0]), pick(FUSION[1]), pick(FUSION[2])],
    stageBars: mainStages.map((s) => ({ slug: s.slug, name: ln(s), color: s.color })),
    attributeIcons: attributes.filter((a) => a.slug !== "no-data").map((a) => ({ slug: a.slug, name: ln(a) })),
    familyIcons: families.map((f) => ({ slug: f.slug, name: ln(f) })),
    typeNames: types.map((ty) => ln(ty)),
    mediaStrips: media.filter((m) => m.kind === "anime").map((m) => ({ slug: m.slug, name: ln(m), year: m.year, color: m.color })),
  };

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <Container className="grid grid-cols-1 gap-10 py-10 md:py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-14">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Digimon Database</h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted">
              {t("A enciclopédia de Digimon em português: {n} Digimon com estágio, atributo, golpes, perfil oficial e todas as linhas evolutivas.", { n: fmt(nDigimon) })}
            </p>
            <div className="mt-6 max-w-xl">
              <SearchBox />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-muted">{t("Populares:")}</span>
              {quickLinks.map((q, i) => (
                <span key={q.slug}>
                  <Link href={`/digimon/${q.slug}`} className="text-accent hover:underline">{q.name}</Link>
                  {i < quickLinks.length - 1 && <span className="text-muted">,</span>}
                </span>
              ))}
            </div>
          </div>

          {spot && (
            <Link href={`/digimon/${spot.slug}`} className="group flex max-w-xl gap-4 rounded-[10px] border border-line bg-bg p-4 transition-colors hover:border-primary/60 sm:gap-5 lg:max-w-none">
              <DigimonAvatar name={spot.name} imageUrl={spot.imageUrl} color={spot.stage?.color} sizes="176px" priority className="aspect-square w-28 shrink-0 min-[360px]:w-36 sm:w-44" />
              <div className="min-w-0 self-center">
                <div className="label">{t("Digimon em destaque")}</div>
                <h2 className="mt-1 break-words text-2xl font-bold tracking-tight group-hover:text-primary">{spot.name}</h2>
                {spot.nameJp && <div className="font-jp text-sm text-muted">{spot.nameJp}</div>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {spot.stage && <span className="rounded-[5px] bg-surface-2 px-2 py-0.5 text-xs font-medium">{t(spot.stage.name)}</span>}
                  {spot.attribute && (
                    <span className="flex items-center gap-1 rounded-[5px] bg-surface-2 px-2 py-0.5 text-xs font-medium">
                      <AttributeIcon slug={spot.attribute.slug} name={t(spot.attribute.name).split(" (")[0]} size={13} />
                      {t(spot.attribute.name).split(" (")[0]}
                    </span>
                  )}
                </div>
                {spot.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{td(spot.summary)}</p>}
              </div>
            </Link>
          )}
        </Container>
      </section>

      <Container className="space-y-16 py-12">
        <Section title={t("Explore o Mundo Digital")}>
          <ExploreGrid d={explore} />
        </Section>

        <Section title={t("Linhas evolutivas")} description={t("Comece por um Novato e veja para onde ele pode evoluir.")} action={<SeeAll href="/linhas" />}>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-10">
            {lines.map((d) => (
              <Link key={d.id} href={`/linhas/${d.slug}`} className="group">
                <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe sizes="(min-width: 640px) 120px, 33vw" className="aspect-square w-full" />
                <div className="mt-2 truncate text-sm font-medium group-hover:text-primary">{d.name}</div>
                <div className="font-mono text-[10.5px] text-muted">{t("{n} conexões", { n: d._count.evolutionsFrom + d._count.evolutionsTo })}</div>
              </Link>
            ))}
          </div>
        </Section>

        {newest.length > 0 && (
          <Section title={t("Novos no Reference Book")} description={t("Os últimos Digimon que entraram no catálogo oficial. Muitos ainda só aparecem no card game.")} action={<SeeAll href="/anos">{t("Ver por ano")}</SeeAll>}>
            <DigimonGrid items={newest} />
          </Section>
        )}

        <div className="grid gap-16 lg:grid-cols-2">
          <Section title={t("Mais vistos")} action={<SeeAll href="/digimon?ordem=populares" />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {popular.map((d) => <DigimonCard key={d.id} d={d} />)}
            </div>
          </Section>
          <Section title={t("Adicionados recentemente")} action={<SeeAll href="/digimon?ordem=recentes" />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {recent.map((d) => <DigimonCard key={d.id} d={d} />)}
            </div>
          </Section>
        </div>

        <Section title={t("Ao acaso")} description={t("Uma seleção diferente a cada visita.")} action={<SeeAll href="/digimon/aleatorio" icon={<Shuffle size={14} />}>{t("Sortear um")}</SeeAll>}>
          <DigimonGrid items={random} />
        </Section>

        <Section title={t("Estágios evolutivos")} action={<SeeAll href="/estagios" />}>
          <div className="scroll-slim -mx-4 -mt-3 overflow-x-auto px-4 pb-2 pt-3 md:mx-0 md:px-0">
            <ol className="grid min-w-[46rem] items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${mainStages.length}, minmax(0, 1fr))` }}>
              {mainStages.map((s, i) => {
                const face = pick(STAIR[s.slug] ?? "");
                return (
                  <li key={s.id} className="h-full">
                    <Link href={`/estagios/${s.slug}`} className="group flex h-full flex-col justify-end">
                      {face ? (
                        <span className="pop-in mx-auto mb-2 block w-[72%] transition-transform duration-300 group-hover:-translate-y-1.5" style={{ animationDelay: `${300 + i * 90}ms` }}>
                          <DigimonAvatar name={face.name} imageUrl={face.imageUrl} sizes="96px" className="aspect-square w-full rounded-full! ring-2 ring-surface" />
                        </span>
                      ) : (
                        <span className="pop-in mx-auto mb-2 flex aspect-square w-[72%] items-center justify-center rounded-full border-2 border-dashed font-display text-xl font-semibold text-muted"
                          style={{ borderColor: s.color, animationDelay: `${300 + i * 90}ms` }}>?</span>
                      )}
                      <span className="grow-y relative block rounded-t-[8px] border-t-[3px] px-2.5 pt-2 transition-[filter] duration-200 group-hover:brightness-125"
                        style={{
                          height: `${3 + i * 1.15}rem`,
                          borderColor: s.color,
                          background: `linear-gradient(to bottom, color-mix(in oklab, ${s.color} 34%, var(--surface)), color-mix(in oklab, ${s.color} 8%, var(--surface)))`,
                          animationDelay: `${i * 90}ms`,
                        }}>
                        <span className="font-mono text-sm font-semibold tabular-nums">{fmt(s._count.digimon)}</span>
                      </span>
                      <span className="mt-2.5 block min-h-10 font-display text-sm font-semibold leading-tight group-hover:text-primary">{ln(s)}</span>
                      <span className="block truncate text-[11px] text-muted">{locale === "ja" ? s.romaji : s.nameJp} · {s.nameEn?.split(" /")[0]}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="mt-4 text-sm text-muted">
            {t("Estágios especiais:")}{" "}
            {stages.filter((s) => s.isSpecial).map((s, i) => (
              <span key={s.id}>{i > 0 && ", "}<Link href={`/estagios/${s.slug}`} className="text-fg/80 underline decoration-line underline-offset-4 hover:text-primary">{ln(s)}</Link></span>
            ))}
            .
          </p>
        </Section>

        <div className="grid gap-16 lg:grid-cols-3">
          <Section title={t("Atributos")} action={<SeeAll href="/atributos" />}>
            <ul>
              {attributes.map((a, i) => {
                const [main, sub] = splitName(ln(a));
                return (
                  <li key={a.id} className="rise-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <TaxonRow href={`/atributos/${a.slug}`} color={a.color} share={a._count.digimon / maxAttr} count={fmt(a._count.digimon)}
                      icon={a.slug === "no-data" ? <span className="h-0.5 w-3 rounded-full bg-muted" /> : <AttributeIcon slug={a.slug} name={main} size={22} />}
                      title={main} sub={sub} />
                  </li>
                );
              })}
            </ul>
          </Section>
          <Section title={t("Famílias")} action={<SeeAll href="/familias" />}>
            <ul>
              {families.map((f, i) => (
                <li key={f.id} className="rise-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <TaxonRow href={`/familias/${f.slug}`} color={f.color} share={f._count.digimon / maxFamily} count={fmt(f._count.digimon)}
                    icon={<FamilyIcon slug={f.slug} name={ln(f)} size={24} className="rounded-[3px]" />} title={ln(f)} sub={f.abbr} />
                </li>
              ))}
            </ul>
          </Section>
          <Section title={t("Tipos")} action={<SeeAll href="/tipos" />}>
            <ul className="flex flex-wrap gap-2">
              {types.map((ty, i) => {
                const heat = ty._count.digimon / maxType;
                return (
                  <li key={ty.id} className="rise-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <Link href={`/tipos/${ty.slug}`} title={t("{n} Digimon", { n: fmt(ty._count.digimon) })}
                      className="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary"
                      style={{ borderColor: `color-mix(in oklab, var(--primary) ${Math.round(15 + heat * 45)}%, var(--line))`, background: `color-mix(in oklab, var(--primary) ${Math.round(4 + heat * 16)}%, var(--surface))` }}>
                      <span className="leading-none group-hover:text-primary">{ln(ty)}</span>
                      <span className="flex h-[18px] min-w-[22px] items-center justify-center rounded-full bg-surface/70 px-1.5 font-mono text-[10px] leading-none tabular-nums text-muted">{ty._count.digimon}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/tipos" className="mt-5 inline-block text-sm font-medium text-accent hover:underline">{t("Ver todos os {n} tipos", { n: fmt(nTypes) })} →</Link>
          </Section>
        </div>

        <Section title={t("Jogos e temporadas do anime")} description={t("Cada obra tem sua própria página, com o sistema de evolução daquele universo.")} action={<SeeAll href="/universos">{t("Digimon por Universo")}</SeeAll>}>
          <div className="grid gap-12 lg:grid-cols-2">
            {(["anime", "game"] as const).map((k) => (
              <div key={k} className="min-w-0">
                <h3 className="label mb-2">{t(MEDIA_KINDS[k].plural)}</h3>
                <ul>
                  {media.filter((m) => m.kind === k).map((m) => (
                    <li key={m.id}>
                      <Link href={`/universos/${m.slug}`} className="group grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-line/70 py-2.5">
                        <span className="font-mono text-xs text-muted">{yearRange(m.year, m.endYear)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] group-hover:text-primary">{ln(m)}</span>
                          {m.platform && <span className="block truncate text-xs text-muted">{m.platform}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

      </Container>
    </div>
  );
}
