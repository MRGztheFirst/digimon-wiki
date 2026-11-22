import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, ArrowRight, BookMarked, GitBranch, Info, Pencil, Scale, Sparkles, Swords, Tv } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { AttributeBadge, EvoKindBadge, FamilyBadge, Pill, ReviewBadge, StageBadge, StatusBadge } from "@/components/badges";
import { DigimonCard, DigimonChip, EmptyState } from "@/components/digimon-card";
import { Breadcrumbs, Container, Field, Missing, Section } from "@/components/ui";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, REVIEW_STATUSES, mediaKindOf, reviewOf } from "@/lib/constants";
import { padNumber, paragraphs } from "@/lib/utils";
import { editorEnabled } from "@/lib/editor";

const ctxInclude = { include: { media: { select: { slug: true, name: true, kind: true } } } } as const;

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
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await db.digimon.findUnique({ where: { slug }, select: { name: true, summary: true, nameJp: true } });
  if (!d) return { title: "Digimon não encontrado" };
  return { title: d.name, description: d.summary ?? `${d.name} (${d.nameJp ?? ""}) na Digimon Database.` };
}

function splitCamel(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s-]+/);
}

export default async function DigimonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  db.$executeRaw`UPDATE "Digimon" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${d.id}`.catch(() => {});

  type EvoItem = {
    id: number; kind: string; status: string; notes: string | null; requirements: string | null; imported: boolean;
    others: (typeof d.evolutionsFrom)[number]["to"][];
    target: (typeof d.evolutionsFrom)[number]["to"];
    contexts: { media: { slug: string; name: string; kind: string }; requirements: string | null; status: string }[];
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
  const [related, similar] = await Promise.all([
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
  ]);

  const appearancesByKind = MEDIA_KIND_KEYS.map((k) => [k, d.appearances.filter((a) => mediaKindOf(a.media.kind) === k)] as const);

  const hasChar = !!(d.physical || d.personality || d.combat);
  const hasAttacks = d.attacks.length > 0 || d.abilities.length > 0;
  const hasApp = d.appearances.length > 0;
  const hasTrivia = d.trivia.length > 0;
  const hasRelated = related.length > 0 || similar.length > 0;
  const toc = ([
    ["visao-geral", "Visão geral", true], ["classificacao", "Classificação", true], ["caracteristicas", "Características", hasChar],
    ["golpes", "Golpes e habilidades", hasAttacks], ["evolucoes", "Evoluções", true], ["aparicoes", "Aparições", hasApp],
    ["curiosidades", "Curiosidades", hasTrivia], ["relacionados", "Relacionados", hasRelated],
  ] as const).filter(([, , show]) => show);

  return (
    <div>
      <div className="border-b border-line">
        <Container className="pb-10 pt-8">
          <Breadcrumbs items={[["/digimon", "Enciclopédia"], [null, d.name]]} />
          <div className="grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-end">
            <div>
              <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe className="aspect-square w-full max-w-[22rem]" />
            </div>
            <div className="min-w-0">
              <div className="label">Nº {padNumber(d.number).slice(1)}{d.stage ? ` · ${d.stage.name}` : ""}</div>
              <h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight md:text-6xl">{d.name}</h1>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {d.nameJp && <span className="font-jp text-xl">{d.nameJp}</span>}
                {d.romaji && <span className="font-mono text-sm text-muted">{d.romaji}</span>}
              </div>
              {d.otherNames && <div className="mt-2 text-sm text-muted">Em localizações: {d.otherNames}</div>}
              <div className="mt-5 flex flex-wrap gap-1.5">
                <StageBadge stage={d.stage} />
                <AttributeBadge attribute={d.attribute} />
                {d.types.map((t) => <Pill key={t.typeId} color="var(--muted)" href={`/tipos/${t.type.slug}`}>{t.type.name}</Pill>)}
                {d.base && <Pill color="var(--primary)" href={`/digimon/${d.base.slug}`}>{d.variantKind ?? "Variante"} de {d.base.name}</Pill>}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/linhas/${d.slug}`} className="btn btn-primary"><GitBranch size={15} /> Linha evolutiva</Link>
                <Link href={`/comparar?d=${d.slug}`} className="btn btn-ghost"><Scale size={15} /> Comparar</Link>
                <Link href={`/universos/comparar?digimon=${d.slug}`} className="btn btn-ghost"><Tv size={15} /> Entre jogos</Link>
                {editorEnabled() && <Link href={`/admin/digimon/${d.id}`} className="btn btn-ghost" title="Editar (somente no seu computador)"><Pencil size={15} /> Editar</Link>}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm" aria-label="Nesta página">
            <div className="label mb-3">Nesta página</div>
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block border-l border-line py-1 pl-3 text-muted hover:border-primary hover:text-fg">{label}</a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          <Section id="visao-geral" title="Visão geral" icon={<Info size={18} />}>
            <div className="card p-5">
              <div className="prose-wiki">
                {d.summary ? paragraphs(d.summary).map((p, i) => <p key={i}>{p}</p>) : !(d.profileJp || d.profileEn) && <Missing>Descrição ainda não cadastrada.</Missing>}
              </div>
              {(d.profileJp || d.profileEn) && (
                <figure className={d.summary ? "mt-5 border-t border-line pt-5" : ""}>
                  <figcaption className="label mb-3">Perfil</figcaption>
                  {d.profileJp && <blockquote lang="ja" className="font-jp text-[15px] leading-8">{d.profileJp}</blockquote>}
                  {d.profileEn && <blockquote lang="en" className={`text-[15px] leading-7 text-muted ${d.profileJp ? "mt-4" : ""}`}>{d.profileEn}</blockquote>}
                </figure>
              )}
              <dl className="mt-4">
                <Field label="Nome oficial">{d.name}</Field>
                <Field label="Nome japonês">{d.nameJp}</Field>
                <Field label="Pronúncia">{d.pronunciation}</Field>
                <Field label="Nº na wiki">{padNumber(d.number)}</Field>
                <Field label="Significado do nome">{d.nameMeaning}</Field>
                <Field label="Origem do design">{d.designOrigin}</Field>
                <Field label="Primeira aparição">{d.firstAppearance && `${d.firstAppearance}${d.firstYear ? ` (${d.firstYear})` : ""}`}</Field>
              </dl>
            </div>
          </Section>

          <Section id="classificacao" title="Classificação" icon={<BookMarked size={18} />}>
            <dl className="card px-5 py-2">
              <Field label="Estágio">
                {d.stage && (
                  <span className="flex flex-wrap items-center gap-2">
                    <StageBadge stage={d.stage} />
                    <span className="text-muted">{[d.stage.nameEn, d.stage.nameJp, d.stage.romaji].filter(Boolean).join(" · ")}</span>
                  </span>
                )}
              </Field>
              <Field label="Tipo">{d.types.length > 0 && d.types.map((t) => <Link key={t.typeId} className="mr-3 text-accent hover:underline" href={`/tipos/${t.type.slug}`}>{t.type.name}</Link>)}</Field>
              <Field label="Atributo">{d.attribute && <AttributeBadge attribute={d.attribute} />}</Field>
              <Field label="Família">
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
              <Field label="Grupo / organização">
                {d.groups.length > 0 && d.groups.map((g) => (
                  <span key={g.groupId} className="mr-3">
                    <Link href={`/grupos/${g.group.slug}`} className="text-accent hover:underline">{g.group.name}</Link>
                    {g.role && <span className="text-muted"> — {g.role}</span>}
                  </span>
                ))}
              </Field>
              <Field label="Nível de poder">{d.powerLevel}</Field>
            </dl>
          </Section>

          {hasChar && <Section id="caracteristicas" title="Características" icon={<Sparkles size={18} />}>
            <dl className="card px-5 py-2">
              <Field label="Descrição física">{d.physical}</Field>
              <Field label="Personalidade">{d.personality}</Field>
              <Field label="Combate">{d.combat}</Field>
            </dl>
          </Section>}

          {hasAttacks && <Section id="golpes" title="Golpes e habilidades" icon={<Swords size={18} />}>
            <div className={d.attacks.length && d.abilities.length ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
              {d.attacks.length > 0 && <div className="card p-5">
                <h3 className="mb-3 font-semibold">Golpes e ataques</h3>
                {d.attacks.length ? (
                  <ul className="space-y-3">
                    {d.attacks.map((a) => (
                      <li key={a.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{a.name}</span>
                          {a.localizedName && <span className="text-xs text-muted">Localizado: {a.localizedName}</span>}
                        </div>
                        {a.description && <p className="text-sm text-muted">{a.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>}
              {d.abilities.length > 0 && <div className="card p-5">
                <h3 className="mb-3 font-semibold">Habilidades especiais</h3>
                {d.abilities.length ? (
                  <ul className="space-y-3">
                    {d.abilities.map((a) => (
                      <li key={a.id}>
                        <span className="font-semibold">{a.name}</span>
                        {a.description && <p className="text-sm text-muted">{a.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>}
            </div>
          </Section>}

          <Section id="evolucoes" title="Evoluções" icon={<GitBranch size={18} />} action={<Link href={`/linhas/${d.slug}`} className="text-sm font-medium text-accent hover:underline">Árvore completa →</Link>}
>
            <div className="grid gap-4 md:grid-cols-2">
              <EvoColumn title="Evolui a partir de" icon={<ArrowLeft size={16} />} items={prev} self={d.name} direction="prev" />
              <EvoColumn title="Pode evoluir para" icon={<ArrowRight size={16} />} items={next} self={d.name} direction="next" />
            </div>
            {(d.variants.length > 0 || d.base) && (
              <div className="card mt-4 p-5">
                <h3 className="mb-3 font-semibold">Formas alternativas e variantes</h3>
                <div className="flex flex-wrap gap-2">
                  {d.base && <DigimonChip d={d.base} suffix={<span className="text-xs text-muted">forma base</span>} />}
                  {d.variants.map((v) => <DigimonChip key={v.id} d={v} suffix={v.variantKind && <span className="text-xs text-muted">{v.variantKind}</span>} />)}
                </div>
              </div>
            )}
          </Section>

          {hasApp && <Section id="aparicoes" title="Aparições" icon={<Tv size={18} />}>
            <div className="grid gap-4 md:grid-cols-2">
              {appearancesByKind.filter(([, list]) => list.length > 0).map(([k, list]) => (
                <div key={k} className="card p-5">
                  <h3 className="mb-3 flex items-center justify-between font-semibold">
                    {MEDIA_KINDS[k].plural}
                    <span className="text-xs font-normal text-muted">{list.length}</span>
                  </h3>
                  {list.length ? (
                    <ul className="space-y-2.5">
                      {list.map((a) => (
                        <li key={a.id} className="text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/universos/${a.media.slug}`} className="font-semibold hover:text-primary">{a.media.name}</Link>
                            {a.media.year && <span className="text-xs text-muted">{a.media.year}</span>}
                          </div>
                          {(a.role || a.form) && <div className="text-muted">{[a.role, a.form && `Forma: ${a.form}`].filter(Boolean).join(" · ")}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : <Missing>Nenhuma aparição cadastrada.</Missing>}
                </div>
              ))}
            </div>
          </Section>}

          {hasTrivia && <Section id="curiosidades" title="Curiosidades" icon={<Sparkles size={18} />}>
            {d.trivia.length ? (
              <ul className="space-y-2">
                {d.trivia.map((t) => (
                  <li key={t.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm">{t.text}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>}

          {hasRelated && <Section id="relacionados" title="Relacionados" icon={<Sparkles size={18} />}>
            <div className="space-y-6">
              {related.length > 0 && <div>
                <h3 className="mb-3 text-sm font-semibold text-muted">Digimon relacionados (mesmo grupo, tipo ou família)</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{related.map((r) => <DigimonCard key={r.id} d={r} />)}</div>
              </div>}
              {similar.length > 0 && <div>
                <h3 className="mb-3 text-sm font-semibold text-muted">Nomes semelhantes</h3>
                <div className="flex flex-wrap gap-2">{similar.map((r) => <DigimonChip key={r.id} d={r} size="sm" />)}</div>
              </div>}
            </div>
          </Section>}

        </div>
      </Container>
    </div>
  );
}

function EvoColumn({ title, icon, items, self, direction }: {
  title: string; icon: React.ReactNode; self: string; direction: "prev" | "next";
  items: { id: number; kind: string; status: string; notes: string | null; requirements: string | null; imported: boolean; target: Parameters<typeof DigimonChip>[0]["d"] & { id: number }; others: (Parameters<typeof DigimonChip>[0]["d"] & { id: number })[]; contexts: { media: { slug: string; name: string; kind: string }; requirements: string | null; status: string }[] }[];
}) {
  const curated = items.filter((e) => !e.imported);
  const listed = items.filter((e) => e.imported);
  return (
    <div className="card flex flex-col p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><span className="text-primary">{icon}</span>{title}</h3>
      {items.length === 0 && <Missing>Nenhuma evolução cadastrada.</Missing>}
      {listed.length > 0 && (
        <div className={curated.length ? "order-last mt-4 border-t border-line pt-4" : ""}>
          <ul className="flex flex-wrap gap-1.5">
            {listed.map((e) => (
              <li key={`${e.id}-${e.target.id}`} className="flex items-center gap-1.5">
                <DigimonChip d={e.target} size="sm" />
                {e.kind !== "normal" && <EvoKindBadge kind={e.kind} />}
                {e.requirements && <span className="max-w-56 text-[11px] text-muted">{e.requirements}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {curated.length > 0 && (
        <ul className="space-y-3">
          {curated.map((e) => (
            <li key={`${e.id}-${e.target.id}`} className="rounded-[4px] border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <DigimonChip d={e.target} size="sm" />
                {e.others.length > 0 && (
                  <span className="text-xs text-muted">
                    {direction === "next" ? `junto com ${e.others.map((o) => o.name).join(", ")}` : `+ ${e.others.map((o) => o.name).join(" + ")} → ${self}`}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {e.kind !== "normal" && <EvoKindBadge kind={e.kind} />}
              </div>
              {e.requirements && <div className="mt-1.5 text-xs"><span className="text-muted">Requisito: </span>{e.requirements}</div>}
              {e.notes && <div className="mt-1 text-xs text-muted">{e.notes}</div>}
              {e.contexts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.contexts.map((c) => (
                    <Link key={c.media.slug} href={`/universos/${c.media.slug}`} title={c.requirements ? `Requisitos: ${c.requirements}` : undefined}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted hover:text-fg">
                      {c.media.name}{c.status === "unconfirmed" ? " (?)" : ""}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
