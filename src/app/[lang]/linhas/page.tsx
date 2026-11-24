import Link from "next/link";
import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { Container, PageHeader, Section } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { EvolutionKindGlyph } from "@/components/evolution-kind-glyph";
import { cn } from "@/lib/utils";
import { LinePicker } from "./line-picker";
import { EVOLUTION_KINDS, EVOLUTION_KIND_KEYS } from "@/lib/constants";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t("Linhas evolutivas") };
}

export default async function LinesIndex({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  const { t, td, num } = await getI18n();
  const [roots, kindCounts, specials] = await Promise.all([
    db.digimon.findMany({
      where: { stage: { slug: { in: ["novato", "hibrido"] } }, evolutionsFrom: { some: { imported: false } } },
      select: { ...cardSelect, _count: { select: { evolutionsFrom: true } } },
      orderBy: { number: "asc" },
    }),
    db.evolution.groupBy({ by: ["kind"], _count: { _all: true } }),
    db.evolution.findMany({
      where: { kind: { not: "normal" }, imported: false },
      include: { from: { select: cardSelect }, to: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } } },
      orderBy: { kind: "asc" },
    }),
  ]);
  const count = (k: string) => kindCounts.find((c) => c.kind === k)?._count._all ?? 0;
  const recorded = (n: number) => (n === 1 ? t("{n} registrada", { n: num(n) }) : t("{n} registradas", { n: num(n) }));

  return (
    <div>
      <PageHeader
        eyebrow={t("Explorador")}
        title={t("Linhas evolutivas")}
        subtitle={t("Escolha qualquer Digimon para ver sua árvore completa: evoluções anteriores, posteriores, ramificações, DNA, Armor, Spirit, Burst Mode, X-Antibody e outras formas especiais.")}
      >
        <div className="max-w-xl">
          <LinePicker />
        </div>
      </PageHeader>
      <Container className="space-y-12 py-10">
        <Section title={t("Comece por um Novato")} icon={<GitBranch size={20} />} description={t("Digimon de estágio Novato (e Híbridos de Frontier) que possuem evoluções cadastradas.")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {roots.map((d) => (
              <Link key={d.id} href={`/linhas/${d.slug}`} className="card group flex items-center gap-3 p-3 transition hover:border-fg/40">
                <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} accent={d.attribute?.color} className="h-12 w-12 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-semibold group-hover:text-primary">{d.name}</div>
                  <div className="text-xs text-muted">{t("{n} evoluções diretas", { n: d._count.evolutionsFrom })}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section title={t("Tipos de evolução")} description={t("Cada conexão da árvore tem um tipo. As especiais aparecem destacadas e coloridas.")}>
          <div className="grid gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-2">
            {EVOLUTION_KIND_KEYS.map((k) => {
              const info = EVOLUTION_KINDS[k];
              const n = count(k);
              return (
                <div key={k} className={cn("group flex items-center gap-4 bg-surface p-4", k === "normal" && "sm:col-span-2")}>
                  <span className="flex h-12 w-[4.5rem] shrink-0 items-center justify-center rounded-[6px] border border-line bg-bg">
                    <EvolutionKindGlyph kind={k} color={info.color} className="h-8 w-14" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-tight">{t(info.label)}</span>
                    <span className="mt-0.5 block text-sm text-muted">{t(info.description)}</span>
                    <span className={cn("mt-1.5 block font-mono text-xs tabular-nums sm:hidden", n ? "text-fg" : "text-muted")}>{recorded(n)}</span>
                  </span>
                  <span className={cn("hidden shrink-0 text-right font-mono text-xs tabular-nums sm:block", n ? "text-fg" : "text-muted")}>{recorded(n)}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title={t("Evoluções especiais registradas")} description={t("{n} conexões especiais, agrupadas por tipo. Clique em uma para abrir a árvore.", { n: num(specials.length) })}>
          <div className="space-y-10">
            {EVOLUTION_KIND_KEYS.filter((k) => k !== "normal").map((k) => {
              const list = specials.filter((e) => e.kind === k);
              if (!list.length) return null;
              const info = EVOLUTION_KINDS[k];
              return (
                <div key={k}>
                  <div className="reveal mb-3 flex items-center gap-3">
                    <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface">
                      <EvolutionKindGlyph kind={k} color={info.color} className="h-6 w-10" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{t(info.label)}</h3>
                    <span className="font-mono text-xs text-muted">{num(list.length)}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((e) => (
                      <div key={e.id} className="reveal">
                      <Link
                        href={`/linhas/${e.to.slug}`}
                        className="card group relative flex h-full flex-col gap-3 overflow-hidden p-4 transition-[border-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[var(--kind)] hover:shadow-[0_12px_28px_-12px_var(--kind)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        style={{ ["--kind" as string]: info.color }}
                      >
                        <span className="absolute inset-x-0 top-0 h-[3px] origin-left transition-[height] duration-300 group-hover:h-[5px]" style={{ background: info.color }} />
                        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25" style={{ background: info.color }} />
                        <span className="flex items-center gap-1.5">
                          <SpecialMon m={e.from} />
                          {e.partners.map((p) => (
                            <span key={p.digimon.id} className="flex items-center gap-1.5">
                              <span className="fuse-sign font-mono text-sm font-bold text-muted" style={{ ["--c" as string]: info.color }}>+</span>
                              <SpecialMon m={p.digimon} />
                            </span>
                          ))}
                          <span className="relative mx-1 flex h-3 min-w-6 flex-1 items-center" aria-hidden="true">
                            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 12">
                              <line x1="0" y1="6" x2="100" y2="6" stroke={info.color} strokeWidth="2" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
                              <line x1="0" y1="6" x2="100" y2="6" stroke={info.color} strokeWidth="2" vectorEffect="non-scaling-stroke" className="flow [animation-duration:1.6s] group-hover:[animation-duration:0.5s]" />
                            </svg>
                            <svg viewBox="0 0 10 12" className="absolute -right-1 h-3 w-2.5 transition-transform duration-300 group-hover:translate-x-1"><path d="M0 0 10 6 0 12z" fill={info.color} /></svg>
                          </span>
                          <SpecialMon m={e.to} big />
                        </span>
                        {e.requirements && (
                          <span className="self-start rounded-[4px] px-2 py-1 text-xs font-medium" style={{ background: `color-mix(in oklab, ${info.color} 14%, var(--surface))`, color: `color-mix(in oklab, ${info.color} 60%, var(--fg))` }}>
                            {td(e.requirements)}
                          </span>
                        )}
                      </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </Container>
    </div>
  );
}

function SpecialMon({ m, big }: { m: { name: string; imageUrl: string | null; stage: { color: string } | null }; big?: boolean }) {
  return (
    <span className={cn("flex shrink-0 flex-col items-center gap-1 transition-transform duration-300 ease-out motion-reduce:transition-none", big ? "w-[4.75rem] group-hover:-translate-y-0.5 group-hover:scale-110" : "w-16 group-hover:translate-x-1")}>
      <DigimonAvatar name={m.name} imageUrl={m.imageUrl} color={m.stage?.color} stripe className={big ? "h-[4.75rem] w-[4.75rem]" : "h-14 w-14"} />
      <span className={cn("w-full truncate text-center text-[11px] leading-tight", big ? "font-semibold text-fg group-hover:text-primary" : "text-muted")}>{m.name}</span>
    </span>
  );
}
