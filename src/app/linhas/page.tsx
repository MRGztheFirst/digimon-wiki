import Link from "next/link";
import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { Container, PageHeader, Section } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { EvoKindBadge } from "@/components/badges";
import { LinePicker } from "./line-picker";
import { EVOLUTION_KINDS, EVOLUTION_KIND_KEYS } from "@/lib/constants";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Linhas evolutivas") };
}

export default async function LinesIndex() {
  const { t, td } = await getI18n();
  const [roots, kindCounts, specials] = await Promise.all([
    db.digimon.findMany({
      where: { stage: { slug: { in: ["novato", "hibrido"] } }, evolutionsFrom: { some: { imported: false } } },
      select: { ...cardSelect, _count: { select: { evolutionsFrom: true } } },
      orderBy: { number: "asc" },
    }),
    db.evolution.groupBy({ by: ["kind"], _count: { _all: true } }),
    db.evolution.findMany({
      where: { kind: { not: "normal" }, imported: false },
      include: { from: { select: cardSelect }, to: { select: cardSelect }, partners: { include: { digimon: { select: { name: true } } } } },
      orderBy: { kind: "asc" },
    }),
  ]);
  const count = (k: string) => kindCounts.find((c) => c.kind === k)?._count._all ?? 0;

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVOLUTION_KIND_KEYS.map((k) => (
              <div key={k} className="card p-4" style={{ borderTop: `3px solid ${EVOLUTION_KINDS[k].color}` }}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t(EVOLUTION_KINDS[k].label)}</div>
                  <span className="text-xs text-muted">{t("{n} registradas", { n: count(k) })}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{t(EVOLUTION_KINDS[k].description)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("Evoluções especiais registradas")}>
          <div className="card divide-y divide-line">
            {specials.map((e) => (
              <Link key={e.id} href={`/linhas/${e.to.slug}`} className="flex flex-col gap-2 p-3 text-sm hover:bg-surface-2 sm:flex-row sm:items-center">
                <span className="flex-1">
                  <b>{e.from.name}</b>
                  {e.partners.map((p) => <span key={p.digimon.name}> + <b>{p.digimon.name}</b></span>)}
                  <span className="text-muted"> → </span>
                  <b>{e.to.name}</b>
                  {e.requirements && <span className="text-muted"> · {td(e.requirements)}</span>}
                </span>
                <EvoKindBadge kind={e.kind} />
              </Link>
            ))}
          </div>
        </Section>
      </Container>
    </div>
  );
}
