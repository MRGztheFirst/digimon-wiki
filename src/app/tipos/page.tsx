import type { Metadata } from "next";
import { TaxonomyIndexPage } from "@/components/taxonomy-pages";
import { TAXONOMIES } from "@/lib/taxonomy";

export const metadata: Metadata = { title: TAXONOMIES.tipos.title };

export default function Page() {
  return <TaxonomyIndexPage kind="tipos" />;
}
