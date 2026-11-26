import { cn } from "@/lib/utils";

const ATTRIBUTES = new Set(["vaccine", "data", "virus", "free", "variable", "unknown", "no-data"]);
const FAMILIES = new Set([
  "nature-spirits", "deep-savers", "nightmare-soldiers", "wind-guardians", "metal-empire",
  "virus-busters", "dragons-roar", "jungle-troopers", "dark-area", "unknown",
]);

export const hasAttributeIcon = (slug?: string | null) => !!slug && ATTRIBUTES.has(slug);
export const hasFamilyIcon = (slug?: string | null) => !!slug && FAMILIES.has(slug);

export function AttributeIcon({ slug, name, size = 16, className }: { slug?: string | null; name?: string; size?: number; className?: string }) {
  if (!slug || !ATTRIBUTES.has(slug)) return null;
  return (
    <img
      src={`/icons/atributos/${slug}.png`}
      alt={name ?? slug}
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function FamilyIcon({ slug, name, size = 16, className }: { slug?: string | null; name?: string; size?: number; className?: string }) {
  if (!slug || !FAMILIES.has(slug)) return null;
  return (
    <img
      src={`/icons/familias/${slug}.png`}
      alt={name ?? slug}
      width={size}
      height={size}
      className={cn("inline-block shrink-0 rounded-[2px]", className)}
      style={{ width: size, height: size, imageRendering: size >= 48 ? "pixelated" : "auto" }}
    />
  );
}
