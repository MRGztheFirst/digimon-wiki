import Link from "next/link";
import { EVOLUTION_KINDS, MEDIA_KINDS, REVIEW_STATUSES, STATUSES, evoKindOf, mediaKindOf, reviewOf, statusOf } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AttributeIcon, FamilyIcon } from "./icons";
import { getI18n } from "@/i18n/server";

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

export async function EvoKindBadge({ kind, className }: { kind?: string | null; className?: string }) {
  const { t } = await getI18n();
  const k = EVOLUTION_KINDS[evoKindOf(kind)];
  return <Pill color={k.color} title={t(k.description)} className={className}>{t(k.label)}</Pill>;
}

export async function MediaKindBadge({ kind }: { kind?: string | null }) {
  const { t } = await getI18n();
  const k = MEDIA_KINDS[mediaKindOf(kind)];
  return <Pill color="var(--primary)">{t(k.label)}</Pill>;
}

export async function StageBadge({ stage, link = true }: { stage?: { name: string; slug: string; color: string } | null; link?: boolean }) {
  const { t } = await getI18n();
  if (!stage) return <Pill>{t("Sem estágio")}</Pill>;
  return <Pill color={stage.color} href={link ? `/estagios/${stage.slug}` : undefined}>{t(stage.name)}</Pill>;
}

export async function AttributeBadge({ attribute, link = true }: { attribute?: { name: string; slug: string; color: string } | null; link?: boolean }) {
  const { t } = await getI18n();
  if (!attribute) return <Pill title={t("Atributo não documentado nesta wiki")}>{t("Atributo n/d")}</Pill>;
  const label = t(attribute.name).split(" (")[0];
  return (
    <Pill color={attribute.color} icon={<AttributeIcon slug={attribute.slug} name={label} size={15} className="-my-1 -ml-0.5" />} href={link ? `/atributos/${attribute.slug}` : undefined}>
      {label}
    </Pill>
  );
}

export async function FamilyBadge({ family, link = true, suffix }: { family: { name: string; nameJp?: string | null; slug: string; color: string }; link?: boolean; suffix?: React.ReactNode }) {
  const { ln } = await getI18n();
  const name = ln(family);
  return (
    <Pill color={family.color} icon={<FamilyIcon slug={family.slug} name={name} size={15} className="-my-1 -ml-0.5" />} href={link ? `/familias/${family.slug}` : undefined}>
      {name}
      {suffix}
    </Pill>
  );
}
