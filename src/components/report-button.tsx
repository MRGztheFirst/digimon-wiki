"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { useI18n } from "@/i18n/client";

const REPO_ISSUES = "https://github.com/MRGztheFirst/digimon-wiki/issues/new";

/** Bolinha fixa no canto inferior direito que abre uma issue no GitHub já com a página preenchida. */
export function ReportButton() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [href, setHref] = useState(REPO_ISSUES);

  useEffect(() => {
    const page = document.title.replace(/ · Digimon Database$/, "");
    const title = t("Correção: {page}", { page });
    const body = [
      `**${t("Página")}:** ${window.location.href}`,
      "",
      `**${t("O que está errado?")}**`,
      "",
      "",
      `**${t("Qual seria o certo? (se souber, mande a fonte)")}**`,
      "",
    ].join("\n");
    setHref(`${REPO_ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`);
  }, [pathname, t]);

  if (pathname.includes("/admin")) return null;
  const label = t("Encontrou algo errado? Avise a gente");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="group fixed bottom-4 right-4 z-40 flex h-12 flex-row-reverse items-center overflow-hidden rounded-full bg-primary text-primary-fg shadow-lg shadow-black/25 ring-1 ring-black/10 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:bottom-6 sm:right-6"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center">
        <MessageSquareWarning size={21} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity,padding] duration-300 group-hover:max-w-96 group-hover:pl-5 group-hover:opacity-100 group-focus-visible:max-w-96 group-focus-visible:pl-5 group-focus-visible:opacity-100">
        {label}
      </span>
    </a>
  );
}
