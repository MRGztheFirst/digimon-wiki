import "server-only";
import { db } from "./db";

export const TAXONOMIES = {
  estagios: {
    title: "Estágios evolutivos",
    singular: "Estágio",
    filterKey: "estagio",
    intro: "Os níveis de evolução de um Digimon, do Digiovo ao Supremo. Nomes internacionais e japoneses aparecem como informação complementar. Estágios especiais (Armor e Híbrido) ficam fora da progressão comum.",
  },
  atributos: {
    title: "Atributos",
    singular: "Atributo",
    filterKey: "atributo",
    intro: "Os atributos classificam a natureza de cada Digimon como programa. Vantagens entre atributos são regras de cada jogo — consulte a página de cada universo.",
  },
  tipos: {
    title: "Tipos",
    singular: "Tipo",
    filterKey: "tipo",
    intro: "O tipo descreve a espécie ou natureza do Digimon (Dragon, Beast, Holy Knight...). Os nomes são mantidos em inglês, como nos perfis oficiais internacionais.",
  },
  familias: {
    title: "Famílias",
    singular: "Família",
    filterKey: "familia",
    intro: "As famílias (também chamadas de Fields) agrupam Digimon por afinidade. Um Digimon pode pertencer a várias famílias. Associações não verificadas aparecem sinalizadas.",
  },
  grupos: {
    title: "Grupos e organizações",
    singular: "Grupo",
    filterKey: "grupo",
    intro: "Grupos, ordens e organizações do universo Digimon — incluindo os lendários.",
  },
} as const;
export type TaxonomyKind = keyof typeof TAXONOMIES;

export type TaxItem = {
  slug: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  details?: string | null;
  color?: string | null;
  count: number;
  special?: boolean;
  legendary?: boolean;
};

export async function listTaxonomy(kind: TaxonomyKind): Promise<TaxItem[]> {
  switch (kind) {
    case "estagios":
      return (await db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } })).map((s) => ({
        slug: s.slug, name: s.name, subtitle: [s.nameEn, s.nameJp && `${s.nameJp} (${s.romaji})`].filter(Boolean).join(" · "),
        description: s.description, color: s.color, count: s._count.digimon, special: s.isSpecial,
      }));
    case "atributos":
      return (await db.attribute.findMany({ include: { _count: { select: { digimon: true } } } })).map((a) => ({
        slug: a.slug, name: a.name, subtitle: a.nameJp, description: a.description, details: a.details, color: a.color, count: a._count.digimon,
      }));
    case "tipos":
      return (await db.digimonType.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((t) => ({
        slug: t.slug, name: t.name, subtitle: t.nameJp, description: t.description, color: "#22d3ee", count: t._count.digimon,
      }));
    case "familias":
      return (await db.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((f) => ({
        slug: f.slug, name: f.name, subtitle: [f.abbr, f.nameJp].filter(Boolean).join(" · "), description: f.description, color: f.color, count: f._count.digimon,
      }));
    case "grupos":
      return (await db.group.findMany({ orderBy: [{ legendary: "desc" }, { name: "asc" }], include: { _count: { select: { members: true } } } })).map((g) => ({
        slug: g.slug, name: g.name, subtitle: g.nameJp, description: g.description, color: g.legendary ? "#facc15" : "#94a3b8", count: g._count.members, legendary: g.legendary,
      }));
  }
}

export async function getTaxonomyTerm(kind: TaxonomyKind, slug: string) {
  const all = await listTaxonomy(kind);
  return all.find((i) => i.slug === slug) ?? null;
}
