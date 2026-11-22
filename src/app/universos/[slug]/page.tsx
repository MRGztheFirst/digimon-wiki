import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Cog, GitBranch, Layers, ListChecks, Scale, Sparkles, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { Container, Missing, PageHeader, Section } from "@/components/ui";
import { DigimonCard, DigimonChip, EmptyState } from "@/components/digimon-card";
import { EvoKindBadge, MediaKindBadge, StatusBadge } from "@/components/badges";
import { FEATURE_CATEGORIES, type FeatureCategory } from "@/lib/constants";
import { yearRange } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = await db.media.findUnique({ where: { slug }, select: { name: true, description: true } });
  return { title: m?.name ?? "Universo", description: m?.description ?? undefined };
}

const FEATURE_ICONS: Record<FeatureCategory, React.ReactNode> = {
  "evolution-system": <GitBranch size={18} />,
  requirements: <ListChecks size={18} />,
  "exclusive-system": <Star size={18} />,
  particularity: <Sparkles size={18} />,
};

export default async function MediaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await db.media.findUnique({
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
  });
  if (!m) notFound();

  const exclusiveDigimon = m.appearances.filter((a) => a.digimon._count.appearances === 1);
  const evo = [...m.evolutionContexts].sort((a, b) => a.evolution.from.number - b.evolution.from.number);
  const exclusiveEvo = evo.filter((c) => c.evolution._count.contexts === 1);
  const categories = Object.keys(FEATURE_CATEGORIES) as FeatureCategory[];

  return (
    <div>
      <PageHeader crumbs={[["/universos", "Universos"], [null, m.name]]} eyebrow={<span className="flex items-center gap-2"><MediaKindBadge kind={m.kind} /></span>} title={m.name}
        subtitle={<>{m.nameJp && <div className="text-sm">{m.nameJp}</div>}<div className="mt-1">{[yearRange(m.year, m.endYear), m.platform].filter(Boolean).join(" · ")}</div></>}>
        <div className="flex flex-wrap gap-2">
          <Link href={`/universos/comparar?m=${m.slug}`} className="btn btn-primary"><Scale size={16} /> Comparar com outra obra</Link>
          <Link href={`/digimon?${m.kind === "game" ? "jogo" : m.kind === "anime" || m.kind === "movie" ? "anime" : "midia"}=${m.slug}`} className="btn btn-ghost">Buscar Digimon desta obra</Link>
        </div>
      </PageHeader>
      <Container className="space-y-12 py-10">
        {m.description && <p className="max-w-3xl text-lg text-muted">{m.description}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => {
            const list = m.features.filter((f) => f.category === cat);
            return (
              <div key={cat} className="card p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><span className="text-primary">{FEATURE_ICONS[cat]}</span>{FEATURE_CATEGORIES[cat]}</h2>
                {list.length ? (
                  <ul className="space-y-4">
                    {list.map((f) => (
                      <li key={f.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{f.title}</h3>
                          <StatusBadge status={f.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted">{f.body}</p>
                        {f.source?.url && <a href={f.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">Fonte: {f.source.title}</a>}
                      </li>
                    ))}
                  </ul>
                ) : <Missing>Nenhuma informação cadastrada.</Missing>}
              </div>
            );
          })}
        </div>

        <Section title="Estágios disponíveis" icon={<Layers size={20} />}>
          {m.stages.length ? (
            <div className="flex flex-wrap gap-2">
              {m.stages.map((s) => (
                <Link key={s.stageId} href={`/estagios/${s.stage.slug}`} className="rounded-[4px] border px-3 py-2 text-sm" style={{ borderColor: `${s.stage.color}66`, background: `${s.stage.color}14` }}>
                  <span className="font-semibold">{s.localName ?? s.stage.name}</span>
                  {s.notes && <span className="text-xs text-muted"> — {s.notes}</span>}
                </Link>
              ))}
            </div>
          ) : <Missing>Estágios desta obra ainda não cadastrados.</Missing>}
        </Section>

        <Section title={`Evoluções registradas nesta obra (${evo.length})`} icon={<GitBranch size={20} />}
          description="Válidas dentro deste universo. Requisitos só aparecem quando documentados.">
          {evo.length ? (
            <div className="card scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="p-3">Evolução</th><th className="p-3">Tipo</th><th className="p-3">Requisitos / observações</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {evo.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/60">
                      <td className="p-3">
                        <Link href={`/linhas/${c.evolution.from.slug}?midia=${m.slug}`} className="hover:text-primary">
                          <b>{c.evolution.from.name}</b>
                          {c.evolution.partners.map((p) => <span key={p.digimon.name}> + <b>{p.digimon.name}</b></span>)}
                          <span className="text-muted"> → </span><b>{c.evolution.to.name}</b>
                        </Link>
                        {c.evolution._count.contexts === 1 && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">exclusiva</span>}
                      </td>
                      <td className="p-3"><EvoKindBadge kind={c.evolution.kind} /></td>
                      <td className="p-3 text-muted">{[c.requirements, c.notes].filter(Boolean).join(" · ") || <Missing>Não documentados</Missing>}</td>
                      <td className="p-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState>Nenhuma evolução cadastrada para esta obra ainda.</EmptyState>}
        </Section>

        <Section title="Diferenças nas linhas evolutivas" icon={<Cog size={20} />} description="Evoluções que, nesta wiki, estão registradas apenas neste universo.">
          {exclusiveEvo.length ? (
            <div className="flex flex-wrap gap-2">
              {exclusiveEvo.map((c) => (
                <Link key={c.id} href={`/linhas/${c.evolution.from.slug}`} className="card px-3 py-2 text-sm hover:border-fg/40">
                  {c.evolution.from.name} → <b>{c.evolution.to.name}</b>
                </Link>
              ))}
            </div>
          ) : <Missing>Nenhuma evolução exclusiva registrada.</Missing>}
        </Section>

        <Section title={`Digimon disponíveis (${m.appearances.length})`} icon={<Users size={20} />}>
          {m.appearances.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {m.appearances.map((a) => (
                <DigimonCard key={a.id} d={a.digimon} extra={(a.role || a.form) && <div className="line-clamp-2 text-[11px] text-muted">{[a.role, a.form].filter(Boolean).join(" · ")}</div>} />
              ))}
            </div>
          ) : <EmptyState>Nenhuma aparição cadastrada.</EmptyState>}
        </Section>

        <Section title="Digimon que não aparecem em outras obras cadastradas" icon={<Star size={20} />} description="Calculado a partir das aparições registradas nesta wiki — pode mudar conforme novos dados forem adicionados.">
          {exclusiveDigimon.length ? (
            <div className="flex flex-wrap gap-2">{exclusiveDigimon.map((a) => <DigimonChip key={a.id} d={a.digimon} size="sm" />)}</div>
          ) : <Missing>Nenhum.</Missing>}
        </Section>
      </Container>
    </div>
  );
}
