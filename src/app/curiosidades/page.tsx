import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CalendarClock, ChevronDown, ChevronUp, Clapperboard, Crown, Dna, Egg, Gamepad2, Layers, Lightbulb, Shapes, Sparkles, Tv, User, Users } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect, type CardDigimon } from "@/lib/queries";
import { Container, PageHeader, Section } from "@/components/ui";
import { EmptyState } from "@/components/digimon-card";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { EvoKindBadge, StatusBadge } from "@/components/badges";
import { EvolutionKindGlyph } from "@/components/evolution-kind-glyph";
import { EVOLUTION_KINDS, MEDIA_KINDS, mediaKindOf, type EvolutionKind } from "@/lib/constants";
import { cn, yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Curiosidades") };
}

const SPECIAL_KINDS = ["armor", "spirit", "burst", "x-antibody", "mode-change", "warp", "dark", "special"] as const;
const VARIANT_PREVIEW = 12;
const KIND_ICONS = { Tv, Clapperboard, BookOpen, Gamepad2, Egg, Layers, Sparkles };
const LEGENDARY = "#facc15";

function Face({ d, size, ring, glow, className }: { d: CardDigimon; size: string; ring?: string; glow?: string; className?: string }) {
  return (
    <Link href={`/digimon/${d.slug}`} title={d.name} className={cn("group/face flex min-w-0 flex-col items-center gap-1.5", className)}>
      <span className={cn("block shrink-0 overflow-hidden rounded-full ring-2 transition-transform duration-300 group-hover/face:-translate-y-1 group-hover/face:scale-105", glow && "glow-pulse", size)}
        style={{ ["--tw-ring-color" as string]: ring ?? "var(--surface)", ["--glow" as string]: glow }}>
        <DigimonAvatar name={d.name} imageUrl={d.imageUrl} rounded="rounded-none" className="h-full w-full" />
      </span>
      <span className="w-full truncate text-center text-xs font-medium transition-colors group-hover/face:text-primary">{d.name}</span>
    </Link>
  );
}

