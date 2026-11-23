import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, Crown, Dna, Layers, Lightbulb, Shapes, Users } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { Container, PageHeader, Section } from "@/components/ui";
import { DigimonChip, EmptyState } from "@/components/digimon-card";
import { EvoKindBadge, StatusBadge } from "@/components/badges";
import { MEDIA_KINDS, mediaKindOf } from "@/lib/constants";
import { yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Curiosidades") };
}

export default async function Curiosities() {
  const { t, td, ln } = await getI18n();
  const [trivia, fusions, specials, variants, groups, media, firsts] = await Promise.all([
    db.trivia.findMany({ include: { digimon: { select: cardSelect } }, orderBy: { digimon: { number: "asc" } } }),
    db.evolution.findMany({ where: { kind: { in: ["dna", "biomerge"] }, imported: false }, include: { from: { select: cardSelect }, to: { select: cardSelect }, partners: { include: { digimon: { select: cardSelect } } } } }),
    db.evolution.findMany({ where: { kind: { in: ["armor", "spirit", "burst", "x-antibody", "mode-change", "warp", "dark", "special"] }, imported: false }, include: { from: { select: cardSelect }, to: { select: cardSelect } }, orderBy: { kind: "asc" } }),
    db.digimon.findMany({ where: { baseId: { not: null } }, select: { ...cardSelect, variantKind: true, base: { select: cardSelect } } }),
    db.group.findMany({ include: { members: { include: { digimon: { select: cardSelect } } } }, orderBy: [{ legendary: "desc" }, { name: "asc" }] }),
    db.media.findMany({ where: { year: { not: null } }, orderBy: { year: "asc" }, include: { _count: { select: { appearances: true } } } }),
    db.digimon.findMany({ where: { firstYear: { not: null } }, select: { ...cardSelect, firstYear: true, firstAppearance: true }, orderBy: [{ firstYear: "asc" }, { number: "asc" }] }),
  ]);
  const legendary = groups.filter((g) => g.legendary);
  const others = groups.filter((g) => !g.legendary);
  const years = [...new Set(media.map((m) => m.year!))];

  return (
    <div>
      <PageHeader crumbs={[[null, t("Curiosidades")]]} eyebrow={t("Descubra")} title={t("Curiosidades e informações adicionais")}
        subtitle={t("Fusões, variantes, grupos lendários e a cronologia das obras.")} />
      <Container className="space-y-14 py-10">
        <Section title={t("Curiosidades")} icon={<Lightbulb size={20} />}>
          {trivia.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {trivia.map((tr) => (
                <div key={tr.id} className="card flex flex-col gap-3 p-4">
                  <p className="text-sm">{td(tr.text)}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                    <DigimonChip d={tr.digimon} size="sm" />
                    <StatusBadge status={tr.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState>{t("Nenhuma curiosidade cadastrada.")}</EmptyState>}
        </Section>

        <Section title={t("Digimon lendários e grupos")} icon={<Crown size={20} />}>
          <div className="grid gap-3 md:grid-cols-2">
            {[...legendary, ...others].map((g) => (
              <div key={g.id} className="card p-4">
                <Link href={`/grupos/${g.slug}`} className="flex items-center gap-2 font-display text-lg font-semibold hover:text-primary">
                  {g.legendary ? <Crown size={16} className="text-yellow-400" /> : <Users size={16} className="text-muted" />}{ln(g)}
                </Link>
                {g.nameJp && ln(g) !== g.nameJp && <div className="text-xs text-muted">{g.nameJp}</div>}
                {g.description && <p className="mt-1 text-sm text-muted">{td(g.description)}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.members.map((m) => <DigimonChip key={m.digimonId} d={m.digimon} size="sm" suffix={m.role && <span className="text-[11px] text-muted">{td(m.role)}</span>} />)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("Fusões (DNA e Biomerge)")} icon={<Dna size={20} />}>
          <div className="card divide-y divide-line">
            {fusions.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <DigimonChip d={e.from} size="sm" />
                  {e.partners.map((p) => <span key={p.digimonId} className="flex items-center gap-2"><span className="text-muted">+</span><DigimonChip d={p.digimon} size="sm" /></span>)}
                  {e.kind === "biomerge" && <span className="text-xs text-muted">+ Tamer</span>}
                  <span className="text-muted">=</span>
                  <DigimonChip d={e.to} size="sm" />
                </div>
                <EvoKindBadge kind={e.kind} />
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-14 lg:grid-cols-2">
          <Section title={t("Evoluções especiais")} icon={<Layers size={20} />}>
            <div className="card divide-y divide-line">
              {specials.map((e) => (
                <Link key={e.id} href={`/linhas/${e.to.slug}`} className="flex items-center justify-between gap-2 p-3 text-sm hover:bg-surface-2">
                  <span>{e.from.name} <span className="text-muted">→</span> <b>{e.to.name}</b>{e.requirements && <span className="text-muted"> · {td(e.requirements)}</span>}</span>
                  <EvoKindBadge kind={e.kind} />
                </Link>
              ))}
            </div>
          </Section>
          <Section title={t("Variantes e formas alternativas")} icon={<Shapes size={20} />}>
            <div className="card divide-y divide-line">
              {variants.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  {v.base && <DigimonChip d={v.base} size="sm" />}
                  <span className="text-muted">→</span>
                  <DigimonChip d={v} size="sm" />
                  <span className="ml-auto text-xs text-muted">{td(v.variantKind)}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title={t("Cronologia de aparições")} icon={<CalendarClock size={20} />} description={t("Obras cadastradas por ano de lançamento e primeiras aparições documentadas.")}>
          <ol className="relative space-y-6 border-l-2 border-line pl-6">
            {years.map((y) => {
              const ms = media.filter((m) => m.year === y);
              const debut = firsts.filter((f) => f.firstYear === y);
              return (
                <li key={y} className="relative">
                  <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-bg bg-primary" />
                  <div className="font-display text-xl font-bold">{y}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ms.map((m) => (
                      <Link key={m.id} href={`/universos/${m.slug}`} className="card px-3 py-1.5 text-sm hover:border-fg/40" style={{ borderLeft: `3px solid ${m.color}` }}>
                        <b>{ln(m)}</b> <span className="text-xs text-muted">{t(MEDIA_KINDS[mediaKindOf(m.kind)].label)} · {yearRange(m.year, m.endYear)} · {m._count.appearances} Digimon</span>
                      </Link>
                    ))}
                  </div>
                  {debut.length > 0 && (
                    <div className="mt-2 text-xs text-muted">
                      {t("Estreias documentadas:")} {debut.slice(0, 24).map((f, i) => <span key={f.id}>{i > 0 && ", "}<Link href={`/digimon/${f.slug}`} className="text-accent hover:underline">{f.name}</Link></span>)}{debut.length > 24 && t(" e mais {n}", { n: debut.length - 24 })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Section>
      </Container>
    </div>
  );
}
