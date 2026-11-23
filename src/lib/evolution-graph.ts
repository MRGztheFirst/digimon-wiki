import "server-only";
import { db } from "./db";
import type { GraphData, GEdge, GNode } from "./graph-types";
import { getI18n } from "@/i18n/server";

const nodeSelect = {
  id: true,
  slug: true,
  name: true,
  nameJp: true,
  imageUrl: true,
  stage: { select: { name: true, nameEn: true, nameJp: true, order: true, color: true, isSpecial: true } },
  attribute: { select: { name: true, color: true, slug: true } },
} as const;

const edgeInclude = {
  partners: { select: { digimonId: true } },
  source: { select: { title: true, url: true } },
  contexts: {
    include: {
      media: { select: { id: true, slug: true, name: true, nameJp: true, kind: true } },
      source: { select: { title: true, url: true } },
    },
  },
} as const;

type RawEdge = Awaited<ReturnType<typeof fetchEdges>>[number];

function fetchEdges(where: object) {
  return db.evolution.findMany({ where, include: edgeInclude });
}

type I18n = Awaited<ReturnType<typeof getI18n>>;

function toEdge(e: RawEdge, { td, ln }: I18n): GEdge {
  return {
    id: e.id,
    from: e.fromId,
    to: e.toId,
    kind: e.kind,
    status: e.status,
    partners: e.partners.map((p) => p.digimonId),
    requirements: td(e.requirements),
    notes: td(e.notes),
    source: e.source,
    contexts: e.contexts.map((c) => ({
      mediaId: c.media.id,
      mediaSlug: c.media.slug,
      mediaName: ln(c.media),
      mediaKind: c.media.kind,
      requirements: td(c.requirements),
      notes: td(c.notes),
      status: c.status,
      source: c.source,
    })),
  };
}

const IMPORTED_NODE_BUDGET = 40;

export async function buildEvolutionGraph(rootId: number, maxDepth = 12): Promise<GraphData> {
  const i18n = await getI18n();
  const { locale, t, ln } = i18n;
  const edges = new Map<number, GEdge>();
  const nodeIds = new Set<number>([rootId]);

  async function walk(direction: "up" | "down", imported: boolean, depthLimit: number) {
    let frontier = [rootId];
    const seen = new Set<number>(frontier);
    for (let depth = 0; depth < depthLimit && frontier.length; depth++) {
      const where =
        direction === "up"
          ? { imported, toId: { in: frontier } }
          : { imported, OR: [{ fromId: { in: frontier } }, { partners: { some: { digimonId: { in: frontier } } } }] };
      const rows = await fetchEdges(where);
      if (imported && depth > 0) {
        const fresh = new Set(rows.flatMap((r) => [r.fromId, r.toId]).filter((id) => !nodeIds.has(id)));
        if (nodeIds.size + fresh.size > IMPORTED_NODE_BUDGET) break;
      }
      const next: number[] = [];
      for (const r of rows) {
        edges.set(r.id, toEdge(r, i18n));
        nodeIds.add(r.fromId);
        nodeIds.add(r.toId);
        r.partners.forEach((p) => nodeIds.add(p.digimonId));
        const reached = direction === "up" ? [r.fromId, ...r.partners.map((p) => p.digimonId)] : [r.toId];
        for (const id of reached) {
          if (!seen.has(id)) {
            seen.add(id);
            next.push(id);
          }
        }
      }
      frontier = next;
    }
  }

  await walk("up", false, maxDepth);
  await walk("down", false, maxDepth);
  await walk("up", true, 2);
  await walk("down", true, 2);

  const rows = await db.digimon.findMany({ where: { id: { in: [...nodeIds] } }, select: nodeSelect });
  const nodes: GNode[] = rows.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    nameJp: d.nameJp,
    imageUrl: d.imageUrl,
    stageName: d.stage ? ln(d.stage) : t("Sem estágio"),
    stageNameEn: locale === "en" ? null : d.stage?.nameEn ?? null,
    stageOrder: d.stage?.order ?? 999,
    stageColor: d.stage?.color ?? "#64748b",
    stageSpecial: d.stage?.isSpecial ?? false,
    attrName: d.attribute ? t(d.attribute.name).split(" (")[0] : null,
    attrSlug: d.attribute?.slug ?? null,
    attrColor: d.attribute?.color ?? null,
  }));

  return { rootId, nodes, edges: [...edges.values()] };
}
