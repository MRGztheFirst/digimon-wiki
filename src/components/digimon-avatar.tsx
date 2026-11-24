"use client";

import Image from "next/image";
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
  sizes?: string;
  priority?: boolean;
};

const OPTIMIZED = ["https://digi-api.com/images/", "/images/"];

export function DigimonAvatar({ name, imageUrl, color, className, rounded, stripe, sizes = "64px", priority }: Props) {
  const { t } = useI18n();
  const radius = rounded === "rounded-none" ? "rounded-none" : "rounded-[4px]";
  const fixed = /^\d+px$/.test(sizes) ? parseInt(sizes, 10) : null;
  const dims = fixed ? { width: fixed, height: fixed } : { fill: true, sizes };
  return (
    <div className={cn("plate relative overflow-hidden", radius, className)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={name} {...dims} priority={priority} unoptimized={!OPTIMIZED.some((p) => imageUrl.startsWith(p))}
          className={cn("object-contain p-[6%]", fixed !== null && "absolute inset-0 h-full w-full")} />
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
