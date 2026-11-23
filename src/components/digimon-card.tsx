import Link from "next/link";
import { DigimonAvatar } from "./digimon-avatar";
import { AttributeIcon } from "./icons";
import { padNumber, cn } from "@/lib/utils";
import type { CardDigimon } from "@/lib/queries";
import { getI18n } from "@/i18n/server";

export async function DigimonCard({ d, className, extra }: { d: CardDigimon; className?: string; extra?: React.ReactNode }) {
  const { t } = await getI18n();
  const attribute = d.attribute && t(d.attribute.name).split(" (")[0];
  return (
    <Link href={`/digimon/${d.slug}`} className={cn("group flex flex-col", className)}>
      <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} stripe className="aspect-square w-full transition-[filter] duration-200 group-hover:brightness-[0.96]" />
      <div className="flex flex-1 flex-col pt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-[15px] font-semibold leading-tight group-hover:text-primary">{d.name}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted">{padNumber(d.number)}</span>
        </div>
        {d.nameJp && <div className="truncate font-jp text-xs text-muted">{d.nameJp}</div>}
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-muted">
          {d.stage && <span>{t(d.stage.name)}</span>}
          {d.attribute && (
            <span className="flex items-center gap-1">
              <AttributeIcon slug={d.attribute.slug} name={attribute ?? undefined} size={13} />
              {attribute}
            </span>
          )}
        </div>
        {extra && <div className="mt-1">{extra}</div>}
      </div>
    </Link>
  );
}

export async function DigimonGrid({ items, empty }: { items: CardDigimon[]; empty?: string }) {
  const { t } = await getI18n();
  if (!items.length) return <EmptyState>{empty ?? t("Nenhum Digimon encontrado.")}</EmptyState>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((d) => (
        <DigimonCard key={d.id} d={d} />
      ))}
    </div>
  );
}

type ChipDigimon = Pick<CardDigimon, "slug" | "name" | "imageUrl"> & {
  stage?: { color: string } | null;
  attribute?: { color: string } | null;
};

export function DigimonChip({ d, size = "md", suffix }: { d: ChipDigimon; size?: "sm" | "md"; suffix?: React.ReactNode }) {
  return (
    <Link href={`/digimon/${d.slug}`} className="inline-flex items-center gap-2 rounded-[4px] border border-line bg-surface py-1 pl-1 pr-3 text-sm transition-colors hover:border-fg/40">
      <DigimonAvatar name={d.name} imageUrl={d.imageUrl} className={size === "sm" ? "h-7 w-7" : "h-9 w-9"} />
      <span className="font-medium">{d.name}</span>
      {suffix}
    </Link>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[4px] border border-dashed border-line p-8 text-center text-sm text-muted">{children}</div>;
}
