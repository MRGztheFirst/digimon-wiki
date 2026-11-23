import Link from "next/link";
import type { Metadata } from "next";
import { Clapperboard, BookOpen, Egg, Gamepad2, Layers, Sparkles, Tv, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader, Section } from "@/components/ui";
import { MEDIA_KINDS, MEDIA_KIND_KEYS, mediaKindOf } from "@/lib/constants";
import { yearRange } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Digimon por Universo") };
}

const ICONS = { anime: Tv, movie: Clapperboard, manga: BookOpen, game: Gamepad2, vpet: Egg, card: Layers, other: Sparkles };

export default async function UniversesPage() {
  const { t, td, ln } = await getI18n();
  const media = await db.media.findMany({
    orderBy: [{ year: "asc" }],
    include: { _count: { select: { appearances: true, evolutionContexts: true, features: true } } },
  });
  return (
    <div>
      <PageHeader
        crumbs={[[null, t("Digimon por Universo")]]}
        eyebrow={t("Digimon por Universo")}
        title={t("Cada universo tem suas próprias regras")}
        subtitle={t("Evoluções, requisitos, estágios e até atributos podem mudar de um jogo ou mídia para outro. Aqui cada obra tem sua página — nada é tratado como regra universal.")}
      >
        <Link href="/universos/comparar" className="btn btn-primary"><Scale size={16} /> {t("Comparar um Digimon entre jogos")}</Link>
      </PageHeader>
      <Container className="space-y-12 py-10">
        {MEDIA_KIND_KEYS.map((k) => {
          const list = media.filter((m) => mediaKindOf(m.kind) === k);
          if (!list.length) return null;
          const Icon = ICONS[k];
          return (
            <Section key={k} title={t(MEDIA_KINDS[k].plural)} icon={<Icon size={20} />}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <Link key={m.id} href={`/universos/${m.slug}`} className="card group flex flex-col p-5 transition hover:border-fg/40" style={{ borderTop: `3px solid ${m.color}` }}>
                    <div className="font-display text-lg font-semibold leading-tight group-hover:text-primary">{ln(m)}</div>
                    <div className="mt-0.5 text-xs text-muted">{[yearRange(m.year, m.endYear), m.platform].filter(Boolean).join(" · ")}</div>
                    {m.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{td(m.description)}</p>}
                    <div className="mt-3 flex gap-3 text-xs text-muted">
                      <span>{m._count.appearances} Digimon</span>
                      <span>{t("{n} evoluções", { n: m._count.evolutionContexts })}</span>
                      <span>{t("{n} sistemas", { n: m._count.features })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          );
        })}
      </Container>
    </div>
  );
}
