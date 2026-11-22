"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Focus, List, Maximize2, Minus, Network, Plus, RotateCcw, X } from "lucide-react";
import type { GEdge, GraphData, GraphFilters, GNode } from "@/lib/graph-types";
import { COL_GAP, NODE_H, NODE_W, filterGraph, layoutGraph } from "@/lib/graph-layout";
import { EVOLUTION_KINDS, MEDIA_KINDS, STATUSES, evoKindOf, mediaKindOf, statusOf } from "@/lib/constants";
import { DigimonAvatar } from "./digimon-avatar";
import { AttributeIcon } from "./icons";
import { cn } from "@/lib/utils";

type MediaOpt = { id: number; name: string; kind: string };

const MEDIA_FILTERS: [string, string][] = [
  ["general", "Geral"],
  ...(["anime", "movie", "game", "vpet", "manga", "card", "other"] as const).map((k) => [k, MEDIA_KINDS[k].plural] as [string, string]),
];

function lineStyle(status: string) {
  if (status === "unconfirmed") return "6 5";
  if (status === "community") return "2 5";
  return undefined;
}

export function EvolutionTree({ graph, mediaOptions, initialMediaId = null }: { graph: GraphData; mediaOptions: MediaOpt[]; initialMediaId?: number | null }) {
  const presentKinds = useMemo(() => [...new Set(graph.edges.map((e) => e.kind))], [graph]);
  const presentMediaKinds = useMemo(() => {
    const s = new Set<string>();
    graph.edges.forEach((e) => (e.contexts.length ? e.contexts.forEach((c) => s.add(c.mediaKind)) : s.add("general")));
    if (graph.edges.some((e) => e.status === "official")) s.add("general");
    return s;
  }, [graph]);
  const graphMedia = useMemo(() => {
    const ids = new Set(graph.edges.flatMap((e) => e.contexts.map((c) => c.mediaId)));
    return mediaOptions.filter((m) => ids.has(m.id));
  }, [graph, mediaOptions]);

  const [mediaKinds, setMediaKinds] = useState<Set<string>>(() => new Set(MEDIA_FILTERS.map(([k]) => k)));
  const [statuses, setStatuses] = useState<Set<string>>(() => new Set(["official", "media", "unconfirmed"]));
  const [kinds, setKinds] = useState<Set<string>>(() => new Set(Object.keys(EVOLUTION_KINDS)));
  const [mediaId, setMediaId] = useState<number | null>(initialMediaId);
  const [selected, setSelected] = useState<{ type: "node" | "edge"; id: number } | null>({ type: "node", id: graph.rootId });
  const [hover, setHover] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"tree" | "list">("tree");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filters: GraphFilters = { mediaKinds, statuses, kinds, mediaId };
  const { nodes, edges } = useMemo(() => filterGraph(graph, filters), [graph, mediaKinds, statuses, kinds, mediaId]);
  const layout = useMemo(() => layoutGraph(nodes, edges), [nodes, edges]);
  const pos = useMemo(() => new Map(layout.placed.map((p) => [p.id, p])), [layout]);
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  useEffect(() => {
    const el = scrollRef.current;
    const root = pos.get(graph.rootId);
    if (!el || !root) return;
    el.scrollTo({
      left: Math.max(0, (root.x + NODE_W / 2) * zoom - el.clientWidth / 2),
      top: Math.max(0, (root.y + NODE_H / 2) * zoom - el.clientHeight / 2),
    });
  }, [graph.rootId, view]);

  const focusId = hover ?? (selected?.type === "node" ? selected.id : null);
  const lineage = useMemo(() => {
    if (focusId == null) return null;
    const nodesSet = new Set([focusId]);
    const edgeSet = new Set<number>();
    const walk = (start: number, dir: "up" | "down") => {
      const stack = [start];
      const seen = new Set(stack);
      while (stack.length) {
        const id = stack.pop()!;
        for (const e of edges) {
          const srcs = [e.from, ...e.partners];
          if (dir === "up" ? e.to === id : srcs.includes(id)) {
            edgeSet.add(e.id);
            const nexts = dir === "up" ? srcs : [e.to];
            for (const n of nexts) {
              nodesSet.add(n);
              if (!seen.has(n)) {
                seen.add(n);
                stack.push(n);
              }
            }
            if (dir === "down") e.partners.forEach((p) => nodesSet.add(p));
          }
        }
      }
    };
    walk(focusId, "up");
    walk(focusId, "down");
    return { nodes: nodesSet, edges: edgeSet };
  }, [focusId, edges]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };
  const reset = () => {
    setMediaKinds(new Set(MEDIA_FILTERS.map(([k]) => k)));
    setStatuses(new Set(["official", "media", "unconfirmed"]));
    setKinds(new Set(Object.keys(EVOLUTION_KINDS)));
    setMediaId(null);
  };

  const selNode = selected?.type === "node" ? byId.get(selected.id) : undefined;
  const selEdge = selected?.type === "edge" ? graph.edges.find((e) => e.id === selected.id) : undefined;
  const hiddenCount = graph.nodes.length - nodes.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-3">
        <div className="card space-y-3 p-4">
          <FilterRow label="Mídia">
            {MEDIA_FILTERS.filter(([k]) => presentMediaKinds.has(k)).map(([k, label]) => (
              <Chip key={k} active={mediaKinds.has(k) && mediaId == null} disabled={mediaId != null} onClick={() => toggle(mediaKinds, setMediaKinds, k)}>
                {label}
              </Chip>
            ))}
            <select
              className="input h-8 w-auto max-w-full py-0 text-xs"
              value={mediaId ?? ""}
              onChange={(e) => setMediaId(e.target.value ? Number(e.target.value) : null)}
              aria-label="Somente uma obra específica"
            >
              <option value="">Todas as obras</option>
              {graphMedia.map((m) => (
                <option key={m.id} value={m.id}>
                  Somente: {m.name}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Tipo de evolução">
            {presentKinds.map((k) => {
              const info = EVOLUTION_KINDS[evoKindOf(k)];
              return (
                <Chip key={k} active={kinds.has(k)} color={info.color} onClick={() => toggle(kinds, setKinds, k)} title={info.description}>
                  {info.label}
                </Chip>
              );
            })}
            <button className="text-xs font-medium text-accent hover:underline" onClick={() => setKinds(new Set(Object.keys(EVOLUTION_KINDS).filter((k) => k !== "normal")))}>
              Só especiais
            </button>
          </FilterRow>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-[4px] border border-line p-0.5">
            <button className={cn("btn px-3 py-1.5", view === "tree" ? "bg-surface-2" : "")} onClick={() => setView("tree")}>
              <Network size={15} /> Árvore
            </button>
            <button className={cn("btn px-3 py-1.5", view === "list" ? "bg-surface-2" : "")} onClick={() => setView("list")}>
              <List size={15} /> Lista
            </button>
          </div>
          {view === "tree" && (
            <div className="flex items-center gap-1">
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))} aria-label="Diminuir zoom"><Minus size={15} /></button>
              <span className="w-12 text-center text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))} aria-label="Aumentar zoom"><Plus size={15} /></button>
              <button
                className="btn btn-ghost h-9 w-9 p-0"
                title="Ajustar à tela"
                aria-label="Ajustar à tela"
                onClick={() => {
                  const w = scrollRef.current?.clientWidth ?? 800;
                  setZoom(Math.max(0.4, Math.min(1, (w - 32) / layout.width)));
                }}
              >
                <Maximize2 size={15} />
              </button>
            </div>
          )}
          <button className="btn btn-ghost ml-auto py-1.5 text-xs" onClick={reset}>
            <RotateCcw size={14} /> Limpar filtros
          </button>
        </div>
        <p className="text-xs text-muted">
          {nodes.length} Digimon · {edges.length} conexões
          {hiddenCount > 0 && ` · ${hiddenCount} ocultos pelos filtros`}. Clique em um Digimon ou em uma seta para ver detalhes.
        </p>

        {view === "tree" ? (
          <div ref={scrollRef} className="card scrollbar-thin relative overflow-auto p-4" style={{ maxHeight: "75vh" }}>
            <div style={{ width: layout.width * zoom, height: layout.height * zoom }}>
              <div className="relative origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
                {layout.headers.map((h) => (
                  <div key={h.col} className="label absolute top-0 truncate text-center" style={{ left: h.x, width: NODE_W }}>
                    {h.label}
                  </div>
                ))}
                <svg className="absolute inset-0 overflow-visible" width={layout.width} height={layout.height}>
                  <defs>
                    {Object.entries(EVOLUTION_KINDS).map(([k, v]) => (
                      <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0 0 10 5 0 10z" fill={v.color} />
                      </marker>
                    ))}
                  </defs>
                  {edges.flatMap((e) =>
                    [e.from, ...e.partners].map((src, i) => {
                      const a = pos.get(src);
                      const b = pos.get(e.to);
                      if (!a || !b) return null;
                      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x - 2, y2 = b.y + NODE_H / 2;
                      const dx = Math.max(COL_GAP / 2, (x2 - x1) / 2);
                      const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
                      const info = EVOLUTION_KINDS[evoKindOf(e.kind)];
                      const dim = lineage && !lineage.edges.has(e.id);
                      const isSel = selected?.type === "edge" && selected.id === e.id;
                      const mx = (x1 + 3 * (x1 + dx) + 3 * (x2 - dx) + x2) / 8;
                      const my = (y1 + 3 * y1 + 3 * y2 + y2) / 8;
                      return (
                        <g key={`${e.id}-${i}`} className="cursor-pointer" onClick={() => setSelected({ type: "edge", id: e.id })} style={{ opacity: dim ? 0.15 : 1, transition: "opacity .2s" }}>
                          <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                          <path d={d} fill="none" stroke={info.color} strokeWidth={isSel ? 3.5 : 2} strokeDasharray={lineStyle(e.status)} markerEnd={`url(#arrow-${evoKindOf(e.kind)})`} opacity={e.kind === "normal" ? 0.8 : 1} />
                          {i === 0 && e.kind !== "normal" && (
                            <g transform={`translate(${mx},${my})`}>
                              <rect x={-24} y={-9} width={48} height={18} rx={9} fill="var(--surface)" stroke={info.color} />
                              <text textAnchor="middle" y={4} fontSize={10} fontWeight={700} fill={info.color}>{info.short}</text>
                            </g>
                          )}
                        </g>
                      );
                    }),
                  )}
                </svg>
                {layout.placed.map((n) => (
                  <TreeNode
                    key={n.id}
                    n={n}
                    x={n.x}
                    y={n.y}
                    root={n.id === graph.rootId}
                    selected={selected?.type === "node" && selected.id === n.id}
                    dim={!!lineage && !lineage.nodes.has(n.id)}
                    onClick={() => setSelected({ type: "node", id: n.id })}
                    onHover={(h) => setHover(h ? n.id : null)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EdgeList edges={edges} byId={byId} onSelect={(id) => setSelected({ type: "edge", id })} />
        )}
        <Legend />
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card fade-in p-4">
          {selNode ? (
            <NodeDetails n={selNode} root={selNode.id === graph.rootId} edges={edges} byId={byId} onEdge={(id) => setSelected({ type: "edge", id })} />
          ) : selEdge ? (
            <EdgeDetails e={selEdge} byId={byId} />
          ) : (
            <p className="text-sm text-muted">Selecione um Digimon ou uma conexão para ver os detalhes.</p>
          )}
          {selected && (
            <button className="mt-4 flex items-center gap-1 text-xs text-muted hover:text-fg" onClick={() => setSelected(null)}>
              <X size={12} /> Limpar seleção
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function TreeNode({ n, x, y, root, selected, dim, onClick, onHover }: { n: GNode; x: number; y: number; root: boolean; selected: boolean; dim: boolean; onClick: () => void; onHover: (h: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={() => (window.location.href = `/digimon/${n.slug}`)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "absolute flex items-center gap-2 rounded-[4px] border bg-surface p-1 pr-2 text-left transition-[border-color,opacity] duration-200 hover:border-fg/50",
        selected ? "outline outline-2 outline-offset-1 outline-primary" : "",
        root ? "border-primary" : "border-line",
      )}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H, opacity: dim ? 0.3 : 1 }}
      title={`${n.name} — ${n.stageName}. Duplo clique abre a página.`}
    >
      <DigimonAvatar name={n.name} imageUrl={n.imageUrl} className="h-[50px] w-[50px] shrink-0" />
      <span className="min-w-0">
        <span className="block truncate font-display text-[14px] font-semibold leading-tight">{n.name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: n.stageColor }} />
          <span className="truncate">{n.stageName}</span>
          {n.attrSlug && n.attrSlug !== "no-data" && <AttributeIcon slug={n.attrSlug} name={n.attrName ?? undefined} size={12} />}
        </span>
      </span>
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="label w-32 shrink-0">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, color, title, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 text-xs transition-colors",
        active ? "border-fg/50 bg-surface-2 text-fg" : "border-line text-muted line-through decoration-muted/50 hover:text-fg",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color, opacity: active ? 1 : 0.4 }} />}
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
      <span className="flex items-center gap-2"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="2" /></svg>Oficial / da mídia</span>
      <span className="flex items-center gap-2"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" /></svg>Não confirmada</span>
      <span className="flex items-center gap-2"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray="2 5" /></svg>Comunidade (não oficial)</span>
      <span>A cor da linha indica o tipo de evolução. Borda laranja = Digimon central.</span>
    </div>
  );
}

function MiniDigimon({ n }: { n?: GNode }) {
  if (!n) return null;
  return (
    <Link href={`/digimon/${n.slug}`} className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
      <DigimonAvatar name={n.name} imageUrl={n.imageUrl} color={n.stageColor} accent={n.attrColor} className="h-6 w-6" rounded="rounded-md" />
      {n.name}
    </Link>
  );
}

function SmallPill({ color, children, title }: { color: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border border-line py-[2px] pl-1.5 pr-1.5 font-mono text-[10px] uppercase leading-none tracking-wide text-fg/80">
      <span className="h-2.5 w-[3px] rounded-[1px]" style={{ background: color }} />
      {children}
    </span>
  );
}
function StatusPill(_props: { s: string }) {
  return null;
}
function KindPill({ k }: { k: string }) {
  const info = EVOLUTION_KINDS[evoKindOf(k)];
  return <SmallPill color={info.color} title={info.description}>{info.label}</SmallPill>;
}

function NodeDetails({ n, root, edges, byId, onEdge }: { n: GNode; root: boolean; edges: GEdge[]; byId: Map<number, GNode>; onEdge: (id: number) => void }) {
  const from = edges.filter((e) => e.to === n.id);
  const to = edges.filter((e) => e.from === n.id || e.partners.includes(n.id));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <DigimonAvatar name={n.name} imageUrl={n.imageUrl} color={n.stageColor} accent={n.attrColor} className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <div className="font-display text-lg font-bold leading-tight">{n.name}</div>
          {n.nameJp && <div className="text-xs text-muted">{n.nameJp}</div>}
          <div className="mt-1 text-xs text-muted">
            {n.stageName}
            {n.stageNameEn ? ` (${n.stageNameEn})` : ""}
            {n.attrName ? ` · ${n.attrName}` : ""}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/digimon/${n.slug}`} className="btn btn-primary flex-1">
          <ExternalLink size={15} /> Abrir página
        </Link>
        {!root && (
          <Link href={`/linhas/${n.slug}`} className="btn btn-ghost flex-1">
            <Focus size={15} /> Centralizar árvore
          </Link>
        )}
      </div>
      <EdgeGroup title="Evolui a partir de" edges={from} byId={byId} pick={(e) => [e.from, ...e.partners]} onEdge={onEdge} />
      <EdgeGroup title="Pode evoluir para" edges={to} byId={byId} pick={(e) => [e.to]} onEdge={onEdge} />
    </div>
  );
}

function EdgeGroup({ title, edges, byId, pick, onEdge }: { title: string; edges: GEdge[]; byId: Map<number, GNode>; pick: (e: GEdge) => number[]; onEdge: (id: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 label">{title}</div>
      {edges.length === 0 ? (
        <p className="text-xs italic text-muted">Nenhuma conexão visível com os filtros atuais.</p>
      ) : (
        <ul className="space-y-1">
          {edges.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-[4px] px-2 py-1.5 text-sm hover:bg-surface-2">
              <span className="font-medium">
                {pick(e).map((id, i) => {
                  const node = byId.get(id);
                  return (
                    <span key={id}>
                      {i > 0 && " + "}
                      {node ? <Link href={`/digimon/${node.slug}`} className="hover:text-primary hover:underline">{node.name}</Link> : null}
                    </span>
                  );
                })}
              </span>
              <button onClick={() => onEdge(e.id)} className="flex shrink-0 items-center gap-1 text-[11px] text-muted hover:text-fg" title="Ver detalhes desta evolução">
                {e.kind !== "normal" && <KindPill k={e.kind} />}
                {e.status !== "official" && <StatusPill s={e.status} />}
                <span className="underline-offset-2 hover:underline">detalhes</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EdgeDetails({ e, byId }: { e: GEdge; byId: Map<number, GNode> }) {
  const MEDIA_KIND_LABEL = (k: string) => MEDIA_KINDS[mediaKindOf(k)].label;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 label">Conexão evolutiva</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <MiniDigimon n={byId.get(e.from)} />
          {e.partners.map((p) => (
            <span key={p} className="flex items-center gap-2">
              <span className="text-muted">+</span>
              <MiniDigimon n={byId.get(p)} />
            </span>
          ))}
          <span className="text-muted">→</span>
          <MiniDigimon n={byId.get(e.to)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <KindPill k={e.kind} />
        <StatusPill s={e.status} />
      </div>
      {e.requirements && (
        <div>
          <div className="label">Requisitos gerais</div>
          <p className="text-sm">{e.requirements}</p>
        </div>
      )}
      {e.notes && <p className="rounded-[4px] bg-surface-2 p-2.5 text-sm">{e.notes}</p>}
      {e.contexts.length > 0 && <div>
        <div className="mb-1.5 label">Onde essa evolução aparece</div>
        {(
          <ul className="space-y-2">
            {e.contexts.map((c) => (
              <li key={c.mediaId} className="rounded-[4px] border border-line p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/universos/${c.mediaSlug}`} className="text-sm font-semibold hover:text-primary">{c.mediaName}</Link>
                  <span className="shrink-0 text-[11px] text-muted">{MEDIA_KIND_LABEL(c.mediaKind)}</span>
                </div>
                {c.requirements && (
                  <div className="mt-1 text-xs">
                    <span className="text-muted">Requisitos: </span>
                    {c.requirements}
                  </div>
                )}
                {c.notes && <div className="mt-1 text-xs text-muted">{c.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>}
    </div>
  );
}

