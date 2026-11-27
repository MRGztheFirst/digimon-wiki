import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE = "https://www.digimondb.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [digimon, media, stages, attributes, types, families, groups, years] = await Promise.all([
    db.digimon.findMany({
      select: { slug: true, updatedAt: true, _count: { select: { evolutionsFrom: true, evolutionsTo: true } } },
      orderBy: { number: "asc" },
    }),
    db.media.findMany({ select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } }),
    db.stage.findMany({ select: { slug: true } }),
    db.attribute.findMany({ select: { slug: true } }),
    db.digimonType.findMany({ select: { slug: true } }),
    db.family.findMany({ select: { slug: true } }),
    db.group.findMany({ select: { slug: true } }),
    db.digimon.groupBy({ by: ["drbYear"], where: { drbYear: { not: null } } }),
  ]);

  const page = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    priority,
    ...(lastModified ? { lastModified } : {}),
  });

  return [
    page("", 1),
    ...["/digimon", "/linhas", "/universos"].map((p) => page(p, 0.9)),
    ...["/estagios", "/atributos", "/tipos", "/familias", "/grupos", "/anos", "/curiosidades", "/vantagens", "/comparar", "/universos/comparar", "/fontes"].map((p) => page(p, 0.6)),
    ...digimon.map((d) => page(`/digimon/${d.slug}`, 0.8, d.updatedAt)),
    ...digimon.filter((d) => d._count.evolutionsFrom + d._count.evolutionsTo > 0).map((d) => page(`/linhas/${d.slug}`, 0.7, d.updatedAt)),
    ...media.map((m) => page(`/universos/${m.slug}`, 0.7, m.updatedAt)),
    ...stages.map((s) => page(`/estagios/${s.slug}`, 0.5)),
    ...attributes.map((s) => page(`/atributos/${s.slug}`, 0.5)),
    ...types.map((s) => page(`/tipos/${s.slug}`, 0.5)),
    ...families.map((s) => page(`/familias/${s.slug}`, 0.5)),
    ...groups.map((s) => page(`/grupos/${s.slug}`, 0.5)),
    ...years.map((y) => page(`/anos/${y.drbYear}`, 0.5)),
  ];
}
