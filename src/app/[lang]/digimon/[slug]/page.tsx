import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, ArrowRight, BookMarked, ChevronDown, ChevronUp, GitBranch, Info, Pencil, Scale, Sparkles, Swords, Tv } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { ImageZoom } from "@/components/image-zoom";
import { AttributeBadge, EvoKindBadge, FamilyBadge, Pill, ReviewBadge, StageBadge, StatusBadge } from "@/components/badges";
import { DigimonCard, DigimonChip, EmptyState } from "@/components/digimon-card";
import { Breadcrumbs, Container, Field, Missing, Section } from "@/components/ui";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, REVIEW_STATUSES, mediaKindOf, reviewOf } from "@/lib/constants";
import { padNumber, paragraphs } from "@/lib/utils";
import { STAT_GAMES } from "@/lib/game-stats";
import { DigimonStats } from "@/components/digimon-stats";
import { editorEnabled } from "@/lib/editor";
import { getI18n, localeFromParams } from "@/i18n/server";

const PLAIN_PREVIEW = 12;
const ctxInclude ={ include: { media: { select: { slug: true, name: true, nameJp: true, kind: true } } } } as const;

async function load(slug: string) {
  return db.digimon.findUnique({
    where: { slug },
    include: {
      stage: true,
      attribute: true,
      types: { include: { type: true } },
      families: { include: { family: true, source: true } },
      groups: { include: { group: true } },
      attacks: { include: { source: true }, orderBy: { order: "asc" } },
      abilities: { include: { source: true } },
      trivia: { include: { source: true } },
      appearances: { include: { media: true, source: true }, orderBy: { media: { year: "asc" } } },
      evolutionsFrom: { include: { to: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } }, contexts: ctxInclude } },
      evolutionsTo: { include: { from: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } }, contexts: ctxInclude } },
      partnerIn: {
        include: {
          evolution: { include: { to: { select: cardSelect }, from: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } }, contexts: ctxInclude } },
        },
      },
      base: { select: cardSelect },
      variants: { select: { ...cardSelect, variantKind: true } },
      citations: { include: { source: true } },
      gameStats: true,
    },
  });
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await localeFromParams(params);
  const { t, td } = await getI18n();
  const d = await db.digimon.findUnique({ where: { slug }, select: { name: true, summary: true, nameJp: true } });
  if (!d) return { title: t("Digimon não encontrado") };
  return { title: d.name, description: td(d.summary) ?? t("{name} ({jp}) na Digimon Database.", { name: d.name, jp: d.nameJp ?? "" }) };
}

function splitCamel(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s-]+/);
}

