import { cn } from "@/lib/utils";

const S = 10;

function Node({ x, y, size = S, filled, faint, className }: { x: number; y: number; size?: number; filled?: boolean; faint?: boolean; className?: string }) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      rx={2.5}
      className={className}
      fill={filled ? "currentColor" : "var(--surface)"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={faint ? "2 2" : undefined}
      opacity={faint ? 0.45 : 1}
    />
  );
}

function Arrow({ d, dashed, kind }: { d: string; dashed?: boolean; kind: string }) {
  return <path d={d} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeDasharray={dashed ? "3 3" : undefined} markerEnd={`url(#glyph-head-${kind})`} />;
}

const pop = "origin-center transition-transform duration-300 ease-out [transform-box:fill-box] group-hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none";

export function EvolutionKindGlyph({ kind, color, className }: { kind: string; color: string; className?: string }) {
  const target = (x = 54, y = 20, extra?: React.ReactNode) => (
    <g className={pop}>
      <Node x={x} y={y} filled />
      {extra}
    </g>
  );
  let body: React.ReactNode;
  switch (kind) {
    case "dna":
      body = (
        <>
          <Node x={10} y={10} />
          <Node x={10} y={30} />
          <Arrow kind={kind} d="M16 10 C30 10 34 20 46 20" />
          <path d="M16 30 C30 30 34 20 44 20" fill="none" stroke="currentColor" strokeWidth={1.6} />
          {target()}
        </>
      );
      break;
    case "armor":
      body = (
        <>
          <Node x={10} y={20} />
          <ellipse cx={29} cy={20} rx={4.2} ry={5.6} fill="currentColor" opacity={0.85} />
          <path d="M16 20 H23" stroke="currentColor" strokeWidth={1.6} />
          <Arrow kind={kind} d="M35 20 H46" />
          {target()}
        </>
      );
      break;
    case "spirit":
      body = (
        <>
          <path d="M10 11 L15.5 20 L10 29 L4.5 20 Z" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M10 16 L12.5 20 L10 24 L7.5 20 Z" fill="currentColor" />
          <Arrow kind={kind} d="M19 20 H46" />
          {target()}
        </>
      );
      break;
    case "burst":
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 20 H44" />
          {target(
            54,
            20,
            <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
              <path d="M54 9 V12 M54 28 V31 M43.5 20 H45 M63 20 H64.5 M47 13 L48.8 14.8 M61 13 L59.2 14.8 M47 27 L48.8 25.2 M61 27 L59.2 25.2" />
            </g>,
          )}
        </>
      );
      break;
    case "x-antibody":
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 20 H46" />
          {target(54, 20, <path d="M50.5 16.5 L57.5 23.5 M57.5 16.5 L50.5 23.5" stroke="var(--surface)" strokeWidth={1.8} strokeLinecap="round" />)}
        </>
      );
      break;
    case "mode-change":
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 15 C27 7 37 7 47 15" />
          <Arrow kind={kind} d="M48 25 C37 33 27 33 17 25" />
          {target()}
        </>
      );
      break;
    case "biomerge":
      body = (
        <>
          <circle cx={10} cy={8.5} r={3} fill="none" stroke="currentColor" strokeWidth={1.6} />
          <path d="M4.5 18 C4.5 13.5 15.5 13.5 15.5 18" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          <Node x={10} y={29} size={9} />
          <Arrow kind={kind} d="M17 11 C30 11 34 20 46 20" />
          <path d="M16 29 C30 29 34 20 44 20" fill="none" stroke="currentColor" strokeWidth={1.6} />
          {target()}
        </>
      );
      break;
    case "dark":
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 20 C26 12 34 28 46 20" dashed />
          {target()}
        </>
      );
      break;
    case "warp":
      body = (
        <>
          <Node x={8} y={27} />
          <Node x={24} y={27} faint />
          <Node x={40} y={27} faint />
          <Arrow kind={kind} d="M10 20 C18 4 44 4 54 18" />
          {target(56, 27)}
        </>
      );
      break;
    case "special":
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 20 H44" />
          <g className={pop}>
            <path d="M54 12 L56.4 17.6 L62 20 L56.4 22.4 L54 28 L51.6 22.4 L46 20 L51.6 17.6 Z" fill="currentColor" />
          </g>
        </>
      );
      break;
    default:
      body = (
        <>
          <Node x={10} y={20} />
          <Arrow kind={kind} d="M16 20 H46" />
          {target()}
        </>
      );
  }
  return (
    <svg viewBox="0 0 66 40" aria-hidden="true" className={cn("overflow-visible", className)} style={{ color }}>
      <defs>
        <marker id={`glyph-head-${kind}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="currentColor" />
        </marker>
      </defs>
      {body}
    </svg>
  );
}
