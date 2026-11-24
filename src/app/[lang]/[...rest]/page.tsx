import { notFound } from "next/navigation";
import { localeFromParams } from "@/i18n/server";

export function generateStaticParams() {
  return [];
}

export default async function CatchAll({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  notFound();
}
