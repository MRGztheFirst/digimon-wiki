import type { Metadata } from "next";
import { TaxonomyIndexPage } from "@/components/taxonomy-pages";
import { TAXONOMIES } from "@/lib/taxonomy";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t(TAXONOMIES.grupos.title) };
}

export default function Page() {
  return <TaxonomyIndexPage kind="grupos" />;
}
