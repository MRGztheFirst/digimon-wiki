import Link from "next/link";
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
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

const POPULAR_LINES = ["agumon", "gabumon", "patamon", "tailmon", "v-mon", "guilmon", "renamon", "terriermon", "agnimon", "omegamon"];
const QUICK = ["agumon", "omegamon", "tailmon", "imperialdramon-fighter-mode", "beelzebumon"];


export default async function Home() {
  const { locale, t, td, ln, num: fmt } = await getI18n();
  const [counts, featured, popular, recent, random, stages, attributes, types, families, media, lineRoots, quick] = await Promise.all([
    Promise.all([db.digimon.count(), db.evolution.count(), db.media.count(), db.digimonType.count()]),
    db.digimon.findMany({ where: { featured: true, imageUrl: { not: null } }, select: { ...cardSelect, summary: true, romaji: true } }),
    db.digimon.findMany({ select: cardSelect, take: 6, orderBy: [{ viewCount: "desc" }, { number: "asc" }] }),
    db.digimon.findMany({ select: cardSelect, take: 6, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    randomDigimon(6),
    db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } }),
    db.attribute.findMany({ include: { _count: { select: { digimon: true } } } }),
    db.digimonType.findMany({ include: { _count: { select: { digimon: true } } }, orderBy: { digimon: { _count: "desc" } }, take: 18 }),
    db.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } }),
    db.media.findMany({ where: { kind: { in: ["anime", "game"] } }, orderBy: { year: "asc" } }),
    db.digimon.findMany({ where: { slug: { in: POPULAR_LINES } }, select: { ...cardSelect, _count: { select: { evolutionsFrom: true, evolutionsTo: true } } } }),
    db.digimon.findMany({ where: { slug: { in: QUICK } }, select: { slug: true, name: true } }),
  ]);
  const [nDigimon, nEvo, nMedia, nTypes] = counts;
  const spot = featured.length ? featured[Math.floor(Math.random() * featured.length)] : null;
  const lines = POPULAR_LINES.map((s) => lineRoots.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => !!d);
  const quickLinks = QUICK.map((s) => quick.find((q) => q.slug === s)).filter((q): q is NonNullable<typeof q> => !!q);
  const mainStages = stages.filter((s) => !s.isSpecial);
  const explore: [string, string, string][] = [
    ["/digimon", t("Enciclopédia"), `${fmt(nDigimon)} Digimon`],
    ["/linhas", t("Linhas evolutivas"), t("{n} evoluções", { n: fmt(nEvo) })],
    ["/universos", t("Digimon por Universo"), t("{n} obras", { n: fmt(nMedia) })],
    ["/estagios", t("Estágios"), t("{n} estágios", { n: stages.length })],
    ["/atributos", t("Atributos"), t("{n} atributos", { n: attributes.length })],
    ["/tipos", t("Tipos"), t("{n} tipos", { n: fmt(nTypes) })],
    ["/familias", t("Famílias"), t("{n} famílias", { n: families.length })],
    ["/grupos", t("Grupos"), t("Royal Knights e outros")],
    ["/comparar", t("Comparador"), t("Até 4 lado a lado")],
    ["/curiosidades", t("Curiosidades"), t("Fusões e variantes")],
  ];

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <Container className="grid gap-10 py-10 md:py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-14">
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
            <Link href={`/digimon/${spot.slug}`} className="group flex max-w-xl gap-5 rounded-[10px] border border-line bg-bg p-4 transition-colors hover:border-primary/60 lg:max-w-none">
              <DigimonAvatar name={spot.name} imageUrl={spot.imageUrl} color={spot.stage?.color} className="aspect-square w-36 shrink-0 sm:w-44" />
              <div className="min-w-0 self-center">
                <div className="label">{t("Digimon em destaque")}</div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight group-hover:text-primary">{spot.name}</h2>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {explore.map(([href, title, stat]) => (
              <Link key={href} href={href} className="card group px-4 py-3.5 transition-colors hover:border-primary/60">
                <span className="block font-semibold group-hover:text-primary">{title}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{stat}</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title={t("Linhas evolutivas")} description={t("Comece por um Novato e veja para onde ele pode evoluir.")} action={<SeeAll href="/linhas" />}>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-10">
            {lines.map((d) => (
              <Link key={d.id} href={`/linhas/${d.slug}`} className="group">
                <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe className="aspect-square w-full" />
                <div className="mt-2 truncate text-sm font-medium group-hover:text-primary">{d.name}</div>
                <div className="font-mono text-[10.5px] text-muted">{t("{n} conexões", { n: d._count.evolutionsFrom + d._count.evolutionsTo })}</div>
              </Link>
            ))}
          </div>
        </Section>

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

        <Section title={t("Ao acaso")} description={t("Uma seleção diferente a cada visita.")} action={<SeeAll href="/digimon/aleatorio">{t("Sortear um")}</SeeAll>}>
          <DigimonGrid items={random} />
        </Section>

        <Section title={t("Estágios evolutivos")} action={<SeeAll href="/estagios" />}>
          <div className="scrollbar-thin overflow-x-auto pb-2">
            <ol className="flex min-w-max lg:min-w-0">
              {mainStages.map((s, i) => (
                <li key={s.id} className="w-36 shrink-0 lg:w-auto lg:flex-1">
                  <Link href={`/estagios/${s.slug}`} className="group block pr-4">
                    <div className="flex items-center">
                      <span className="h-3 w-3 shrink-0 border-2 border-bg outline outline-1 outline-line" style={{ background: s.color }} />
                      {i < mainStages.length - 1 && <span className="h-px flex-1 bg-line" />}
                    </div>
                    <div className="mt-3 font-display text-[17px] font-semibold group-hover:text-primary">{ln(s)}</div>
                    <div className="font-jp text-xs text-muted">{locale === "ja" ? s.romaji : s.nameJp}</div>
                    <div className="mt-1 text-xs text-muted">{s.nameEn?.split(" /")[0]} · {s._count.digimon}</div>
                  </Link>
                </li>
              ))}
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
              {attributes.map((a) => (
                <li key={a.id}>
                  <Link href={`/atributos/${a.slug}`} className="group flex items-center gap-3 border-b border-line/70 py-2.5 text-sm">
                    <span className="flex w-6 justify-center">{a.slug === "no-data" ? <span className="h-px w-3 bg-muted" /> : <AttributeIcon slug={a.slug} name={ln(a)} size={22} />}</span>
                    <span className="flex-1 group-hover:text-primary">{ln(a)}</span>
                    <span className="font-mono text-xs text-muted">{a._count.digimon}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={t("Famílias")} action={<SeeAll href="/familias" />}>
            <ul>
              {families.map((f) => (
                <li key={f.id}>
                  <Link href={`/familias/${f.slug}`} className="group flex items-center gap-3 border-b border-line/70 py-2.5 text-sm">
                    <FamilyIcon slug={f.slug} name={ln(f)} size={22} />
                    <span className="flex-1 group-hover:text-primary">{ln(f)}</span>
                    <span className="font-mono text-xs text-muted">{f._count.digimon}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={t("Tipos")} action={<SeeAll href="/tipos" />}>
            <p className="text-[15px] leading-loose">
              {types.map((ty, i) => (
                <span key={ty.id}>
                  {i > 0 && <span className="text-line"> · </span>}
                  <Link href={`/tipos/${ty.slug}`} className="hover:text-primary">{ln(ty)}</Link>
                  <sup className="ml-0.5 font-mono text-[9px] text-muted">{ty._count.digimon}</sup>
                </span>
              ))}
            </p>
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