export default async function DigimonPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { slug } = await params;
  await localeFromParams(params);
  const { locale, t, td, ln } = await getI18n();
  const d = await load(slug);
  if (!d) notFound();
  if (!process.env.VERCEL) db.$executeRaw`UPDATE "Digimon" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${d.id}`.catch(() => {});

  type EvoItem = {
    id: number; kind: string; status: string; notes: string | null; requirements: string | null; imported: boolean;
    others: (typeof d.evolutionsFrom)[number]["to"][];
    target: (typeof d.evolutionsFrom)[number]["to"];
    contexts: { media: { slug: string; name: string; nameJp: string | null; kind: string }; requirements: string | null; status: string }[];
  };
  const next: EvoItem[] = [
    ...d.evolutionsFrom.map((e) => ({ ...e, target: e.to, others: e.partners.map((p) => p.digimon) })),
    ...d.partnerIn.map(({ evolution: e }) => ({ ...e, target: e.to, others: [e.from, ...e.partners.map((p) => p.digimon).filter((p) => p.id !== d.id)] })),
  ];
  const prev: EvoItem[] = d.evolutionsTo.map((e) => ({ ...e, target: e.from, others: e.partners.map((p) => p.digimon) }));

  const familyIds = d.families.map((f) => f.familyId);
  const typeIds = d.types.map((t) => t.typeId);
  const groupIds = d.groups.map((g) => g.groupId);
  const evoIds = new Set([...next.map((e) => e.target.id), ...prev.map((e) => e.target.id)]);
  const root = splitCamel(d.name).filter((w) => w.length > 4).pop();
  const hasStats = d.gameStats.some((s) => STAT_GAMES.some((g) => g.key === s.game));
  const [related, similar, allStats] = await Promise.all([
    db.digimon.findMany({
      where: {
        id: { notIn: [d.id, ...evoIds] },
        OR: [
          groupIds.length ? { groups: { some: { groupId: { in: groupIds } } } } : {},
          typeIds.length ? { types: { some: { typeId: { in: typeIds } } } } : {},
          familyIds.length ? { families: { some: { familyId: { in: familyIds } } }, stageId: d.stageId } : {},
        ].filter((x) => Object.keys(x).length),
      },
      select: cardSelect,
      take: 6,
    }).then((r) => (groupIds.length || typeIds.length || familyIds.length ? r : [])),
    root ? db.digimon.findMany({ where: { name: { contains: root }, id: { not: d.id } }, select: cardSelect, take: 8 }) : Promise.resolve([]),
    hasStats ? db.gameStats.findMany({ select: { game: true, hp: true, mp: true, atk: true, def: true, spi: true, spd: true, apt: true } }) : Promise.resolve([]),
  ]);

  const appearancesByKind = MEDIA_KIND_KEYS.map((k) => [k, d.appearances.filter((a) => mediaKindOf(a.media.kind) === k)] as const);

  const hasChar = !!(d.physical || d.personality || d.combat);
  const hasAttacks = d.attacks.length > 0 || d.abilities.length > 0;
  const hasApp = d.appearances.length > 0;
  const hasTrivia = d.trivia.length > 0;
  const hasRelated = related.length > 0 || similar.length > 0;
  const toc = ([
    ["visao-geral", t("Visão geral"), true], ["classificacao", t("Classificação"), true], ["caracteristicas", t("Características"), hasChar],
    ["golpes", t("Golpes e habilidades"), hasAttacks], ["status", t("Status base"), hasStats], ["evolucoes", t("Evoluções"), true], ["aparicoes", t("Aparições"), hasApp],
    ["curiosidades", t("Curiosidades"), hasTrivia], ["relacionados", t("Relacionados"), hasRelated],
  ] as const).filter(([, , show]) => show);

  const profiles = ([["ja", d.profileJp], ["en", d.profileEn]] as const)
    .filter((p): p is readonly ["ja" | "en", string] => !!p[1])
    .map(([lang, text]) => ({ lang, text }));
  const profile = profiles.find((p) => p.lang === locale) ?? profiles.find((p) => p.lang === "en") ?? profiles[0];
  const otherProfiles = profiles.filter((p) => p !== profile);
  const summary = td(d.summary);

  return (
    <div>
      <div className="border-b border-line">
        <Container className="pb-10 pt-8">
          <Breadcrumbs items={[["/digimon", t("Enciclopédia")], [null, d.name]]} />
          <div className="grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-end">
            <div>
              <ImageZoom src={d.imageUrl} alt={d.name}><DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe sizes="352px" priority className="aspect-square w-full max-w-[22rem]" /></ImageZoom>
            </div>
            <div className="min-w-0">
              <div className="label">{t("Nº")} {padNumber(d.number).slice(1)}{d.stage ? ` · ${ln(d.stage)}` : ""}</div>
              <h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight md:text-6xl">{d.name}</h1>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {d.nameJp && <span className="font-jp text-xl">{d.nameJp}</span>}
                {d.romaji && <span className="font-mono text-sm text-muted">{d.romaji}</span>}
              </div>
              {d.otherNames && <div className="mt-2 text-sm text-muted">{t("Em localizações:")} {td(d.otherNames)}</div>}
              <div className="mt-5 flex flex-wrap gap-1.5">
                <StageBadge stage={d.stage} />
                <AttributeBadge attribute={d.attribute} />
                {d.types.map((ty) => <Pill key={ty.typeId} color="var(--muted)" href={`/tipos/${ty.type.slug}`}>{ln(ty.type)}</Pill>)}
                {d.base && <Pill color="var(--primary)" href={`/digimon/${d.base.slug}`}>{t("{kind} de {name}", { kind: td(d.variantKind) ?? t("Variante"), name: d.base.name })}</Pill>}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/linhas/${d.slug}`} className="btn btn-primary"><GitBranch size={15} /> {t("Linha evolutiva")}</Link>
                <Link href={`/comparar?d=${d.slug}`} className="btn btn-ghost"><Scale size={15} /> {t("Comparar")}</Link>
                <Link href={`/universos/comparar?digimon=${d.slug}`} className="btn btn-ghost"><Tv size={15} /> {t("Entre jogos")}</Link>
                {editorEnabled() && <Link href={`/admin/digimon/${d.id}`} className="btn btn-ghost" title={t("Editar (somente no seu computador)")}><Pencil size={15} /> {t("Editar")}</Link>}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm" aria-label={t("Nesta página")}>
            <div className="label mb-3">{t("Nesta página")}</div>
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block border-l border-line py-1 pl-3 text-muted hover:border-primary hover:text-fg">{label}</a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          <Section id="visao-geral" title={t("Visão geral")} icon={<Info size={18} />}>
            <div className="card p-5">
              <div className="prose-wiki">
                {summary ? paragraphs(summary).map((p, i) => <p key={i}>{p}</p>) : !profile && <Missing>{t("Descrição ainda não cadastrada.")}</Missing>}
              </div>
              {profile && (
                <figure className={summary ? "mt-5 border-t border-line pt-5" : ""}>
                  <figcaption className="label mb-3">
                    {profile.lang === locale ? t("Perfil oficial") : profile.lang === "en" ? t("Perfil oficial (em inglês)") : t("Perfil oficial (em japonês)")}
                  </figcaption>
                  <blockquote lang={profile.lang} className={profile.lang === "ja" ? "font-jp text-[15px] leading-8" : "text-[15px] leading-7"}>{profile.text}</blockquote>
                  {otherProfiles.map((p) => (
                    <details key={p.lang} className="mt-4 text-sm">
                      <summary className="cursor-pointer text-muted hover:text-fg">{p.lang === "ja" ? t("Ver o perfil original em japonês") : t("Ver o perfil em inglês")}</summary>
                      <blockquote lang={p.lang} className={`mt-2 text-muted ${p.lang === "ja" ? "font-jp text-[15px] leading-8" : "text-[15px] leading-7"}`}>{p.text}</blockquote>
                    </details>
                  ))}
                </figure>
              )}
              <dl className="mt-4">
                <Field label={t("Nome oficial")}>{d.name}</Field>
                <Field label={t("Nome japonês")}>{d.nameJp}</Field>
                <Field label={t("Pronúncia")}>{d.pronunciation}</Field>
                <Field label={t("Nº na wiki")}>{padNumber(d.number)}</Field>
                <Field label={t("Significado do nome")}>{td(d.nameMeaning)}</Field>
                <Field label={t("Origem do design")}>{td(d.designOrigin)}</Field>
                <Field label={t("Primeira aparição")}>{d.firstAppearance && `${td(d.firstAppearance)}${d.firstYear ? ` (${d.firstYear})` : ""}`}</Field>
              </dl>
            </div>
          </Section>

          <Section id="classificacao" title={t("Classificação")} icon={<BookMarked size={18} />}>
            <dl className="card px-5 py-2">
              <Field label={t("Estágio")}>
                {d.stage && (
                  <span className="flex flex-wrap items-center gap-2">
                    <StageBadge stage={d.stage} />
                    <span className="text-muted">{[d.stage.nameEn, d.stage.nameJp, d.stage.romaji].filter(Boolean).join(" · ")}</span>
                  </span>
                )}
              </Field>
              <Field label={t("Tipo")}>{d.types.length > 0 && d.types.map((ty) => <Link key={ty.typeId} className="mr-3 text-accent hover:underline" href={`/tipos/${ty.type.slug}`}>{ln(ty.type)}</Link>)}</Field>
              <Field label={t("Atributo")}>{d.attribute && <AttributeBadge attribute={d.attribute} />}</Field>
              <Field label={t("Família")}>
                {d.families.length > 0 && (
                  <span className="flex flex-wrap gap-2">
                    {d.families.map((f) => (
                      <span key={f.familyId} className="inline-flex items-center gap-1.5">
                        <FamilyBadge family={f.family} />
                      </span>
                    ))}
                  </span>
                )}
              </Field>
              <Field label={t("Grupo / organização")}>
                {d.groups.length > 0 && d.groups.map((g) => (
                  <span key={g.groupId} className="mr-3">
                    <Link href={`/grupos/${g.group.slug}`} className="text-accent hover:underline">{ln(g.group)}</Link>
                    {g.role && <span className="text-muted"> — {td(g.role)}</span>}
                  </span>
                ))}
              </Field>
              <Field label={t("Nível de poder")}>{td(d.powerLevel)}</Field>
            </dl>
          </Section>

          {hasChar && <Section id="caracteristicas" title={t("Características")} icon={<Sparkles size={18} />}>
            <dl className="card px-5 py-2">
              <Field label={t("Descrição física")}>{td(d.physical)}</Field>
              <Field label={t("Personalidade")}>{td(d.personality)}</Field>
              <Field label={t("Combate")}>{td(d.combat)}</Field>
            </dl>
          </Section>}

          {hasAttacks && <Section id="golpes" title={t("Golpes e habilidades")} icon={<Swords size={18} />}>
            <div className={d.attacks.length && d.abilities.length ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
              {d.attacks.length > 0 && <div className="card p-5">
                <h3 className="mb-3 font-semibold">{t("Golpes e ataques")}</h3>
                {d.attacks.length ? (
                  <ul className="space-y-3">
                    {d.attacks.map((a) => (
                      <li key={a.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{a.name}</span>
                          {a.localizedName && <span className="text-xs text-muted">{t("Localizado:")} {a.localizedName}</span>}
                        </div>
                        {a.description && <p className="text-sm text-muted">{td(a.description)}</p>}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>}
              {d.abilities.length > 0 && <div className="card p-5">
                <h3 className="mb-3 font-semibold">{t("Habilidades especiais")}</h3>
                {d.abilities.length ? (
                  <ul className="space-y-3">
                    {d.abilities.map((a) => (
                      <li key={a.id}>
                        <span className="font-semibold">{td(a.name)}</span>
                        {a.description && <p className="text-sm text-muted">{td(a.description)}</p>}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>}
            </div>
          </Section>}

          {hasStats && <Section
            id="status"
            title={t("Status base")}
            description={t("Números do nível inicial em cada jogo. Cada jogo tem a sua escala, então compare só dentro do mesmo jogo.")}
            action={<Link href={`/comparar?d=${d.slug}#status`} className="shrink-0 text-sm font-medium text-accent hover:underline">{t("Comparar status")} →</Link>}
          >
            <DigimonStats own={d.gameStats} all={allStats} />
          </Section>}

          <Section id="evolucoes" title={t("Evoluções")} icon={<GitBranch size={18} />} action={<Link href={`/linhas/${d.slug}`} className="text-sm font-medium text-accent hover:underline">{t("Árvore completa")} →</Link>}
