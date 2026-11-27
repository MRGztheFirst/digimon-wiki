import type { Metadata } from "next";
import { TaxonomyIndexPage } from "@/components/taxonomy-pages";
import { TAXONOMIES } from "@/lib/taxonomy";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t(TAXONOMIES.anos.title) };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  return <TaxonomyIndexPage kind="anos" />;
}
