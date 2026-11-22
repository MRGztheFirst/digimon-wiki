export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function padNumber(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

export function initials(name: string) {
  const caps = name.replace(/[^A-Za-z0-9]/g, " ").trim().split(/\s+/);
  if (caps.length > 1) return (caps[0][0] + caps[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function yearRange(start?: number | null, end?: number | null) {
  if (!start) return "";
  return end && end !== start ? `${start}–${end}` : String(start);
}

export function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function param(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}
export function paramList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
}
