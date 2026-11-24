"use client";

import { useEffect, useId, useState } from "react";
import { Circle, CircleSlash, Cog, Droplet, Flame, Leaf, Moon, Mountain, Snowflake, Sun, Wind, Zap } from "lucide-react";
import { AttributeIcon } from "./icons";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type MatchupNode = { key: string; label: string; color: string; attr?: string };
type Point = readonly [number, number];

const ELEMENT_ICONS = { fire: Flame, water: Droplet, plant: Leaf, electric: Zap, wind: Wind, earth: Mountain, light: Sun, dark: Moon, neutral: Circle, ice: Snowflake, steel: Cog, null: CircleSlash };
const WIN = "#34d399";
const LOSE = "#fb7185";
const W = 400;
const H = 380;
const VERTICES: Point[] = [[200, 62], [336, 292], [64, 292]];
const CENTER: Point = [200, 215];

export function NodeIcon({ node, size }: { node: MatchupNode; size: number }) {
  if (node.attr) return <AttributeIcon slug={node.attr} name={node.label} size={size} />;
  const Icon = ELEMENT_ICONS[node.key as keyof typeof ELEMENT_ICONS] ?? Circle;
  return <Icon size={size} strokeWidth={2.2} aria-hidden="true" style={{ color: `color-mix(in oklab, ${node.color} 78%, var(--fg))` }} />;
}

function arc(a: Point, b: Point, bend: number, t0 = 0.25, t1 = 0.75) {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const ctrl = [mid[0] + (mid[0] - CENTER[0]) * bend, mid[1] + (mid[1] - CENTER[1]) * bend];
  const at = (u: number, v: number) => [0, 1].map((k) => (1 - u) * (1 - v) * a[k] + ((1 - u) * v + u * (1 - v)) * ctrl[k] + u * v * b[k]).map((n) => n.toFixed(1));
  const [s, q, e] = [at(t0, t0), at(t0, t1), at(t1, t1)];
  return `M${s[0]} ${s[1]} Q${q[0]} ${q[1]} ${e[0]} ${e[1]}`;
}

