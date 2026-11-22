const EGG = [
  "..XXXX..",
  ".XXXXXX.",
  ".XX.XXX.",
  "XXXXX.XX",
  "XX.XXXXX",
  "XXXXXXXX",
  ".XXX.XX.",
  "..XXXX..",
];

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      {EGG.flatMap((row, y) =>
        [...row].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--primary)" /> : null)),
      )}
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-[17px] font-semibold uppercase leading-none tracking-[0.08em]">
      Digimon <span className="text-muted">Database</span>
    </span>
  );
}
