import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Crown, Users } from "lucide-react";
import { TAXONOMIES, getTaxonomyTerm, listTaxonomy, type TaxonomyKind } from "@/lib/taxonomy";
import { searchDigimon } from "@/lib/search";
import { Container, PageHeader, Pagination, Section } from "./ui";
import { DigimonGrid } from "./digimon-card";
import { paragraphs } from "@/lib/utils";
import { db } from "@/lib/db";
import { StatusBadge } from "./badges";
import { AttributeIcon, FamilyIcon } from "./icons";
import { getI18n } from "@/i18n/server";
import { DigimonAvatar } from "./digimon-avatar";

type Mon = { slug: string; name: string; imageUrl: string | null };

async function previews(kind: TaxonomyKind): Promise<Map<string, Mon[]>> {
  const mon = { slug: true, name: true, imageUrl: true } as const;
  const take = 5;
  if (kind === "atributos") {
    const rows = await db.attribute.findMany({ select: { slug: true, digimon: { where: { imageUrl: { not: null } }, orderBy: [{ featured: "desc" }, { number: "asc" }], take, select: mon } } });
    return new Map(rows.map((r) => [r.slug, r.digimon]));
  }
  if (kind === "familias") {
    const rows = await db.family.findMany({ select: { slug: true, digimon: { where: { digimon: { imageUrl: { not: null } } }, orderBy: [{ digimon: { featured: "desc" } }, { digimon: { number: "asc" } }], take, select: { digimon: { select: mon } } } } });
    return new Map(rows.map((r) => [r.slug, r.digimon.map((x) => x.digimon)]));
  }
  if (kind === "grupos") {
    const rows = await db.group.findMany({ select: { slug: true, members: { where: { digimon: { imageUrl: { not: null } } }, orderBy: { digimon: { number: "asc" } }, take, select: { digimon: { select: mon } } } } });
    return new Map(rows.map((r) => [r.slug, r.members.map((x) => x.digimon)]));
  }
  if (kind === "anos") {
    const rows = await db.digimon.findMany({ where: { drbYear: { not: null }, imageUrl: { not: null } }, orderBy: [{ viewCount: "desc" }, { number: "asc" }], select: { ...mon, drbYear: true } });
    const map = new Map<string, Mon[]>();
    for (const { drbYear, ...m } of rows) {
      const list = map.get(String(drbYear)) ?? [];
      if (list.length < take) map.set(String(drbYear), [...list, m]);
    }
    return map;
  }
  return new Map();
}

function TermIcon({ kind, slug, name, color, size }: { kind: TaxonomyKind; slug: string; name: string; color?: string | null; size: number }) {
  if (kind === "atributos" && slug !== "no-data") return <AttributeIcon slug={slug} name={name} size={size} />;
  if (kind === "familias") return <FamilyIcon slug={slug} name={name} size={size} />;
  if (kind === "anos") return <CalendarDays size={size} strokeWidth={1.75} className="shrink-0 text-primary" aria-hidden="true" />;
  return <span className="shrink-0 rounded-[2px]" style={{ width: Math.max(6, size / 4), height: size, background: color ?? "var(--muted)" }} />;
}

export async function TaxonomyIndexPage({ kind }: { kind: TaxonomyKind }) {
  const { t: tr } = await getI18n();
  const t = TAXONOMIES[kind];
  const [items, mons] = await Promise.all([listTaxonomy(kind), previews(kind)]);
  const main = items.filter((i) => !i.special);
  const special = items.filter((i) => i.special);

  return (
    <div>
      <PageHeader crumbs={[[null, tr(t.title)]]} eyebrow={tr("Classificação")} title={tr(t.title)} subtitle={tr(t.intro)} />
      <Container className="space-y-10 py-10">
        <TermGrid items={main} kind={kind} mons={mons} />
        {special.length > 0 && (
          <Section title={tr("Estágios especiais")} description={tr("Fora da progressão padrão; dependem de mecânicas específicas (Digiovos, Espíritos...).")}>
            <TermGrid items={special} kind={kind} mons={mons} />
          </Section>
        )}
      </Container>
    </div>
  );
}

function TermGrid({ items, kind, mons }: { items: Awaited<ReturnType<typeof listTaxonomy>>; kind: TaxonomyKind; mons: Map<string, Mon[]> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        const c = i.color ?? "var(--muted)";
        const list = mons.get(i.slug) ?? [];
        return (
          <div key={i.slug} className="reveal min-w-0">
            <Link
              href={`/${kind}/${i.slug}`}
              className="card group relative flex h-full flex-col overflow-hidden transition-[border-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[var(--c)] hover:shadow-[0_16px_34px_-16px_var(--c)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{ ["--c" as string]: c }}
            >
              <span className="relative block h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${c} 30%, var(--surface)), color-mix(in oklab, ${c} 6%, var(--surface)) 70%)` }}>
                <span aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px]" style={{ color: c }} />
                <span aria-hidden="true" className="absolute -right-5 -top-6 rotate-12 opacity-25 transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:scale-110 motion-reduce:transition-none">
                  <Watermark kind={kind} slug={i.slug} name={i.name} color={c} legendary={i.legendary} />
                </span>
                <span className="absolute right-3 top-2.5 text-right leading-none">
                  <span className="block font-display text-2xl font-bold tabular-nums" style={{ color: `color-mix(in oklab, ${c} 55%, var(--fg))` }}>{i.count}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Digimon</span>
                </span>
                {list.length > 0 && (
                  <span className="absolute bottom-0 left-4 flex items-end">
                    {list.map((m, idx) => (
                      <span
                        key={m.slug}
                        className="-ml-4 first:ml-0 transition-[margin,transform] duration-500 ease-out group-hover:-ml-1.5 group-hover:first:ml-0 group-hover:-translate-y-1 motion-reduce:transition-none"
                        style={{ zIndex: list.length - idx, transitionDelay: `${idx * 40}ms` }}
                      >
                        <DigimonAvatar name={m.name} imageUrl={m.imageUrl} sizes="56px" className="h-14 w-14 rounded-b-none shadow-md ring-2 ring-surface" />
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col p-5 pt-4">
                <span className="flex items-center gap-3">
                  <span className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none">
                    <TermIcon kind={kind} slug={i.slug} name={i.name} color={i.color} size={kind === "grupos" ? 32 : 38} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-display text-lg font-semibold leading-tight transition-colors group-hover:text-[color-mix(in_oklab,var(--c)_65%,var(--fg))]">
                      {i.legendary && <Crown size={15} className="shrink-0" style={{ color: c }} />}
                      <span className="truncate">{i.name}</span>
                    </span>
                    {i.subtitle && <span className="block truncate text-xs text-muted">{i.subtitle}</span>}
                  </span>
                </span>
                {i.description && <span className="mt-3 line-clamp-3 text-sm text-muted">{i.description}</span>}
              </span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" style={{ background: c }} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function Watermark({ kind, slug, name, color, legendary }: { kind: TaxonomyKind; slug: string; name: string; color: string; legendary?: boolean }) {
  if (kind === "atributos" && slug !== "no-data") return <AttributeIcon slug={slug} name={name} size={120} />;
  if (kind === "familias") return <FamilyIcon slug={slug} name={name} size={120} />;
  if (kind === "anos") return <CalendarDays size={120} strokeWidth={1.5} style={{ color }} />;
  const Icon = legendary ? Crown : Users;
  return <Icon size={120} strokeWidth={1.5} style={{ color }} />;
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