function Markers({ id, colors }: { id: string; colors: Record<string, string> }) {
  return (
    <defs>
      {Object.entries(colors).map(([k, c]) => (
        <marker key={k} id={`${id}-${k}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10 3 5z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

function Node({ node, at, active, delay, onEnter, onLeave }: {
  node: MatchupNode; at: Point; active: boolean; delay: number; onEnter: () => void; onLeave: () => void;
}) {
  return (
    <button type="button" onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave} onClick={onEnter}
      className="pop-in absolute w-[21%] -translate-x-1/2 -translate-y-1/2 outline-none"
      style={{ left: `${(at[0] / W) * 100}%`, top: `${(at[1] / H) * 100}%`, animationDelay: `${delay}ms` }}>
      <span className={cn("relative flex aspect-square items-center justify-center rounded-full border-2 transition-transform duration-300", active && "scale-110")}
        style={{ borderColor: node.color, background: `color-mix(in oklab, ${node.color} ${active ? 26 : 14}%, var(--surface))` }}>
        {active && <span className="absolute inset-0 rounded-full border-2 motion-safe:animate-ping" style={{ borderColor: node.color }} aria-hidden="true" />}
        <NodeIcon node={node} size={30} />
      </span>
      <span className={cn("absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-sm font-semibold transition-colors", active ? "text-fg" : "text-muted")}>{node.label}</span>
    </button>
  );
}

function useSpotlight(count: number) {
  const [hover, setHover] = useState<number | null>(null);
  const [auto, setAuto] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const start = setTimeout(() => setAuto(0), 900);
    const id = setInterval(() => setAuto((i = (i + 1) % count)), 2600);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [count, touched]);
  return {
    active: hover ?? (touched ? null : auto),
    enter: (i: number) => {
      setTouched(true);
      setHover(i);
    },
    leave: () => setHover(null),
  };
}

export function MatchupCycle({ nodes, className }: { nodes: [MatchupNode, MatchupNode, MatchupNode]; className?: string }) {
  const { t } = useI18n();
  const id = useId().replace(/:/g, "");
  const { active, enter, leave } = useSpotlight(3);
  const edgeColor = (from: number, to: number) => (active === null ? nodes[from].color : active === from ? WIN : active === to ? LOSE : "var(--line)");
  const markerOf = (from: number, to: number) => (active === null ? `n${from}` : active === from ? "win" : active === to ? "lose" : "dim");

  return (
    <div className={className}>
      <div className="relative mx-auto aspect-[400/380] w-full max-w-[22rem]">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <Markers id={id} colors={{ win: WIN, lose: LOSE, dim: "var(--line)", n0: nodes[0].color, n1: nodes[1].color, n2: nodes[2].color }} />
          {nodes.map((_, from) => {
            const to = (from + 1) % 3;
            const d = arc(VERTICES[from], VERTICES[to], 0.42);
            return (
              <g key={from}>
                <path d={d} fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" />
                <path d={d} fill="none" stroke={edgeColor(from, to)} strokeWidth="2.5" strokeLinecap="round" markerEnd={`url(#${id}-${markerOf(from, to)})`}
                  className="flow transition-[stroke] duration-300" style={{ opacity: active === null ? 0.85 : 1 }} />
              </g>
            );
          })}
        </svg>
        {nodes.map((n, i) => (
          <Node key={n.key} node={n} at={VERTICES[i]} active={active === i} delay={i * 120} onEnter={() => enter(i)} onLeave={leave} />
        ))}
      </div>
      <p className="mt-6 min-h-10 text-center text-sm text-muted" aria-live="polite">
        {active === null ? t("Passe o mouse ou toque em um item para ver contra quem ele vence.") : (
          <span key={active} className="fade-in">
            <strong className="text-fg">{nodes[active].label}</strong> {t("vence")} <strong style={{ color: WIN }}>{nodes[(active + 1) % 3].label}</strong>
            <span className="mx-2 text-line">·</span>
            {t("perde para")} <strong style={{ color: LOSE }}>{nodes[(active + 2) % 3].label}</strong>
          </span>
        )}
      </p>
    </div>
  );
}

export function MatchupPair({ a, b, caption, className }: { a: MatchupNode; b: MatchupNode; caption: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const left: Point = [80, 100];
  const right: Point = [320, 100];
  const curve = (from: Point, to: Point, lift: number) => {
    const ctrl = [(from[0] + to[0]) / 2, 100 + lift];
    const at = (u: number, v: number) => [0, 1].map((k) => (1 - u) * (1 - v) * from[k] + ((1 - u) * v + u * (1 - v)) * ctrl[k] + u * v * to[k]).map((n) => n.toFixed(1));
    const [s, q, e] = [at(0.2, 0.2), at(0.2, 0.8), at(0.8, 0.8)];
    return `M${s[0]} ${s[1]} Q${q[0]} ${q[1]} ${e[0]} ${e[1]}`;
  };
  return (
    <div className={className}>
      <div className="relative mx-auto aspect-[2/1] w-full max-w-[22rem]">
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <Markers id={id} colors={{ a: a.color, b: b.color }} />
          {([[left, right, -90, a.color, "a"], [right, left, 90, b.color, "b"]] as const).map(([from, to, lift, color, k]) => (
            <g key={k}>
              <path d={curve(from, to, lift)} fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" />
              <path d={curve(from, to, lift)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" markerEnd={`url(#${id}-${k})`} className="flow" />
            </g>
          ))}
        </svg>
        {([[a, left], [b, right]] as const).map(([n, at], i) => (
          <span key={n.key} className="pop-in absolute w-[21%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${(at[0] / 400) * 100}%`, top: "50%", animationDelay: `${i * 120}ms` }}>
            <span className="flex aspect-square items-center justify-center rounded-full border-2" style={{ borderColor: n.color, background: `color-mix(in oklab, ${n.color} 14%, var(--surface))` }}>
              <NodeIcon node={n} size={30} />
            </span>
            <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-sm font-semibold">{n.label}</span>
          </span>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">{caption}</p>
    </div>
  );
}
