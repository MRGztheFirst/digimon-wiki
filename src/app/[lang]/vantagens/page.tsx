import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader, Section } from "@/components/ui";
import { MatchupCycle, MatchupPair, NodeIcon, type MatchupNode } from "@/components/matchup-cycle";
import { getI18n, localeFromParams } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t("Vantagens em batalha") };
}

const ELEMENTS: Record<string, [label: string, color: string]> = {
  fire: ["Fogo", "#ef4444"],
  plant: ["Planta", "#22c55e"],
  water: ["Água", "#3b82f6"],
  electric: ["Elétrico", "#eab308"],
  wind: ["Vento", "#22d3ee"],
  earth: ["Terra", "#b45309"],
  light: ["Luz", "#e2e8f0"],
  dark: ["Trevas", "#a855f7"],
  neutral: ["Neutro", "#94a3b8"],
  ice: ["Gelo", "#7dd3fc"],
  steel: ["Aço", "#a1a1aa"],
  null: ["Nulo", "#64748b"],
};

const GAMES = {
  "cyber-sleuth": {
    name: "Cyber Sleuth & Hacker's Memory",
    media: ["digimon-story-cyber-sleuth", "digimon-story-hackers-memory"],
    neutral: ["free"],
    sources: [
      ["GameFAQs · Battle Mechanics", "https://gamefaqs.gamespot.com/ps4/207680-digimon-story-cyber-sleuth-hackers-memory/faqs/76546/battle-mechanics"],
      ["Steam · A Guide about types and elements", "https://steamcommunity.com/sharedfiles/filedetails/?id=1906641795"],
    ],
  },
  "time-stranger": {
    name: "Time Stranger",
    media: ["digimon-story-time-stranger"],
    neutral: ["free", "variable", "unknown", "no-data"],
    sources: [
      ["Game8 · Attributes and Elements Compatibility", "https://game8.co/games/Digimon-Story-Time-Stranger/archives/554912"],
      ["Grindosaur · Resistances", "https://www.grindosaur.com/en/games/digimon-story-time-stranger/resistances"],
    ],
  },
} as const;
type GameKey = keyof typeof GAMES;

const TS_ELEMENTS = ["fire", "water", "plant", "ice", "electric", "earth", "steel", "wind", "light", "dark", "null"];

