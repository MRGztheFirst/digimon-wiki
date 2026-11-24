"use client";

import { useI18n } from "@/i18n/client";

export default function Loading() {
  const { t } = useI18n();
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-14 z-50 h-[3px] overflow-hidden bg-bar/40">
        <div className="loading-bar h-full w-1/3 bg-primary" />
      </div>
      <span className="sr-only">{t("Carregando…")}</span>
      <div className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 md:px-6">
          <div className="h-3 w-40 animate-pulse rounded-[2px] bg-surface-2" />
          <div className="mt-5 h-10 w-2/3 max-w-xl animate-pulse rounded-[3px] bg-surface-2" />
          <div className="mt-4 h-4 w-1/2 max-w-lg animate-pulse rounded-[2px] bg-surface-2" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-7 px-4 py-12 sm:grid-cols-3 md:grid-cols-4 md:px-6 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-[4px] bg-surface-2" />
            <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded-[2px] bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded-[2px] bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
