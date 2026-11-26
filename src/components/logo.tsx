const D = ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."];
const PX = 2.6;
const OX = (32 - 5 * PX) / 2;
const OY = (32 - 7 * PX) / 2;

export function Logo({ size = 28, onBar = false }: { size?: number; onBar?: boolean }) {
  const shape = onBar ? "#ffffff" : "var(--primary)";
  const glyph = onBar ? "var(--bar)" : "var(--primary-fg)";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 1.5 28.6 8.75v14.5L16 30.5 3.4 23.25V8.75Z" fill={shape} stroke={shape} strokeWidth="2" strokeLinejoin="round" />
      <g shapeRendering="crispEdges">
        {D.flatMap((row, y) =>
          [...row].map((c, x) =>
            c === "X" ? <rect key={`${x}-${y}`} x={OX + x * PX} y={OY + y * PX} width={PX + 0.05} height={PX + 0.05} fill={glyph} /> : null,
          ),
        )}
      </g>
    </svg>
  );
}

export function Wordmark({ className, short = false }: { className?: string; short?: boolean }) {
  return (
    <span className={`whitespace-nowrap font-brand text-[19px] font-bold leading-none tracking-[-0.01em] ${className ?? ""}`}>
      Digimon<span className={`font-medium opacity-75${short ? " max-[359px]:hidden" : ""}`}> Database</span>
    </span>
  );
}
