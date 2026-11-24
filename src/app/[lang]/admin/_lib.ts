import "server-only";
import { db } from "@/lib/db";
import { STATUSES } from "@/lib/constants";

export const statusOptions = Object.entries(STATUSES).map(([k, v]) => [k, v.label] as [string, string]);

export async function sourceOptions(): Promise<[number, string][]> {
  const s = await db.source.findMany({ orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, title: true } });
  return s.map((x) => [x.id, x.title]);
}

export async function mediaOptions(): Promise<[number, string][]> {
  const m = await db.media.findMany({ orderBy: [{ kind: "asc" }, { year: "asc" }], select: { id: true, name: true, kind: true } });
  return m.map((x) => [x.id, `${x.name}`]);
}

export type SP = Promise<Record<string, string | undefined>>;
