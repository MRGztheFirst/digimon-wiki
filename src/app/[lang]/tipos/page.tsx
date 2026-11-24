import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Container, PageHeader } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { TypeIndex } from "@/components/type-index";
import { TAXONOMIES, listTaxonomy } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t(TAXONOMIES.tipos.title) };
}

const TOP = 5;

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  const { t, num } = await getI18n();
  const [items, links] = await Promise.all([
    listTaxonomy("tipos"),
    db.digimonTypeLink.findMany({
      where: { digimon: { imageUrl: { not: null } } },
      select: { type: { select: { slug: true } }, digimon: { select: { id: true, name: true, imageUrl: true } } },
      orderBy: [{ digimon: { viewCount: "desc" } }, { digimon: { number: "asc" } }],
    }),
  ]);
  const byType = new Map<string, { id: number; name: string; imageUrl: string | null }[]>();
  for (const l of links) byType.set(l.type.slug, [...(byType.get(l.type.slug) ?? []), l.digimon]);
  const top = [...items].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, TOP);
  const max = Math.max(1, top[0]?.count ?? 1);

  return (
    <div>
      <PageHeader crumbs={[[null, t(TAXONOMIES.tipos.title)]]} eyebrow={t("Classificação")} title={t(TAXONOMIES.tipos.title)} subtitle={t(TAXONOMIES.tipos.intro)} />
      <Container className="py-10">
        <section aria-labelledby="mais-comuns">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 id="mais-comuns" className="font-display text-2xl font-semibold tracking-tight">{t("Os tipos mais comuns")}</h2>
            <span className="text-sm text-muted">{t("{n} tipos cadastrados", { n: items.length })}</span>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((ty, i) => {
              const big = i === 0;
              const lineup = (byType.get(ty.slug) ?? []).slice(0, big ? 8 : 3);
              return (
                <li key={ty.slug} className={cn("min-w-0", big && "sm:col-span-2 lg:row-span-2")}>
                  <Link href={`/tipos/${ty.slug}`} className="card group flex h-full flex-col overflow-hidden transition-colors hover:border-primary/70">
                    <div className={cn("plate relative grid items-end gap-1 overflow-hidden px-4 pt-7", big ? "grid-cols-4 pb-2" : "grid-cols-3")}>
                      {lineup.map((d, j) => (
                        <DigimonAvatar
                          key={d.id}
                          name={d.name}
                          imageUrl={d.imageUrl}
                          rounded="rounded-none"
                          className={cn(
                            "aspect-square w-full transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:transform-none",
                            j % 2 === 1 && "delay-75",
                          )}
                        />
                      ))}
                      <span className="absolute left-3 top-2.5 font-mono text-[11px] font-semibold tabular-nums text-black/45" aria-hidden="true">#{i + 1}</span>
                    </div>
                    <div className={cn("flex flex-1 flex-col", big ? "p-5 sm:p-6" : "p-4")}>
                      <h3 className={cn("truncate font-display font-semibold tracking-tight transition-colors group-hover:text-primary", big ? "text-3xl sm:text-4xl" : "text-lg")}>{ty.name}</h3>
                      {ty.subtitle && <div className="text-xs text-muted">{ty.subtitle}</div>}
                      {big && ty.description && <p className="mt-1.5 text-sm text-muted">{ty.description}</p>}
                      <div className="mt-auto flex items-end gap-3 pt-4">
                        <span className={cn("font-display font-semibold leading-none tabular-nums", big ? "text-5xl" : "text-3xl")}>{num(ty.count)}</span>
                        <span className="pb-0.5 text-xs text-muted">Digimon</span>
                      </div>
                      <span className="mt-3 block h-1 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full origin-left rounded-full bg-primary" style={{ width: `${(ty.count / max) * 100}%` }} />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="todos" className="mt-14">
          <h2 id="todos" className="mb-4 font-display text-2xl font-semibold tracking-tight">{t("Todos os tipos")}</h2>
          <TypeIndex items={items.map(({ slug, name, subtitle, description, count }) => {
            const face = byType.get(slug)?.[0];
            return { slug, name, subtitle, description, count, face: face ? { name: face.name, imageUrl: face.imageUrl } : null };
          })} />
        </section>
      </Container>
    </div>
  );
}