export default async function MatchupsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ jogo?: string }> }) {
  await localeFromParams(params);
  const sp = await searchParams;
  const game: GameKey = sp.jogo === "time-stranger" ? "time-stranger" : "cyber-sleuth";
  const g = GAMES[game];
  const { t, ln, num } = await getI18n();
  const [attributes, media] = await Promise.all([
    db.attribute.findMany({ include: { _count: { select: { digimon: true } } } }),
    db.media.findMany({ where: { slug: { in: [...g.media] } }, select: { slug: true, name: true, nameJp: true } }),
  ]);

  const attr = (slug: string): MatchupNode => {
    const a = attributes.find((x) => x.slug === slug);
    return { key: slug, attr: slug, label: a ? ln(a).split(" (")[0] : slug, color: a?.color ?? "#94a3b8" };
  };
  const el = (key: string): MatchupNode => ({ key, label: t(ELEMENTS[key][0]), color: ELEMENTS[key][1] });
  const tint = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, var(--surface))`;

  return (
    <div>
      <PageHeader crumbs={[[null, t("Vantagens em batalha")]]} eyebrow={t("Mecânicas de batalha")} title={t("Vantagens em batalha")}
        subtitle={t("Quem vence quem nos jogos de Digimon. Cada jogo tem regras próprias: escolha um abaixo.")} />
      <Container className="space-y-14 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={t("Jogo")} className="inline-flex w-fit flex-wrap gap-1 rounded-[8px] border border-line bg-surface p-1">
            {(Object.keys(GAMES) as GameKey[]).map((k) => (
              <Link key={k} href={`/vantagens?jogo=${k}`} scroll={false} aria-current={k === game ? "page" : undefined}
                className={cn("rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors", k === game ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                {GAMES[k].name}
              </Link>
            ))}
          </nav>
          <p className="flex items-center gap-2 text-xs text-muted"><Info size={14} aria-hidden="true" />{t("Regras deste jogo, não da franquia inteira.")}</p>
        </div>

        <Section title={t("Atributos")} description={t("O ciclo clássico: cada atributo vence um e perde para outro.")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="card px-5 pb-6 pt-10">
              <MatchupCycle key={game} nodes={[attr("vaccine"), attr("virus"), attr("data")]} />
            </div>
            <aside className="card flex flex-col p-5">
              <h3 className="font-semibold">{t("Neutros")}</h3>
              <p className="mt-1 text-sm text-muted">{t("Não têm vantagem nem desvantagem de atributo.")}</p>
              <ul className="mt-4 space-y-2">
                {g.neutral.map((slug, i) => {
                  const n = attr(slug);
                  const count = attributes.find((a) => a.slug === slug)?._count.digimon ?? 0;
                  return (
                    <li key={`${game}-${slug}`} className="rise-in" style={{ animationDelay: `${i * 70}ms` }}>
                      <Link href={`/atributos/${slug}`} style={{ "--c": n.color } as React.CSSProperties}
                        className="group flex items-center gap-3 rounded-[6px] border border-line px-3 py-2 transition-colors hover:border-(--c)">
                        <NodeIcon node={n} size={22} />
                        <span className="flex-1 text-sm font-medium group-hover:text-primary">{n.label}</span>
                        <span className="font-mono text-xs text-muted">{num(count)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href="/atributos" className="mt-auto pt-5 text-sm font-medium text-accent hover:underline">{t("Ver todos os atributos")} →</Link>
            </aside>
          </div>
        </Section>

        {game === "cyber-sleuth" ? (
          <Section title={t("Elementos")} description={t("Dois ciclos de três, um par que se enfrenta e um elemento neutro.")}>
            <div className="grid gap-4 md:grid-cols-2">
              {([["fire", "plant", "water"], ["electric", "wind", "earth"]] as const).map((cycle) => (
                <div key={cycle[0]} className="card px-5 pb-6 pt-6">
                  <h3 className="label mb-6 text-center">{cycle.map((k) => t(ELEMENTS[k][0])).join(" · ")}</h3>
                  <MatchupCycle nodes={[el(cycle[0]), el(cycle[1]), el(cycle[2])]} />
                </div>
              ))}
              <div className="card px-5 pb-6 pt-6">
                <h3 className="label mb-6 text-center">{t("Luz")} · {t("Trevas")}</h3>
                <MatchupPair a={el("light")} b={el("dark")} caption={t("Luz e Trevas são fortes uma contra a outra.")} />
              </div>
              <div className="card flex flex-col items-center justify-center px-5 py-8 text-center">
                <h3 className="label mb-6">{t("Neutro")}</h3>
                <span className="pop-in flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: ELEMENTS.neutral[1], background: tint(ELEMENTS.neutral[1], 12) }}>
                  <NodeIcon node={el("neutral")} size={30} />
                </span>
                <p className="mt-6 max-w-xs text-sm text-muted">{t("Neutro não vence nem perde para nenhum elemento.")}</p>
              </div>
            </div>
          </Section>
        ) : (
          <Section title={t("Elementos")} description={t("Time Stranger tem 11 elementos, mas não um ciclo fixo entre eles.")}>
            <div className="card p-5 sm:p-6">
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                {t("Em Time Stranger, cada Digimon tem a própria tabela de resistências: dois Digimon do mesmo elemento podem reagir de forma diferente ao mesmo golpe. Por isso não existe uma roda de elementos como em Cyber Sleuth.")}
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {TS_ELEMENTS.map((k, i) => {
                  const n = el(k);
                  return (
                    <li key={k} className="rise-in flex items-center gap-2.5 rounded-[6px] border px-3 py-2.5"
                      style={{ animationDelay: `${i * 45}ms`, borderColor: `color-mix(in oklab, ${n.color} 45%, var(--line))`, background: tint(n.color, 8) }}>
                      <NodeIcon node={n} size={18} />
                      <span className="text-sm font-medium">{n.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>
        )}

        <footer className="space-y-2 border-t border-line pt-5 text-xs text-muted">
          <p>{t("Os multiplicadores de dano mudam entre versões e não são mostrados aqui.")}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t("Fontes:")}</span>
            {g.sources.map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-primary">{label}<ArrowUpRight size={12} aria-hidden="true" /></a>
            ))}
          </p>
          {media.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{t("Veja também:")}</span>
              {media.map((m) => <Link key={m.slug} href={`/universos/${m.slug}`} className="text-accent hover:underline">{ln(m)}</Link>)}
            </p>
          )}
        </footer>
      </Container>
    </div>
  );
}
