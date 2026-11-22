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

export const dynamic = "force-dynamic";

const POPULAR_LINES = ["agumon", "gabumon", "patamon", "tailmon", "v-mon", "guilmon", "renamon", "terriermon", "agnimon", "omegamon"];
const QUICK = ["agumon", "omegamon", "tailmon", "imperialdramon-fighter-mode", "beelzebumon"];

const EXPLORE: [string, string, string][] = [
  ["/digimon", "Enciclopédia", "Todos os Digimon, com busca e filtros combináveis."],
  ["/linhas", "Linhas evolutivas", "Árvores interativas, filtráveis por anime, jogo e V-Pet."],
  ["/universos", "Digimon por Universo", "Como as regras mudam de uma obra para outra."],
  ["/estagios", "Estágios", "Do Digiovo ao Supremo, com nomes originais."],
  ["/atributos", "Atributos", "Vaccine, Data, Virus, Free e os demais."],
  ["/tipos", "Tipos", "Dragon Man, Holy Knight, Beast e outros."],
  ["/familias", "Famílias", "Nature Spirits, Metal Empire, Virus Busters…"],
  ["/grupos", "Grupos e lendários", "Royal Knights, Seven Great Demon Lords…"],
  ["/comparar", "Comparador", "Coloque até quatro Digimon lado a lado."],
  ["/curiosidades", "Curiosidades", "Fusões, variantes e a cronologia das obras."],
];

