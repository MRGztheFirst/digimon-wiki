import type { GEdge, GNode, GraphData, GraphFilters } from "./graph-types";

export function edgeVisible(e: GEdge, f: GraphFilters) {
  if (!f.statuses.has(e.status)) return false;
  if (!f.kinds.has(e.kind)) return false;
  if (f.mediaId != null) return e.contexts.some((c) => c.mediaId === f.mediaId);
  if (e.contexts.length === 0) return f.mediaKinds.has("general");
  return e.contexts.some((c) => f.mediaKinds.has(c.mediaKind)) || (f.mediaKinds.has("general") && e.status === "official");
}

export function filterGraph(g: GraphData, f: GraphFilters) {
  const edges = g.edges.filter((e) => edgeVisible(e, f));
  const incoming = new Map<number, GEdge[]>();
  const outgoing = new Map<number, GEdge[]>();
  for (const e of edges) {
    (incoming.get(e.to) ?? incoming.set(e.to, []).get(e.to)!).push(e);
    for (const src of [e.from, ...e.partners]) (outgoing.get(src) ?? outgoing.set(src, []).get(src)!).push(e);
  }
  const keep = new Set<number>([g.rootId]);
  const usedEdges = new Set<number>();
  const up = [g.rootId];
  const seenUp = new Set(up);
  while (up.length) {
    const id = up.pop()!;
    for (const e of incoming.get(id) ?? []) {
      usedEdges.add(e.id);
      for (const s of [e.from, ...e.partners]) {
        keep.add(s);
        if (!seenUp.has(s)) {
          seenUp.add(s);
          up.push(s);
        }
      }
    }
  }
  const down = [g.rootId];
  const seenDown = new Set(down);
  while (down.length) {
    const id = down.pop()!;
    for (const e of outgoing.get(id) ?? []) {
      usedEdges.add(e.id);
      keep.add(e.to);
      e.partners.forEach((p) => keep.add(p));
      keep.add(e.from);
      if (!seenDown.has(e.to)) {
        seenDown.add(e.to);
        down.push(e.to);
      }
    }
  }
  return {
    nodes: g.nodes.filter((n) => keep.has(n.id)),
    edges: edges.filter((e) => usedEdges.has(e.id)),
  };
}

export const NODE_W = 176;
export const NODE_H = 60;
export const COL_GAP = 84;
export const ROW_GAP = 18;
export const HEADER_H = 36;

export type Placed = GNode & { x: number; y: number; col: number };

export function layoutGraph(nodes: GNode[], edges: GEdge[]) {
  const orders = [...new Set(nodes.map((n) => n.stageOrder))].sort((a, b) => a - b);
  const col = new Map<number, number>();
  nodes.forEach((n) => col.set(n.id, orders.indexOf(n.stageOrder)));

  for (let iter = 0; iter < nodes.length + 2; iter++) {
    let changed = false;
    for (const e of edges) {
      for (const src of [e.from, ...e.partners]) {
        const cs = col.get(src);
        const ct = col.get(e.to);
        if (cs == null || ct == null) continue;
        if (ct <= cs) {
          col.set(e.to, cs + 1);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  const used = [...new Set(col.values())].sort((a, b) => a - b);
  for (const [id, c] of col) col.set(id, used.indexOf(c));
  const nCols = used.length;

  const columns: number[][] = Array.from({ length: nCols }, () => []);
  [...nodes]
    .sort((a, b) => Number(a.stageSpecial) - Number(b.stageSpecial) || a.name.localeCompare(b.name))
    .forEach((n) => columns[col.get(n.id)!].push(n.id));

  const preds = new Map<number, number[]>();
  const succs = new Map<number, number[]>();
  for (const e of edges)
    for (const s of [e.from, ...e.partners]) {
      (preds.get(e.to) ?? preds.set(e.to, []).get(e.to)!).push(s);
      (succs.get(s) ?? succs.set(s, []).get(s)!).push(e.to);
    }
  const rowOf = () => {
    const m = new Map<number, number>();
    columns.forEach((c) => c.forEach((id, i) => m.set(id, i - (c.length - 1) / 2)));
    return m;
  };
  for (let pass = 0; pass < 4; pass++) {
    const forward = pass % 2 === 0;
    const idxs = forward ? [...columns.keys()] : [...columns.keys()].reverse();
    for (const ci of idxs) {
      const rows = rowOf();
      const ref = forward ? preds : succs;
      const bary = (id: number) => {
        const ns = (ref.get(id) ?? []).filter((x) => rows.has(x));
        if (!ns.length) return rows.get(id) ?? 0;
        return ns.reduce((s, x) => s + rows.get(x)!, 0) / ns.length;
      };
      columns[ci].sort((a, b) => bary(a) - bary(b));
    }
  }

  const maxRows = Math.max(1, ...columns.map((c) => c.length));
  const height = HEADER_H + maxRows * (NODE_H + ROW_GAP);
  const width = nCols * (NODE_W + COL_GAP) - COL_GAP;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed: Placed[] = [];
  columns.forEach((c, ci) => {
    const offset = ((maxRows - c.length) * (NODE_H + ROW_GAP)) / 2;
    c.forEach((id, ri) => {
      placed.push({ ...byId.get(id)!, col: ci, x: ci * (NODE_W + COL_GAP), y: HEADER_H + offset + ri * (NODE_H + ROW_GAP) });
    });
  });
  const headers = columns.map((c, ci) => {
    const names = [...new Set(c.map((id) => byId.get(id)!.stageName))];
    return { col: ci, x: ci * (NODE_W + COL_GAP), label: names.join(" / ") };
  });
  return { placed, width: Math.max(width, NODE_W), height, headers };
}
