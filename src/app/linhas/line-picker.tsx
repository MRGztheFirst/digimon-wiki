"use client";

import { useRouter } from "next/navigation";
import { SearchBox } from "@/components/search-box";

export function LinePicker() {
  const router = useRouter();
  return <SearchBox compact placeholder="Ver a linha evolutiva de..." onPick={(r) => router.push(`/linhas/${r.slug}`)} />;
}