export default async function Home() {
  const [counts, featured, popular, recent, random, stages, attributes, types, families, media, lineRoots, quick] = await Promise.all([
    Promise.all([db.digimon.count(), db.evolution.count(), db.media.count()]),
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
  const [nDigimon, nEvo, nMedia] = counts;
  const spot = featured.length ? featured[Math.floor(Math.random() * featured.length)] : null;
  const lines = POPULAR_LINES.map((s) => lineRoots.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => !!d);
  const quickLinks = QUICK.map((s) => quick.find((q) => q.slug === s)).filter((q): q is NonNullable<typeof q> => !!q);
  const mainStages = stages.filter((s) => !s.isSpecial);

  return (
    <div>
      <section className="border-b border-line">
        <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16">
          <div>
            <div className="label mb-5">
              Enciclopédia de fã · {nDigimon} Digimon · {nEvo} conexões evolutivas · {nMedia} obras
            </div>
            <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              Cada Digimon, cada evolução, em cada obra.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              Linhas evolutivas que mostram de onde vem cada conexão — anime, jogo, V-Pet ou material oficial — sem tratar a regra de um jogo como regra de todos.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchBox />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="label">Experimente</span>
              {quickLinks.map((q, i) => (
                <span key={q.slug} className="flex items-center gap-3">
                  {i > 0 && <span className="text-line">/</span>}
                  <Link href={`/digimon/${q.slug}`} className="text-fg/80 underline decoration-line underline-offset-4 hover:text-primary hover:decoration-primary">{q.name}</Link>
                </span>
              ))}
            </div>
          </div>

          {spot && (
            <Link href={`/digimon/${spot.slug}`} className="group block max-w-md lg:max-w-none">
              <div className="label mb-3 flex justify-between">
                <span>Em destaque</span>
                <span>Nº {String(spot.number).padStart(4, "0")}</span>
              </div>
              <DigimonAvatar name={spot.name} imageUrl={spot.imageUrl} color={spot.stage?.color} stripe className="aspect-[4/3] w-full" />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-3xl font-semibold tracking-tight group-hover:text-primary">{spot.name}</h2>
                {spot.nameJp && <span className="font-jp text-muted">{spot.nameJp}</span>}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                {[spot.stage?.name, spot.attribute?.name.split(" (")[0]].filter(Boolean).join(" · ")}
              </div>
              {spot.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{spot.summary}</p>}
            </Link>
          )}
        </Container>
      </section>

      <Container className="space-y-20 py-14">
        <Section title="Explore o Mundo Digital">
          <ol className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
            {EXPLORE.map(([href, title, desc], i) => (
              <li key={href}>
                <Link href={href} className="group flex h-full gap-3 border-t border-line py-4">
                  <span className="pt-0.5 font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-display text-[17px] font-semibold leading-tight group-hover:text-primary">{title}</span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Linhas evolutivas" description="Comece por um Novato e siga todas as possibilidades." action={<SeeAll href="/linhas" />}>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-10">
            {lines.map((d) => (
              <Link key={d.id} href={`/linhas/${d.slug}`} className="group">
                <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe className="aspect-square w-full" />
                <div className="mt-2 truncate text-sm font-medium group-hover:text-primary">{d.name}</div>
                <div className="font-mono text-[10.5px] text-muted">{d._count.evolutionsFrom + d._count.evolutionsTo} conexões</div>
              </Link>
            ))}
          </div>
        </Section>

        <div className="grid gap-16 lg:grid-cols-2">
          <Section title="Mais vistos" action={<SeeAll href="/digimon?ordem=populares" />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {popular.map((d) => <DigimonCard key={d.id} d={d} />)}
            </div>
          </Section>
          <Section title="Adicionados recentemente" action={<SeeAll href="/digimon?ordem=recentes" />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {recent.map((d) => <DigimonCard key={d.id} d={d} />)}
            </div>
          </Section>
        </div>

        <Section title="Ao acaso" description="Uma seleção diferente a cada visita." action={<SeeAll href="/digimon/aleatorio">Sortear um</SeeAll>}>
          <DigimonGrid items={random} />
        </Section>

        <Section title="Estágios evolutivos" action={<SeeAll href="/estagios" />}>
          <div className="scrollbar-thin overflow-x-auto pb-2">
            <ol className="flex min-w-max lg:min-w-0">
              {mainStages.map((s, i) => (
                <li key={s.id} className="w-36 shrink-0 lg:w-auto lg:flex-1">
                  <Link href={`/estagios/${s.slug}`} className="group block pr-4">
                    <div className="flex items-center">
                      <span className="h-3 w-3 shrink-0 border-2 border-bg outline outline-1 outline-line" style={{ background: s.color }} />
                      {i < mainStages.length - 1 && <span className="h-px flex-1 bg-line" />}
                    </div>
                    <div className="mt-3 font-display text-[17px] font-semibold group-hover:text-primary">{s.name}</div>
                    <div className="font-jp text-xs text-muted">{s.nameJp}</div>
                    <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-muted">{s.nameEn?.split(" /")[0]} · {s._count.digimon}</div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 text-sm text-muted">
            Estágios especiais:{" "}
            {stages.filter((s) => s.isSpecial).map((s, i) => (
              <span key={s.id}>{i > 0 && ", "}<Link href={`/estagios/${s.slug}`} className="text-fg/80 underline decoration-line underline-offset-4 hover:text-primary">{s.name}</Link></span>
            ))}
            .
          </p>
        </Section>

        <div className="grid gap-16 lg:grid-cols-3">
          <Section title="Atributos" action={<SeeAll href="/atributos" />}>
            <ul>
              {attributes.map((a) => (
                <li key={a.id}>
                  <Link href={`/atributos/${a.slug}`} className="group flex items-center gap-3 border-b border-line/70 py-2.5 text-sm">
                    <span className="flex w-6 justify-center">{a.slug === "no-data" ? <span className="h-px w-3 bg-muted" /> : <AttributeIcon slug={a.slug} name={a.name} size={22} />}</span>
                    <span className="flex-1 group-hover:text-primary">{a.name}</span>
                    <span className="font-mono text-xs text-muted">{a._count.digimon}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Famílias" action={<SeeAll href="/familias" />}>
            <ul>
              {families.map((f) => (
                <li key={f.id}>
                  <Link href={`/familias/${f.slug}`} className="group flex items-center gap-3 border-b border-line/70 py-2.5 text-sm">
                    <FamilyIcon slug={f.slug} name={f.name} size={22} />
                    <span className="flex-1 group-hover:text-primary">{f.name}</span>
                    <span className="font-mono text-xs text-muted">{f._count.digimon}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Tipos" action={<SeeAll href="/tipos" />}>
            <p className="text-[15px] leading-loose">
              {types.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && <span className="text-line"> · </span>}
                  <Link href={`/tipos/${t.slug}`} className="hover:text-primary">{t.name}</Link>
                  <sup className="ml-0.5 font-mono text-[9px] text-muted">{t._count.digimon}</sup>
                </span>
              ))}
            </p>
          </Section>
        </div>

        <Section title="Jogos e temporadas do anime" description="Cada obra tem sua própria página, com o sistema de evolução daquele universo." action={<SeeAll href="/universos">Digimon por Universo</SeeAll>}>
          <div className="grid gap-12 lg:grid-cols-2">
            {(["anime", "game"] as const).map((k) => (
              <div key={k} className="min-w-0">
                <h3 className="label mb-2">{MEDIA_KINDS[k].plural}</h3>
                <ul>
                  {media.filter((m) => m.kind === k).map((m) => (
                    <li key={m.id}>
                      <Link href={`/universos/${m.slug}`} className="group grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-line/70 py-2.5">
                        <span className="font-mono text-xs text-muted">{yearRange(m.year, m.endYear)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] group-hover:text-primary">{m.name}</span>
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

        <section className="grid gap-6 border-t border-line pt-10 md:grid-cols-[1fr_2fr]">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Informação com origem</h2>
          <div className="space-y-3 text-[15px] leading-relaxed text-muted">
            <p>
              Toda evolução, aparição e curiosidade indica se é <span className="text-fg">oficial</span>, se vale <span className="text-fg">só em uma obra</span>, se é <span className="text-fg">da comunidade</span> ou se <span className="text-fg">ainda não foi confirmada</span>. Quando não há fonte, o campo fica em branco.
            </p>
            <p>
              Os nomes seguem as obras originais japonesas; nomes de dublagens aparecem apenas como alternativos.{" "}
              <Link href="/fontes" className="text-fg underline decoration-line underline-offset-4 hover:text-primary hover:decoration-primary">Fontes e legenda →</Link>
            </p>
          </div>
        </section>
      </Container>
    </div>
  );
}
