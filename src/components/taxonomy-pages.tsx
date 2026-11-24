import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown } from "lucide-react";
import { TAXONOMIES, getTaxonomyTerm, listTaxonomy, type TaxonomyKind } from "@/lib/taxonomy";
import { searchDigimon } from "@/lib/search";
import { Container, PageHeader, Pagination, Section } from "./ui";
import { DigimonGrid } from "./digimon-card";
import { paragraphs } from "@/lib/utils";
import { db } from "@/lib/db";
import { StatusBadge } from "./badges";
import { AttributeIcon, FamilyIcon } from "./icons";
import { getI18n } from "@/i18n/server";

function TermIcon({ kind, slug, name, color, size }: { kind: TaxonomyKind; slug: string; name: string; color?: string | null; size: number }) {
  if (kind === "atributos" && slug !== "no-data") return <AttributeIcon slug={slug} name={name} size={size} />;
  if (kind === "familias") return <FamilyIcon slug={slug} name={name} size={size} />;
  return <span className="shrink-0 rounded-[2px]" style={{ width: Math.max(6, size / 4), height: size, background: color ?? "var(--muted)" }} />;
}

export async function TaxonomyIndexPage({ kind }: { kind: TaxonomyKind }) {
  const { t: tr } = await getI18n();
  const t = TAXONOMIES[kind];
  const items = await listTaxonomy(kind);
  const main = items.filter((i) => !i.special);
  const special = items.filter((i) => i.special);

  return (
    <div>
      <PageHeader crumbs={[[null, tr(t.title)]]} eyebrow={tr("Classificação")} title={tr(t.title)} subtitle={tr(t.intro)} />
      <Container className="space-y-10 py-10">
        <TermGrid items={main} kind={kind} />
        {special.length > 0 && (
          <Section title={tr("Estágios especiais")} description={tr("Fora da progressão padrão; dependem de mecânicas específicas (Digiovos, Espíritos...).")}>
            <TermGrid items={special} kind={kind} />
          </Section>
        )}
      </Container>
    </div>
  );
}

function TermGrid({ items, kind }: { items: Awaited<ReturnType<typeof listTaxonomy>>; kind: TaxonomyKind }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <Link key={i.slug} href={`/${kind}/${i.slug}`} className="card group flex flex-col p-5 transition hover:border-fg/40">
          <div className="flex items-start justify-between gap-3">
            <TermIcon kind={kind} slug={i.slug} name={i.name} color={i.color} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-display text-lg font-semibold group-hover:text-primary">
                {i.legendary && <Crown size={15} className="text-primary" />}
                {i.name}
              </div>
              {i.subtitle && <div className="text-xs text-muted">{i.subtitle}</div>}
            </div>
            <span className="font-mono text-xs text-muted">{i.count}</span>
          </div>
          {i.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{i.description}</p>}
        </Link>
      ))}
    </div>
  );
}

export async function TaxonomyTermPage({ kind, slug, page }: { kind: TaxonomyKind; slug: string; page: number }) {
  const { t: tr } = await getI18n();
  const t = TAXONOMIES[kind];
  const term = await getTaxonomyTerm(kind, slug);
  if (!term) notFound();
  const result = await searchDigimon({ [t.filterKey]: slug, pagina: page, ordem: "estagio" }, 36);
  const unconfirmedFamily =
    kind === "familias"
      ? await db.digimonFamily.count({ where: { family: { slug }, status: { not: "official" } } })
      : 0;
  const siblings = await listTaxonomy(kind);

  return (
    <div>
      <PageHeader crumbs={[[`/${kind}`, tr(t.title)], [null, term.name]]} eyebrow={tr(t.singular)} title={<span className="flex items-center gap-4"><TermIcon kind={kind} slug={term.slug} name={term.name} color={term.color} size={56} />{term.name}</span>} subtitle={term.subtitle} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-10">
          {(term.description || term.details) && (
            <div className="card prose-wiki p-5">
              {term.description && <p>{term.description}</p>}
              {paragraphs(term.details).map((p, i) => <p key={i} className="text-muted">{p}</p>)}
            </div>
          )}
          <Section title={`Digimon (${result.total})`} action={<Link href={`/digimon?${t.filterKey}=${slug}`} className="text-sm font-medium text-accent hover:underline">{tr("Refinar na busca avançada")} →</Link>}>
            <DigimonGrid items={result.items} empty={tr("Nenhum Digimon cadastrado nesta classificação ainda.")} />
            <Pagination page={result.page} total={result.total} pageSize={result.pageSize} makeHref={(p) => `/${kind}/${slug}?pagina=${p}`} />
          </Section>
        </div>
        <aside>
          <div className="card sticky top-20 p-4">
            <div className="label mb-2">{tr(t.title)}</div>
            <ul className="scroll-slim max-h-[70vh] space-y-0.5 overflow-auto">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${kind}/${s.slug}`} className={`flex items-center justify-between rounded-[4px] px-2 py-1.5 text-sm hover:bg-surface-2 ${s.slug === slug ? "bg-surface-2 font-semibold" : "text-muted"}`}>
                    <span className="flex items-center gap-2 truncate">
                      <TermIcon kind={kind} slug={s.slug} name={s.name} color={s.color} size={18} />
                      {s.name}
                    </span>
                    <span className="text-xs">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>
    </div>
  );
}
