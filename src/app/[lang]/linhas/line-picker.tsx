"use client";

import { useRouter } from "next/navigation";
import { SearchBox } from "@/components/search-box";
import { useI18n } from "@/i18n/client";

export function LinePicker() {
  const router = useRouter();
  const { t } = useI18n();
  return <SearchBox compact placeholder={t("Ver a linha evolutiva de...")} onPick={(r) => router.push(`/linhas/${r.slug}`)} />;
}
