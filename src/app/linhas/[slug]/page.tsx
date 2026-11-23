import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buildEvolutionGraph } from "@/lib/evolution-graph";
import { EvolutionTree } from "@/components/evolution-tree";
import { Container, PageHeader } from "@/components/ui";
import { AttributeBadge, StageBadge } from "@/components/badges";
import { param } from "@/lib/utils";
import { editorEnabled } from "@/lib/editor";
import { getI18n } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  const d = await db.digimon.findUnique({ where: { slug }, select: { name: true } });
  return { title: d ? t("Linha evolutiva de {name}", { name: d.name }) : t("Linha evolutiva") };
}

export default async function LinePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { ln, t } = await getI18n();
  const d = await db.digimon.findUnique({ where: { slug }, include: { stage: true, attribute: true } });
  if (!d) notFound();
  const midia = param(sp.midia);
  const touching = { OR: [{ fromId: d.id }, { toId: d.id }, { partners: { some: { digimonId: d.id } } }] };
  const [counts, current] = await Promise.all([
    db.evolutionContext.groupBy({ by: ["mediaId"], where: { evolution: touching }, _count: { _all: true } }),
    midia ? db.media.findUnique({ where: { slug: midia }, select: { id: true, slug: true, name: true, nameJp: true, kind: true } }) : null,
  ]);
  const [graph, media] = await Promise.all([
    buildEvolutionGraph(d.id, { mediaId: current?.id ?? null }),
    db.media.findMany({ where: { id: { in: counts.map((c) => c.mediaId) } }, select: { id: true, slug: true, name: true, nameJp: true, kind: true, year: true, imported: true } }),
  ]);
  const count = new Map(counts.map((c) => [c.mediaId, c._count._all]));
  const choices = media
    .map((m) => ({ slug: m.slug, name: ln(m), kind: m.kind, count: count.get(m.id) ?? 0, main: !m.imported }))
    .sort((a, b) => Number(b.main) - Number(a.main) || b.count - a.count || a.name.localeCompare(b.name));
  const currentChoice = current ? { slug: current.slug, name: ln(current), kind: current.kind } : null;

  return (
    <div>
      <PageHeader
        crumbs={[["/linhas", t("Linhas evolutivas")], [null, d.name]]}
        eyebrow={t("Linha evolutiva")}
        title={t("Linha de {name}", { name: d.name })}
        subtitle={t("Evoluções anteriores e posteriores. Clique em um Digimon da árvore para seguir a partir dele.")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={d.stage} />
          <AttributeBadge attribute={d.attribute} />
          <Link href={`/digimon/${d.slug}`} className="text-sm font-medium text-accent hover:underline">{t("Abrir página de {name}", { name: d.name })} →</Link>
        </div>
      </PageHeader>
      <Container className="py-8">
        {graph.edges.length === 0 && !currentChoice ? (
          <div className="card p-8 text-center text-muted">
            {t("Nenhuma evolução cadastrada para {name} ainda.", { name: d.name })}{editorEnabled() && <> <Link href="/admin/evolucoes/nova" className="text-primary hover:underline">{t("Adicionar evolução")}</Link>.</>}
          </div>
        ) : (
          <EvolutionTree key={currentChoice?.slug ?? "all"} graph={graph} slug={d.slug} choices={choices} current={currentChoice} />
        )}
      </Container>
    </div>
  );
}
