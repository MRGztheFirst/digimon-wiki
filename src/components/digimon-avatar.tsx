import { cn } from "@/lib/utils";

type Props = {
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  accent?: string | null;
  className?: string;
  rounded?: string;
  stripe?: boolean;
};

const EGG = ["..XXXX..", ".XXXXXX.", ".XXXXXX.", "XXXXXXXX", "XXXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX.."];

export function DigimonAvatar({ name, imageUrl, color, className, rounded, stripe }: Props) {
  const radius = rounded === "rounded-none" ? "rounded-none" : "rounded-[4px]";
  return (
    <div className={cn("plate relative overflow-hidden", radius, className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[6%]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" role="img" aria-label={`${name} — sem imagem cadastrada`}>
          <svg viewBox="0 0 8 8" className="h-2/5 w-2/5 opacity-25" shapeRendering="crispEdges" aria-hidden="true">
            {EGG.flatMap((row, y) => [...row].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1d1b17" /> : null)))}
          </svg>
        </div>
      )}
      {stripe && color && <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: color }} />}
    </div>
  );
}
