"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

type Props = {
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  accent?: string | null;
  className?: string;
  rounded?: string;
  stripe?: boolean;
};

export function DigimonAvatar({ name, imageUrl, color, className, rounded, stripe }: Props) {
  const { t } = useI18n();
  const radius = rounded === "rounded-none" ? "rounded-none" : "rounded-[4px]";
  return (
    <div className={cn("plate relative overflow-hidden", radius, className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[6%]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" role="img" aria-label={t("{name} — sem imagem cadastrada", { name })}>
          <svg viewBox="0 0 32 32" className="h-1/3 w-1/3 opacity-20" aria-hidden="true">
            <path d="M16 1.5 28.6 8.75v14.5L16 30.5 3.4 23.25V8.75Z" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" />
            <text x="16" y="21.5" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827" fontFamily="IBM Plex Sans, sans-serif">?</text>
          </svg>
        </div>
      )}
      {stripe && color && <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: color }} />}
    </div>
  );
}
