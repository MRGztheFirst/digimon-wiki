import type { Metadata } from "next";
import { TaxonomyTermPage } from "@/components/taxonomy-pages";
import { getTaxonomyTerm, TAXONOMIES } from "@/lib/taxonomy";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await localeFromParams(params);
  const { t: tr } = await getI18n();
  const t = await getTaxonomyTerm("familias", slug);
  return { title: t ? `${t.name} — ${tr(TAXONOMIES.familias.singular)}` : tr(TAXONOMIES.familias.title) };
}

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ pagina?: string }> }) {
  const { slug } = await params;
  await localeFromParams(params);
  const { pagina } = await searchParams;
  return <TaxonomyTermPage kind="familias" slug={slug} page={Number(pagina) || 1} />;
}