>
            <div className="space-y-4">
              <EvoColumn title={t("Evolui a partir de")} icon={<ArrowLeft size={16} />} items={prev} self={d.name} direction="prev" />
              <EvoColumn title={t("Pode evoluir para")} icon={<ArrowRight size={16} />} items={next} self={d.name} direction="next" />
            </div>
            {(d.variants.length > 0 || d.base) && (
              <div className="card mt-4 p-5">
                <h3 className="mb-3 font-semibold">{t("Formas alternativas e variantes")}</h3>
                <div className="flex flex-wrap gap-2">
                  {d.base && <DigimonChip d={d.base} suffix={<span className="text-xs text-muted">{t("forma base")}</span>} />}
                  {d.variants.map((v) => <DigimonChip key={v.id} d={v} suffix={v.variantKind && <span className="text-xs text-muted">{td(v.variantKind)}</span>} />)}
                </div>
              </div>
            )}
          </Section>

          {hasApp && <Section id="aparicoes" title={t("Aparições")} icon={<Tv size={18} />}>
            <div className="grid gap-4 md:grid-cols-2">
              {appearancesByKind.filter(([, list]) => list.length > 0).map(([k, list]) => (
                <div key={k} className="card p-5">
                  <h3 className="mb-3 flex items-center justify-between font-semibold">
                    {t(MEDIA_KINDS[k].plural)}
                    <span className="text-xs font-normal text-muted">{list.length}</span>
                  </h3>
                  {list.length ? (
                    <ul className="space-y-2.5">
                      {list.map((a) => (
                        <li key={a.id} className="text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/universos/${a.media.slug}`} className="font-semibold hover:text-primary">{ln(a.media)}</Link>
                            {a.media.year && <span className="text-xs text-muted">{a.media.year}</span>}
                          </div>
                          {(a.role || a.form) && <div className="text-muted">{[td(a.role), a.form && t("Forma: {form}", { form: td(a.form) })].filter(Boolean).join(" · ")}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : <Missing>{t("Nenhuma aparição cadastrada.")}</Missing>}
                </div>
              ))}
            </div>
          </Section>}

          {hasTrivia && <Section id="curiosidades" title={t("Curiosidades")} icon={<Sparkles size={18} />}>
            {d.trivia.length ? (
              <ul className="space-y-2">
                {d.trivia.map((tr) => (
                  <li key={tr.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm">{td(tr.text)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>}

          {hasRelated && <Section id="relacionados" title={t("Relacionados")} icon={<Sparkles size={18} />}>
            <div className="space-y-6">
              {related.length > 0 && <div>
                <h3 className="mb-3 text-sm font-semibold text-muted">{t("Digimon relacionados (mesmo grupo, tipo ou família)")}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{related.map((r) => <DigimonCard key={r.id} d={r} />)}</div>
              </div>}
              {similar.length > 0 && <div>
                <h3 className="mb-3 text-sm font-semibold text-muted">{t("Nomes semelhantes")}</h3>
                <div className="flex flex-wrap gap-2">{similar.map((r) => <DigimonChip key={r.id} d={r} size="sm" />)}</div>
              </div>}
            </div>
          </Section>}

        </div>
      </Container>
    </div>
  );
}

async function EvoColumn({ title, icon, items, self, direction }: {
  title: string; icon: React.ReactNode; self: string; direction: "prev" | "next";
  items: { id: number; kind: string; status: string; notes: string | null; requirements: string | null; imported: boolean; target: Parameters<typeof DigimonChip>[0]["d"] & { id: number }; others: (Parameters<typeof DigimonChip>[0]["d"] & { id: number })[]; contexts: { media: { slug: string; name: string; nameJp: string | null; kind: string }; requirements: string | null; status: string }[] }[];
}) {
  const { t, td, ln } = await getI18n();
  const curated = items.filter((e) => !e.imported);
  const listed = items.filter((e) => e.imported);
  const plain = listed.filter((e) => e.kind === "normal" && !e.requirements);
  const annotated = listed.filter((e) => e.kind !== "normal" || e.requirements);
  const toggle = "cursor-pointer rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-primary/60 hover:text-primary peer-focus-visible:border-primary peer-focus-visible:text-primary";
  const expand = "mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border border-dashed border-line py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/60 hover:text-primary peer-focus-visible:border-primary peer-focus-visible:text-primary";
  return (
    <div className="card flex flex-col p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="text-primary">{icon}</span>{title}
        {items.length > 0 && <span className="ml-auto font-mono text-xs font-normal text-muted">{items.length}</span>}
      </h3>
      {items.length === 0 && <Missing>{t("Nenhuma evolução cadastrada.")}</Missing>}
      {listed.length > 0 && (
        <div className={curated.length ? "order-last mt-4 border-t border-line pt-4" : ""}>
          {plain.length > 0 && (
            <div className="group">
              {plain.length > PLAIN_PREVIEW + 2 && <input type="checkbox" id={`${direction}-plain`} className="peer sr-only" />}
              <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {plain.map((e, i) => (
                  <li key={`${e.id}-${e.target.id}`} className={plain.length > PLAIN_PREVIEW + 2 && i >= PLAIN_PREVIEW ? "hidden min-w-0 group-has-checked:block" : "min-w-0"}>
                    <DigimonChip d={e.target} size="sm" className="w-full" />
                  </li>
                ))}
              </ul>
              {plain.length > PLAIN_PREVIEW + 2 && (
                <>
                  <label htmlFor={`${direction}-plain`} className={`${expand} group-has-checked:hidden`}>{t("Ver mais {n}", { n: plain.length - PLAIN_PREVIEW })}<ChevronDown size={14} aria-hidden="true" /></label>
                  <label htmlFor={`${direction}-plain`} className={`${expand} hidden group-has-checked:flex`}>{t("Ver menos")}<ChevronUp size={14} aria-hidden="true" /></label>
                </>
              )}
            </div>
          )}
          {annotated.length > 0 && (
            <ul className={`grid gap-x-4 gap-y-1.5 md:grid-cols-2 ${plain.length ? "mt-3" : ""}`}>
              {annotated.map((e) => (
                <li key={`${e.id}-${e.target.id}`} className="flex items-center gap-2.5">
                  <span className="shrink-0"><DigimonChip d={e.target} size="sm" /></span>
                  {e.kind !== "normal" && <span className="shrink-0"><EvoKindBadge kind={e.kind} /></span>}
                  {e.requirements && <span className="line-clamp-2 min-w-0 text-[11px] leading-snug text-muted" title={td(e.requirements)}>{td(e.requirements)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {curated.length > 0 && (
        <ul className="grid gap-2.5 md:grid-cols-2">
          {curated.map((e) => {
            const key = `${direction}-${e.id}-${e.target.id}`;
            const hidden = e.contexts.length > 5 ? e.contexts.length - 3 : 0;
            return (
              <li key={key} className="rounded-[6px] border border-line bg-surface-2/25 p-3 md:odd:last:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <DigimonChip d={e.target} size="sm" />
                  {e.kind !== "normal" && <EvoKindBadge kind={e.kind} />}
                  {e.others.length > 0 && (
                    <span className="text-xs text-muted">
                      {direction === "next" ? t("junto com {names}", { names: e.others.map((o) => o.name).join(", ") }) : `+ ${e.others.map((o) => o.name).join(" + ")} → ${self}`}
                    </span>
                  )}
                </div>
                {e.requirements && <div className="mt-2 text-xs"><span className="text-muted">{t("Requisito:")} </span>{td(e.requirements)}</div>}
                {e.notes && <div className="mt-1.5 text-xs text-muted">{td(e.notes)}</div>}
                {e.contexts.length > 0 && (
                  <div className="group mt-2.5 flex flex-wrap items-center gap-1">
                    {hidden > 0 && <input type="checkbox" id={key} className="peer sr-only" />}
                    {e.contexts.map((c, i) => (
                      <Link key={c.media.slug} href={`/universos/${c.media.slug}`}
                        title={[ln(c.media), c.requirements && t("Requisitos: {req}", { req: td(c.requirements) })].filter(Boolean).join("\n")}
                        className={`max-w-56 truncate rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-fg ${hidden && i >= 3 ? "hidden group-has-checked:inline-block" : ""}`}>
                        {ln(c.media)}{c.status === "unconfirmed" ? " (?)" : ""}
                      </Link>
                    ))}
                    {hidden > 0 && (
                      <>
                        <label htmlFor={key} className={`${toggle} group-has-checked:hidden`}>+{t("{n} obras", { n: hidden })}</label>
                        <label htmlFor={key} className={`${toggle} hidden group-has-checked:inline-block`}>{t("Ver menos")}</label>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
