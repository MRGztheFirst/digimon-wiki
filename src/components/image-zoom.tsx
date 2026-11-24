"use client";

import { useRef } from "react";
import { X, ZoomIn } from "lucide-react";
import { useI18n } from "@/i18n/client";

export function ImageZoom({ src, alt, children }: { src?: string | null; alt: string; children: React.ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  if (!src) return <>{children}</>;
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="group relative block w-full max-w-[22rem] cursor-zoom-in text-left"
        aria-label={t("Ampliar imagem")}
        title={t("Ampliar imagem")}
      >
        {children}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn size={16} />
        </span>
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative flex h-[100dvh] w-screen items-center justify-center p-4 sm:p-10" onClick={close}>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="plate max-h-full max-w-full cursor-default rounded-[8px] object-contain p-6 shadow-2xl [image-rendering:auto] sm:min-h-[60vh] sm:min-w-[60vh]"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t("Fechar")}
            title={t("Fechar")}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </dialog>
    </>
  );
}