function EdgeList({ edges, byId, onSelect }: { edges: GEdge[]; byId: Map<number, GNode>; onSelect: (id: number) => void }) {
  const sorted = [...edges].sort((a, b) => (byId.get(a.from)?.stageOrder ?? 0) - (byId.get(b.from)?.stageOrder ?? 0));
  return (
    <div className="card divide-y divide-line">
      {sorted.map((e) => (
        <button key={e.id} onClick={() => onSelect(e.id)} className="flex w-full flex-col gap-2 p-3 text-left hover:bg-surface-2 sm:flex-row sm:items-center">
          <span className="flex flex-1 flex-wrap items-center gap-1.5 text-sm">
            <b>{byId.get(e.from)?.name}</b>
            {e.partners.map((p) => <span key={p}>+ <b>{byId.get(p)?.name}</b></span>)}
            <span className="text-muted">→</span>
            <b>{byId.get(e.to)?.name}</b>
          </span>
          <span className="flex flex-wrap gap-1">
            <KindPill k={e.kind} />
            <StatusPill s={e.status} />
            {e.contexts.slice(0, 3).map((c) => (
              <span key={c.mediaId} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{c.mediaName}</span>
            ))}
            {e.contexts.length > 3 && <span className="text-[11px] text-muted">+{e.contexts.length - 3}</span>}
          </span>
        </button>
      ))}
      {!sorted.length && <p className="p-6 text-center text-sm text-muted">Nenhuma conexão com os filtros atuais.</p>}
    </div>
  );
}
