"use client";

import { useRouter } from "next/navigation";
import { SearchBox } from "./search-box";

export function DigimonPickerNav({ basePath, param, keep, placeholder, append }: { basePath: string; param: string; keep?: Record<string, string>; placeholder?: string; append?: string[] }) {
  const router = useRouter();
  return (
    <SearchBox
      compact
      placeholder={placeholder}
      onPick={(r) => {
        const qs = new URLSearchParams();
        Object.entries(keep ?? {}).forEach(([k, v]) => v && qs.set(k, v));
        qs.set(param, append ? [...append, r.slug].join(",") : r.slug);
        router.push(`${basePath}?${qs}`);
      }}
    />
  );
}
