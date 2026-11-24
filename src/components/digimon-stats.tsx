import { Pill } from "@/components/badges";
import { cn } from "@/lib/utils";
import { ELEMENTS, GENERAL, STAT_GAMES, elementList, statScorer, type StatKey, type StatRow } from "@/lib/game-stats";
import { getI18n } from "@/i18n/server";

type Own = StatRow & { strong: string | null; weak: string | null };

const SIZE = 260;
const C = SIZE / 2;
const R = 96;

function point(i: number, r: number) {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}

const ring = (f: number) => GENERAL.stats.map((_, i) => point(i, R * f).join(",")).join(" ");

function Radar({ values, labels, title }: { values: (number | null)[]; labels: [string, string][]; title: string }) {
  const shape = values.map((v, i) => point(i, R * Math.max(0.04, (v ?? 0) / 100)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title} className="mx-auto w-full max-w-[18rem] overflow-visible">
      {[0.25, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} className="fill-none stroke-line" strokeWidth={1} />)}
      <polygon points={ring(0.5)} className="fill-none stroke-muted/50" strokeWidth={1} strokeDasharray="3 4" />
      {GENERAL.stats.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
      })}
      <polygon points={shape} className="fill-primary/20 stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, R * Math.max(0.04, (v ?? 0) / 100));
        return <circle key={i} cx={x} cy={y} r={3.5} className="fill-primary stroke-surface" strokeWidth={1.5} />;
      })}
      {labels.map(([abbr, full], i) => {
        const [x, y] = point(i, R + 16);
        const dx = x - C;
        const anchor = Math.abs(dx) < 1 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <text key={abbr} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted font-brand text-[12px] font-bold">
            <title>{full}</title>
            {abbr}
          </text>
        );
      })}
    </svg>
  );
}

export async function DigimonStats({ own, all }: { own: Own[]; all: StatRow[] }) {
  const { t, locale } = await getI18n();
  const scorer = statScorer(all);
  const games = STAT_GAMES.flatMap((g) => own.filter((s) => s.game === g.key).map((s) => ({ g, s })));
  const keys = [...GENERAL.stats.map(([k]) => k), ...(games.some(({ s }) => s.apt !== null) ? (["apt"] as StatKey[]) : [])];
  const rowLabel = (k: StatKey) => (GENERAL.stats.find(([x]) => x === k) ?? STAT_GAMES.flatMap((g) => g.stats).find(([x]) => x === k))!;
  const scores = GENERAL.stats.map(([k]) => scorer.score(own, k));
  const ranked = GENERAL.stats.map(([k, abbr, full], i) => ({ k, abbr, full, v: scores[i] })).filter((x) => x.v !== null) as { k: StatKey; abbr: string; full: string; v: number }[];
  const best = ranked.reduce<(typeof ranked)[number] | null>((a, b) => (!a || b.v > a.v ? b : a), null);
  const worst = ranked.reduce<(typeof ranked)[number] | null>((a, b) => (!a || b.v < a.v ? b : a), null);
  const hasElements = games.some(({ s }) => s.strong || s.weak);
  const from = new Intl.ListFormat(locale === "pt" ? "pt-BR" : locale, { type: "conjunction" }).format(games.map(({ g }) => g.short));
  const elements = (v: string | null) => {
    const list = elementList(v);
    return list.length ? (
      <div className="flex flex-wrap gap-1">{list.map((e) => <Pill key={e} color={ELEMENTS[e]?.[1]}>{t(ELEMENTS[e]?.[0] ?? e)}</Pill>)}</div>
    ) : <span className="text-muted/70">—</span>;
  };

  return (
    <div className="space-y-4">
      <div className="card grid items-center gap-x-8 gap-y-6 p-5 md:grid-cols-[18rem_1fr] md:p-6">
        <Radar values={scores} labels={GENERAL.stats.map(([, abbr, full]) => [abbr, t(full)])} title={t("Nota geral")} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-semibold">{t("Nota geral")}</h3>
            <span className="text-xs text-muted">{t("De 0 a 100 em relação a todos os Digimon com ficha. 50 é a média.")}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {GENERAL.stats.map(([k, abbr, full], i) => {
              const v = scores[i];
              const top = best && v !== null && best.k === k;
              const low = worst && worst !== best && v !== null && worst.k === k;
              return (
                <div key={k} className={cn("rounded-[6px] border px-3 py-2.5", top ? "border-primary/60 bg-primary/10" : "border-line bg-surface-2/30")}>
                  <dt className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-xs text-muted"><span className="mr-1.5 font-brand font-bold text-fg">{abbr}</span><span className={cn((top || low) && "hidden sm:inline")}>{t(full)}</span></span>
                    {(top || low) && <span className={cn("shrink-0 font-mono text-[10px] uppercase tracking-wider", top ? "text-primary" : "text-muted")}>{top ? t("Mais alto") : t("Mais baixo")}</span>}
                  </dt>
                  <dd className="mt-1.5">
                    <span className="font-mono text-xl font-medium tabular-nums">{v ?? "—"}</span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(3, v ?? 0)}%` }} />
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-4 text-xs text-muted">{t("Calculada com os dados de {games}.", { games: from })}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <caption className="sr-only">{t("Status base por jogo")}</caption>
            <thead>
              <tr className="border-b border-line bg-surface-2/40">
                <th scope="col" className="w-36 px-5 py-3 text-left"><span className="label">{t("Por jogo")}</span></th>
                {games.map(({ g }) => (
                  <th key={g.key} scope="col" title={g.name} translate="no" className="whitespace-nowrap px-4 py-3 text-left font-semibold last:pr-5">{g.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const [, abbr, full] = rowLabel(k);
                return (
                  <tr key={k} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="whitespace-nowrap px-5 py-2.5 text-left font-normal">
                      <span className="font-brand text-xs font-bold">{abbr}</span>
                      <span className="ml-2 text-xs text-muted">{t(full)}</span>
                    </th>
                    {games.map(({ g, s }) => {
                      const v = s[k];
                      const own = g.stats.find(([x]) => x === k);
                      const max = scorer.max(g.key, k);
                      return (
                        <td key={g.key} className="px-4 py-2.5 align-middle last:pr-5" title={own ? `${own[1]} · ${t(own[2])}` : undefined}>
                          {v === null || !own ? (
                            <span className="text-muted/70">—</span>
                          ) : (
                            <div className="flex min-w-32 items-center gap-3">
                              <span className="w-10 shrink-0 font-mono text-[13px] tabular-nums">{v}</span>
                              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                                <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? Math.max(3, (v / max) * 100) : 0}%` }} />
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {hasElements && (["strong", "weak"] as const).map((side) => (
                <tr key={side} className="border-t border-line bg-surface-2/20 first-of-type:border-t">
                  <th scope="row" className="px-5 py-2.5 text-left text-xs font-normal text-muted">{side === "strong" ? t("Forte") : t("Fraco")}</th>
                  {games.map(({ g, s }) => <td key={g.key} className="px-4 py-2.5 text-xs last:pr-5">{elements(s[side])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted">{t("Nas barras de cada jogo, a cheia é o maior valor daquele jogo.")} {t("Fontes: Wikimon e Tamerdex.")}</p>
    </div>
  );
}
