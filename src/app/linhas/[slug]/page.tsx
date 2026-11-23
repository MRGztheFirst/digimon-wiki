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
  const [graph, media] = await Promise.all([
    buildEvolutionGraph(d.id),
    db.media.findMany({ select: { id: true, name: true, nameJp: true, kind: true, slug: true }, orderBy: [{ kind: "asc" }, { year: "asc" }] }),
  ]);
  const mediaOptions = media.map((m) => ({ id: m.id, kind: m.kind, name: ln(m) }));
  const midia = param(sp.midia);
  const initialMediaId = midia ? media.find((m) => m.slug === midia)?.id ?? null : null;

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
        {graph.edges.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            {t("Nenhuma evolução cadastrada para {name} ainda.", { name: d.name })}{editorEnabled() && <> <Link href="/admin/evolucoes/nova" className="text-primary hover:underline">{t("Adicionar evolução")}</Link>.</>}
          </div>
        ) : (
          <EvolutionTree graph={graph} mediaOptions={mediaOptions} initialMediaId={initialMediaId} />
        )}
      </Container>
    </div>
  );
}
