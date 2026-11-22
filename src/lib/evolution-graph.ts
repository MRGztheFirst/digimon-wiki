import "server-only";
import { db } from "./db";
import type { GraphData, GEdge, GNode } from "./graph-types";

const nodeSelect = {
  id: true,
  slug: true,
  name: true,
  nameJp: true,
  imageUrl: true,
  stage: { select: { name: true, nameEn: true, order: true, color: true, isSpecial: true } },
  attribute: { select: { name: true, color: true, slug: true } },
} as const;

const edgeInclude = {
  partners: { select: { digimonId: true } },
  source: { select: { title: true, url: true } },
  contexts: {
    include: {
      media: { select: { id: true, slug: true, name: true, kind: true } },
      source: { select: { title: true, url: true } },
    },
  },
} as const;

type RawEdge = Awaited<ReturnType<typeof fetchEdges>>[number];

function fetchEdges(where: object) {
  return db.evolution.findMany({ where, include: edgeInclude });
}

function toEdge(e: RawEdge): GEdge {
  return {
    id: e.id,
    from: e.fromId,
    to: e.toId,
    kind: e.kind,
    status: e.status,
    partners: e.partners.map((p) => p.digimonId),
    requirements: e.requirements,
    notes: e.notes,
    source: e.source,
    contexts: e.contexts.map((c) => ({
      mediaId: c.media.id,
      mediaSlug: c.media.slug,
      mediaName: c.media.name,
      mediaKind: c.media.kind,
      requirements: c.requirements,
      notes: c.notes,
      status: c.status,
      source: c.source,
    })),
  };
}

export async function buildEvolutionGraph(rootId: number, maxDepth = 12): Promise<GraphData> {
  const edges = new Map<number, GEdge>();
  const nodeIds = new Set<number>([rootId]);

  let frontier = [rootId];
  const seenUp = new Set<number>([rootId]);
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const rows = await fetchEdges({ toId: { in: frontier } });
    const next: number[] = [];
    for (const r of rows) {
      edges.set(r.id, toEdge(r));
      for (const id of [r.fromId, ...r.partners.map((p) => p.digimonId)]) {
        nodeIds.add(id);
        if (!seenUp.has(id)) {
          seenUp.add(id);
          next.push(id);
        }
      }
    }
    frontier = next;
  }

  frontier = [rootId];
  const seenDown = new Set<number>([rootId]);
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const rows = await fetchEdges({
      OR: [{ fromId: { in: frontier } }, { partners: { some: { digimonId: { in: frontier } } } }],
    });
    const next: number[] = [];
    for (const r of rows) {
      edges.set(r.id, toEdge(r));
      nodeIds.add(r.fromId);
      r.partners.forEach((p) => nodeIds.add(p.digimonId));
      nodeIds.add(r.toId);
      if (!seenDown.has(r.toId)) {
        seenDown.add(r.toId);
        next.push(r.toId);
      }
    }
    frontier = next;
  }

  const rows = await db.digimon.findMany({ where: { id: { in: [...nodeIds] } }, select: nodeSelect });
  const nodes: GNode[] = rows.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    nameJp: d.nameJp,
    imageUrl: d.imageUrl,
    stageName: d.stage?.name ?? "Sem estágio",
    stageNameEn: d.stage?.nameEn ?? null,
    stageOrder: d.stage?.order ?? 999,
    stageColor: d.stage?.color ?? "#64748b",
    stageSpecial: d.stage?.isSpecial ?? false,
    attrName: d.attribute?.name?.split(" (")[0] ?? null,
    attrSlug: d.attribute?.slug ?? null,
    attrColor: d.attribute?.color ?? null,
  }));

  return { rootId, nodes, edges: [...edges.values()] };
}
