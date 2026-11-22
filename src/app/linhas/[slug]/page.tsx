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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await db.digimon.findUnique({ where: { slug }, select: { name: true } });
  return { title: d ? `Linha evolutiva de ${d.name}` : "Linha evolutiva" };
}

export default async function LinePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const d = await db.digimon.findUnique({ where: { slug }, include: { stage: true, attribute: true } });
  if (!d) notFound();
  const [graph, media] = await Promise.all([
    buildEvolutionGraph(d.id),
    db.media.findMany({ select: { id: true, name: true, kind: true, slug: true }, orderBy: [{ kind: "asc" }, { year: "asc" }] }),
  ]);
  const midia = param(sp.midia);
  const initialMediaId = midia ? media.find((m) => m.slug === midia)?.id ?? null : null;

  return (
    <div>
      <PageHeader
        crumbs={[["/linhas", "Linhas evolutivas"], [null, d.name]]}
        eyebrow="Linha evolutiva"
        title={<>Linha de {d.name}</>}
        subtitle="Evoluções anteriores e posteriores. Clique em um Digimon da árvore para seguir a partir dele."
      >
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={d.stage} />
          <AttributeBadge attribute={d.attribute} />
          <Link href={`/digimon/${d.slug}`} className="text-sm font-medium text-accent hover:underline">Abrir página de {d.name} →</Link>
        </div>
      </PageHeader>
      <Container className="py-8">
        {graph.edges.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            Nenhuma evolução cadastrada para {d.name} ainda.{editorEnabled() && <> <Link href="/admin/evolucoes/nova" className="text-primary hover:underline">Adicionar evolução</Link>.</>}
          </div>
        ) : (
          <EvolutionTree graph={graph} mediaOptions={media} initialMediaId={initialMediaId} />
        )}
      </Container>
    </div>
  );
}
