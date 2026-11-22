import Link from "next/link";
import { EVOLUTION_KINDS, MEDIA_KINDS, REVIEW_STATUSES, STATUSES, evoKindOf, mediaKindOf, reviewOf, statusOf } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AttributeIcon, FamilyIcon } from "./icons";

export function Pill({ color, children, className, title, href, icon }: { color?: string | null; children: React.ReactNode; className?: string; title?: string; href?: string; icon?: React.ReactNode }) {
  const cls = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-line bg-surface py-[3px] pl-1.5 pr-2 text-[12px] font-medium leading-none text-fg/90",
    href && "transition-colors hover:border-fg/40 hover:text-fg",
    className,
  );
  const inner = (
    <>
      {icon ?? <span className="h-2.5 w-[3px] shrink-0 rounded-[1px]" style={{ background: color ?? "var(--muted)" }} />}
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={cls} title={title}>{inner}</Link>
  ) : (
    <span className={cls} title={title}>{inner}</span>
  );
}

export function StatusBadge(_props: { status?: string | null; className?: string; compact?: boolean }) {
  return null;
}

export function ReviewBadge(_props: { status?: string | null }) {
  return null;
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
  const label = attribute.name.split(" (")[0];
  return (
    <Pill color={attribute.color} icon={<AttributeIcon slug={attribute.slug} name={label} size={15} className="-my-1 -ml-0.5" />} href={link ? `/atributos/${attribute.slug}` : undefined}>
      {label}
    </Pill>
  );
}

export function FamilyBadge({ family, link = true, suffix }: { family: { name: string; slug: string; color: string }; link?: boolean; suffix?: React.ReactNode }) {
  return (
    <Pill color={family.color} icon={<FamilyIcon slug={family.slug} name={family.name} size={15} className="-my-1 -ml-0.5" />} href={link ? `/familias/${family.slug}` : undefined}>
      {family.name}
      {suffix}
    </Pill>
  );
}
