import type { Metadata } from "next";
import { TaxonomyTermPage } from "@/components/taxonomy-pages";
import { getTaxonomyTerm, TAXONOMIES } from "@/lib/taxonomy";
import { getI18n } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t: tr } = await getI18n();
  const t = await getTaxonomyTerm("estagios", slug);
  return { title: t ? `${t.name} — ${tr(TAXONOMIES.estagios.singular)}` : tr(TAXONOMIES.estagios.title) };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pagina?: string }> }) {
  const { slug } = await params;
  const { pagina } = await searchParams;
  return <TaxonomyTermPage kind="estagios" slug={slug} page={Number(pagina) || 1} />;
}
