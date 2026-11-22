import type { Metadata } from "next";
import { TaxonomyTermPage } from "@/components/taxonomy-pages";
import { getTaxonomyTerm, TAXONOMIES } from "@/lib/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTaxonomyTerm("familias", slug);
  return { title: t ? `${t.name} — ${TAXONOMIES.familias.singular}` : TAXONOMIES.familias.title };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pagina?: string }> }) {
  const { slug } = await params;
  const { pagina } = await searchParams;
  return <TaxonomyTermPage kind="familias" slug={slug} page={Number(pagina) || 1} />;
}