export default async function Curiosities() {
  const { t, td, ln, num } = await getI18n();
  const [trivia, fusions, specials, variants, groups, media, firsts] = await Promise.all([
    db.trivia.findMany({ include: { digimon: { select: cardSelect } }, orderBy: { digimon: { number: "asc" } } }),
    db.evolution.findMany({ where: { kind: { in: ["dna", "biomerge"] }, imported: false }, include: { from: { select: cardSelect }, to: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } } } }),
    db.evolution.findMany({ where: { kind: { in: [...SPECIAL_KINDS] }, imported: false }, include: { from: { select: cardSelect }, to: { select: cardSelect } } }),
    db.digimon.findMany({ where: { baseId: { not: null } }, select: { ...cardSelect, variantKind: true, base: { select: cardSelect } }, orderBy: { number: "asc" } }),
    db.group.findMany({ include: { members: { include: { digimon: { select: cardSelect } } } }, orderBy: [{ legendary: "desc" }, { name: "asc" }] }),
    db.media.findMany({ where: { year: { not: null } }, orderBy: { year: "asc" }, include: { _count: { select: { appearances: true } } } }),
    db.digimon.groupBy({ by: ["firstYear"], where: { firstYear: { not: null } }, _count: { _all: true } }),
  ]);
  const kinds = SPECIAL_KINDS.map((k) => [k, specials.filter((e) => e.kind === k)] as const).filter(([, list]) => list.length > 0);
  const years = [...new Set([...media.map((m) => m.year!), ...firsts.map((f) => f.firstYear!)])].sort((a, b) => a - b);

  const toc = [
    { id: "fatos", icon: Lightbulb, n: trivia.length, label: t("Curiosidades") },
    { id: "grupos", icon: Crown, n: groups.length, label: t("Grupos") },
    { id: "fusoes", icon: Dna, n: fusions.length, label: t("Fusões") },
    { id: "especiais", icon: Layers, n: specials.length, label: t("Evoluções especiais") },
    { id: "variantes", icon: Shapes, n: variants.length, label: t("Variantes") },
    { id: "cronologia", icon: CalendarClock, n: years.length, label: t("Anos na cronologia") },
  ];

  return (
    <div>
      <PageHeader crumbs={[[null, t("Curiosidades")]]} eyebrow={t("Descubra")} title={t("Curiosidades e informações adicionais")}
        subtitle={t("Fusões, variantes, grupos lendários e a cronologia das obras.")} />
      <Container className="space-y-16 py-10">
        <nav aria-label={t("Nesta página")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {toc.map(({ id, icon: Icon, n, label }, i) => (
            <a key={id} href={`#${id}`} className="rise-in group card flex flex-col gap-3 p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/60"
              style={{ animationDelay: `${i * 50}ms` }}>
              <Icon size={18} className="text-primary" aria-hidden="true" />
              <span>
                <span className="block font-mono text-2xl font-semibold leading-none tabular-nums">{num(n)}</span>
                <span className="mt-1 block text-xs text-muted group-hover:text-fg">{label}</span>
              </span>
            </a>
          ))}
        </nav>

        <Section id="fatos" title={t("Você sabia?")}>
          {trivia.length ? (
            <div className="gap-3 md:columns-2 lg:columns-3">
              {trivia.map((tr) => (
                <figure key={tr.id} className="reveal card mb-3 break-inside-avoid p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--c)"
                  style={{ "--c": tr.digimon.stage?.color ?? "var(--primary)" } as React.CSSProperties}>
                  <div className="flex items-start gap-3">
                    <Link href={`/digimon/${tr.digimon.slug}`} className="block h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 transition-transform duration-200 hover:scale-105"
                      style={{ ["--tw-ring-color" as string]: tr.digimon.stage?.color ?? "var(--line)" }}>
                      <DigimonAvatar name={tr.digimon.name} imageUrl={tr.digimon.imageUrl} rounded="rounded-none" className="h-full w-full" />
                    </Link>
                    <div className="min-w-0">
                      <figcaption className="flex flex-wrap items-center gap-2">
                        <Link href={`/digimon/${tr.digimon.slug}`} className="font-semibold hover:text-primary">{tr.digimon.name}</Link>
                        <StatusBadge status={tr.status} />
                      </figcaption>
                      <blockquote className="mt-1.5 text-sm leading-relaxed text-fg/85">{td(tr.text)}</blockquote>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          ) : <EmptyState>{t("Nenhuma curiosidade cadastrada.")}</EmptyState>}
        </Section>

        <Section id="grupos" title={t("Digimon lendários e grupos")}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const accent = g.legendary ? LEGENDARY : "var(--muted)";
              return (
                <div key={g.id} className="reveal card group/card relative flex flex-col overflow-hidden p-5 pt-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--c)"
                  style={{ "--c": accent } as React.CSSProperties}>
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden="true" />
                  {g.legendary && <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover/card:opacity-20" style={{ background: LEGENDARY }} aria-hidden="true" />}
                  <Link href={`/grupos/${g.slug}`} className="flex items-center gap-2 font-display text-lg font-semibold leading-tight hover:text-primary">
                    {g.legendary ? <Crown size={17} style={{ color: LEGENDARY }} aria-hidden="true" /> : <Users size={17} className="text-muted" aria-hidden="true" />}
                    {ln(g)}
                  </Link>
                  {g.nameJp && ln(g) !== g.nameJp && <div className="mt-0.5 font-jp text-xs text-muted">{g.nameJp}</div>}
                  {g.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{td(g.description)}</p>}
                  <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-1 gap-y-4">
                    {g.members.map((m) => (
                      <div key={m.digimonId} className="min-w-0" title={m.role ? `${m.digimon.name} · ${td(m.role)}` : m.digimon.name}>
                        <Face d={m.digimon} size="h-12 w-12" ring={g.legendary ? `color-mix(in oklab, ${LEGENDARY} 55%, var(--surface))` : undefined} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="fusoes" title={t("Fusões (DNA e Biomerge)")}>
          <div className="grid gap-3 lg:grid-cols-2">
            {fusions.map((e) => {
              const color = EVOLUTION_KINDS[e.kind as EvolutionKind]?.color ?? "var(--primary)";
              return (
                <div key={e.id} className="reveal card relative flex flex-wrap items-start justify-center gap-x-3 gap-y-4 overflow-hidden px-4 pb-5 pt-12 transition-[border-color] duration-300 hover:border-(--c)"
                  style={{ "--c": color } as React.CSSProperties}>
                  <span className="pointer-events-none absolute inset-x-0 -bottom-16 mx-auto h-32 w-2/3 rounded-full opacity-[0.08] blur-3xl" style={{ background: color }} aria-hidden="true" />
                  <span className="absolute left-4 top-3"><EvoKindBadge kind={e.kind} /></span>
                  <Face d={e.from} size="h-14 w-14" className="w-24" />
                  {e.partners.map((p) => (
                    <span key={p.digimonId} className="flex items-start gap-3">
                      <span className="fuse-sign mt-4 text-xl font-light text-muted">+</span>
                      <Face d={p.digimon} size="h-14 w-14" className="w-24" />
                    </span>
                  ))}
                  {e.kind === "biomerge" && (
                    <span className="flex items-start gap-3">
                      <span className="fuse-sign mt-4 text-xl font-light text-muted">+</span>
                      <span className="flex w-16 flex-col items-center gap-1.5">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-line text-muted"><User size={22} aria-hidden="true" /></span>
                        <span className="text-xs font-medium text-muted">Tamer</span>
                      </span>
                    </span>
                  )}
                  <span className="fuse-sign mt-4 text-xl font-light text-muted">=</span>
                  <Face d={e.to} size="h-20 w-20 -mt-3" ring={color} glow={color} className="w-28" />
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="especiais" title={t("Evoluções especiais")}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kinds.map(([k, list]) => {
              const info = EVOLUTION_KINDS[k as EvolutionKind];
              return (
                <div key={k} className="reveal card flex flex-col p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--c)" style={{ "--c": info.color } as React.CSSProperties}>
                  <div className="flex items-center gap-3">
                    <EvolutionKindGlyph kind={k} color={info.color} className="h-6 w-10 shrink-0" />
                    <span className="min-w-0 flex-1 font-semibold leading-tight">{t(info.label)}</span>
                    <span className="font-mono text-xs text-muted">{list.length}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{t(info.description)}</p>
                  <ul className="mt-3 space-y-1">
                    {list.map((e) => (
                      <li key={e.id}>
                        <Link href={`/linhas/${e.to.slug}`} title={e.requirements ? td(e.requirements) : undefined}
                          className="group flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-colors hover:bg-surface-2">
                          <span className="min-w-0 truncate text-muted">{e.from.name}</span>
                          <ArrowRight size={13} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" style={{ color: info.color }} />
                          <span className="min-w-0 truncate font-medium group-hover:text-primary">{e.to.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="variantes" title={t("Variantes e formas alternativas")}>
          <div className="group">
            {variants.length > VARIANT_PREVIEW + 2 && <input type="checkbox" id="variantes-mais" className="peer sr-only" />}
            <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {variants.map((v, i) => (
                <li key={v.id} className={variants.length > VARIANT_PREVIEW + 2 && i >= VARIANT_PREVIEW ? "hidden group-has-checked:block" : undefined}>
                  <Link href={`/digimon/${v.slug}`} className="group/row flex items-center gap-2 border-b border-line/70 px-1.5 py-2.5 text-sm transition-colors hover:bg-surface-2/60">
                    {v.base && <span className="min-w-0 truncate text-muted">{v.base.name}</span>}
                    <ArrowRight size={13} className="shrink-0 text-muted transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-primary" aria-hidden="true" />
                    <span className="min-w-0 truncate font-medium group-hover/row:text-primary">{v.name}</span>
                    {v.variantKind && <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{td(v.variantKind)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {variants.length > VARIANT_PREVIEW + 2 && (
              <>
                <label htmlFor="variantes-mais" className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-line py-2 text-sm font-medium text-muted transition-colors hover:border-primary/60 hover:text-primary peer-focus-visible:border-primary group-has-checked:hidden">
                  {t("Ver mais {n}", { n: variants.length - VARIANT_PREVIEW })}<ChevronDown size={15} aria-hidden="true" />
                </label>
                <label htmlFor="variantes-mais" className="mt-3 hidden cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-line py-2 text-sm font-medium text-muted transition-colors hover:border-primary/60 hover:text-primary peer-focus-visible:border-primary group-has-checked:flex">
                  {t("Ver menos")}<ChevronUp size={15} aria-hidden="true" />
                </label>
              </>
            )}
          </div>
        </Section>

        <Section id="cronologia" title={t("Cronologia de aparições")} description={t("Obras cadastradas por ano de lançamento e primeiras aparições documentadas.")}>
          <ol className="relative mx-auto max-w-5xl">
            <span className="absolute bottom-0 left-5 top-0 w-0.5 -translate-x-1/2 rounded-full md:left-1/2" aria-hidden="true"
              style={{ background: "linear-gradient(to bottom, var(--primary), color-mix(in oklab, var(--primary) 25%, var(--line)) 55%, transparent)" }} />
            {years.map((y, i) => {
              const ms = media.filter((m) => m.year === y);
              const debut = firsts.find((f) => f.firstYear === y)?._count._all ?? 0;
              const right = i % 2 === 1;
              const accent = ms[0]?.color ?? "var(--muted)";
              return (
                <li key={y} className="relative pb-12 pl-12 last:pb-0 md:grid md:grid-cols-2 md:gap-x-24 md:pl-0">
                  <span className="absolute left-5 top-0 z-10 -translate-x-1/2 md:left-1/2">
                    <span className="flex h-8 items-center rounded-full border-2 bg-bg px-3 font-mono text-sm font-bold tabular-nums shadow-[0_0_0_5px_var(--bg)]" style={{ borderColor: accent }}>{y}</span>
                  </span>
                  <div className={cn("flex flex-col gap-2.5 pt-11 md:pt-0", right ? "reveal-right md:col-start-2" : "reveal-left md:col-start-1 md:items-end md:text-right")}>
                    {ms.map((m) => {
                      const Icon = KIND_ICONS[MEDIA_KINDS[mediaKindOf(m.kind)].icon];
                      return (
                        <Link key={m.id} href={`/universos/${m.slug}`} style={{ "--c": m.color } as React.CSSProperties}
                          className="group/m card relative w-full overflow-hidden px-4 py-3.5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--c) md:max-w-md">
                          <span className={cn("absolute inset-y-0 left-0 w-1", !right && "md:left-auto md:right-0")} style={{ background: m.color }} aria-hidden="true" />
                          <span className="pointer-events-none absolute -top-12 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover/m:opacity-25"
                            style={{ background: m.color, [right ? "left" : "right"]: "-2rem" }} aria-hidden="true" />
                          <span className={cn("flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted", !right && "md:flex-row-reverse")}>
                            <Icon size={13} style={{ color: m.color }} aria-hidden="true" />
                            {t(MEDIA_KINDS[mediaKindOf(m.kind)].label)} · {yearRange(m.year, m.endYear)}
                          </span>
                          <span className="mt-1 block font-display text-lg font-semibold leading-tight transition-colors group-hover/m:text-primary">{ln(m)}</span>
                          <span className="mt-0.5 block text-xs text-muted">{m._count.appearances} Digimon</span>
                        </Link>
                      );
                    })}
                    {debut > 0 && (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                        <Sparkles size={12} className="text-primary" aria-hidden="true" />
                        {t("{n} estreias documentadas", { n: num(debut) })}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>
      </Container>
    </div>
  );
}
