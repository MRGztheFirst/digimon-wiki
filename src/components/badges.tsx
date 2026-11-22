import Link from "next/link";
import { EVOLUTION_KINDS, MEDIA_KINDS, REVIEW_STATUSES, STATUSES, evoKindOf, mediaKindOf, reviewOf, statusOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pill({ color, children, className, title, href }: { color?: string | null; children: React.ReactNode; className?: string; title?: string; href?: string }) {
  const cls = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border border-line bg-bg/60 py-[2px] pl-1.5 pr-2 font-mono text-[11px] uppercase leading-none tracking-wide text-fg/85",
    href && "transition-colors hover:border-fg/40 hover:text-fg",
    className,
  );
  const inner = (
    <>
      <span className="h-2.5 w-[3px] shrink-0 rounded-[1px]" style={{ background: color ?? "var(--muted)" }} />
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={cls} title={title}>{inner}</Link>
  ) : (
    <span className={cls} title={title}>{inner}</span>
  );
}

export function StatusBadge({ status, className, compact }: { status?: string | null; className?: string; compact?: boolean }) {
  const s = STATUSES[statusOf(status)];
  return (
    <Pill color={s.color} title={s.long} className={className}>
      {compact ? s.label.split(" ")[0] : s.label}
    </Pill>
  );
}

export function ReviewBadge({ status }: { status?: string | null }) {
  const s = REVIEW_STATUSES[reviewOf(status)];
  return <Pill color={s.color} title={s.long}>{s.label}</Pill>;
}

export function EvoKindBadge({ kind, className }: { kind?: string | null; className?: string }) {
  const k = EVOLUTION_KINDS[evoKindOf(kind)];
  return <Pill color={k.color} title={k.description} className={className}>{k.label}</Pill>;
}

export function MediaKindBadge({ kind }: { kind?: string | null }) {
  const k = MEDIA_KINDS[mediaKindOf(kind)];
  return <Pill color="var(--primary)">{k.label}</Pill>;
}

export function StageBadge({ stage, link = true }: { stage?: { name: string; slug: string; color: string } | null; link?: boolean }) {
  if (!stage) return <Pill>Sem estágio</Pill>;
  return <Pill color={stage.color} href={link ? `/estagios/${stage.slug}` : undefined}>{stage.name}</Pill>;
}

export function AttributeBadge({ attribute, link = true }: { attribute?: { name: string; slug: string; color: string } | null; link?: boolean }) {
  if (!attribute) return <Pill title="Atributo não documentado nesta wiki">Atributo n/d</Pill>;
  return <Pill color={attribute.color} href={link ? `/atributos/${attribute.slug}` : undefined}>{attribute.name.split(" (")[0]}</Pill>;
}
