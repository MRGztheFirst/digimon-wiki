import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { TAXONOMIES } from "@/lib/taxonomy";
import { Container, PageHeader, Section } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t(TAXONOMIES.estagios.title) };
}

const ICONIC = [
  "botamon", "punimon", "yuramon", "koromon", "tsunomon", "tokomon", "pagumon", "agumon", "gabumon", "guilmon", "patamon", "renamon",
  "greymon", "garurumon", "growmon", "angemon", "tailmon", "metalgreymon", "weregarurumon", "megalogrowmon", "angewomon", "taomon",
  "wargreymon", "metalgarurumon", "dukemon", "omegamon", "sakuyamon", "seraphimon", "fladramon", "magnamon", "agnimon", "wolfmon",
];
const EXAMPLES = 5;
const STEP = 1.75;

type Face = { slug: string; name: string; imageUrl: string | null };

function Faces({ list }: { list: Face[] }) {
  if (!list.length) return null;
  return (
    <span className="flex items-center">
      {list.map((f, i) => (
        <span key={f.slug} title={f.name} className={`block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-surface ${i > 0 ? "-ml-2.5" : ""}`}>
          <DigimonAvatar name={f.name} imageUrl={f.imageUrl} rounded="rounded-none" className="h-full w-full" />
        </span>
      ))}
    </span>
  );
}

export default async function StagesPage() {
  const { locale, t, td, ln, num } = await getI18n();
  const stages = await db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } });
  const [iconic, fill] = await Promise.all([
    db.digimon.findMany({ where: { slug: { in: ICONIC }, imageUrl: { not: null } }, select: { slug: true, name: true, imageUrl: true, stageId: true } }),
    Promise.all(stages.map((s) => db.digimon.findMany({
      where: { stageId: s.id, imageUrl: { not: null } },
      orderBy: [{ viewCount: "desc" }, { number: "asc" }],
      select: { slug: true, name: true, imageUrl: true },
      take: EXAMPLES,
    }))),
  ]);

  const faces = (id: number, i: number) => {
    const picked = ICONIC.map((slug) => iconic.find((d) => d.slug === slug && d.stageId === id)).filter((d): d is NonNullable<typeof d> => !!d);
    const rest = fill[i].filter((d) => !picked.some((p) => p.slug === d.slug));
    return [...picked, ...rest].slice(0, EXAMPLES);
  };
  const subtitle = (s: (typeof stages)[number]) =>
    [s.nameEn, locale === "ja" ? s.romaji : s.nameJp && `${s.nameJp} (${s.romaji})`].filter(Boolean).join(" · ");

  const rows = stages.map((s, i) => ({ ...s, label: ln(s), sub: subtitle(s), desc: td(s.description), faces: faces(s.id, i), count: s._count.digimon }));
  const main = rows.filter((s) => !s.isSpecial);
  const special = rows.filter((s) => s.isSpecial);
  const max = Math.max(1, ...main.map((s) => s.count));

  return (
    <div>
      <PageHeader crumbs={[[null, t(TAXONOMIES.estagios.title)]]} eyebrow={t("Classificação")} title={t(TAXONOMIES.estagios.title)} subtitle={t(TAXONOMIES.estagios.intro)} />
      <Container className="space-y-14 py-10">
        <Section title={t("A escada evolutiva")} description={t("Cada degrau é um estágio, na ordem em que os Digimon evoluem.")}>
          <ol className="space-y-2.5" style={{ "--rise": `${(main.length - 1) * STEP}rem` } as React.CSSProperties}>
            {main.map((s, i) => (
              <li key={s.slug} className="lg:ml-(--step) lg:w-[calc(100%-var(--rise))]" style={{ "--step": `${i * STEP}rem`, "--c": s.color } as React.CSSProperties}>
                <Link href={`/estagios/${s.slug}`}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-[8px] border border-line bg-surface p-4 pl-5 transition-colors hover:border-(--c) sm:flex-row sm:items-center sm:gap-6 sm:p-5 sm:pl-6"
                  style={{ backgroundImage: `linear-gradient(90deg, ${s.color}1f, transparent 45%)` }}>
                  <span className="absolute inset-y-0 left-0 w-1" style={{ background: s.color }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="w-11 shrink-0 font-mono text-3xl font-semibold leading-none tabular-nums" style={{ color: s.color }}>{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-primary">{s.label}</h3>
                      {s.sub && <div className="mt-0.5 text-xs text-muted">{s.sub}</div>}
                      {s.desc && <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted">{s.desc}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-5 pl-15 sm:shrink-0 sm:pl-0">
                    <Faces list={s.faces} />
                    <div className="w-24">
                      <div className="font-mono text-lg font-semibold tabular-nums">{num(s.count)}</div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${(s.count / max) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" className="hidden shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Section>

        {special.length > 0 && (
          <Section title={t("Estágios especiais")} description={t("Fora da progressão padrão; dependem de mecânicas específicas (Digiovos, Espíritos...).")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {special.map((s) => (
                <Link key={s.slug} href={`/estagios/${s.slug}`} style={{ "--c": s.color } as React.CSSProperties}
                  className="card group relative flex flex-col overflow-hidden p-5 pt-6 transition-colors hover:border-(--c)">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">{s.label}</h3>
                      {s.sub && <div className="mt-0.5 text-xs text-muted">{s.sub}</div>}
                    </div>
                    <span className="font-mono text-lg font-semibold tabular-nums">{num(s.count)}</span>
                  </div>
                  {s.desc && <p className="mt-2 line-clamp-3 text-sm text-muted">{s.desc}</p>}
                  {s.faces.length > 0 && <div className="mt-auto pt-4"><Faces list={s.faces} /></div>}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </Container>
    </div>
  );
}
