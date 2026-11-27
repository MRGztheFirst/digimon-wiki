import "server-only";
import { db } from "./db";
import { getI18n } from "@/i18n/server";

export const TAXONOMIES = {
  estagios: {
    title: "Estágios evolutivos",
    singular: "Estágio",
    filterKey: "estagio",
    intro: "Os níveis de evolução de um Digimon, do Digiovo ao Mega. Nomes internacionais e japoneses aparecem como informação complementar. Estágios especiais (Armor, Híbrido e Supremo) ficam fora da progressão comum.",
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
  anos: {
    title: "Por ano",
    singular: "Ano no Reference Book",
    filterKey: "ano",
    intro: "Os Digimon separados pelo ano em que entraram no Digimon Reference Book, o catálogo oficial da Bandai. Os mais novos costumam aparecer primeiro no card game e nos V-Pets.",
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
  const { locale, t, td, ln } = await getI18n();
  const ja = locale === "ja";
  switch (kind) {
    case "estagios":
      return (await db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } })).map((s) => ({
        slug: s.slug, name: ln(s),
        subtitle: [s.nameEn, ja ? s.romaji : s.nameJp && `${s.nameJp} (${s.romaji})`].filter(Boolean).join(" · "),
        description: td(s.description), color: s.color, count: s._count.digimon, special: s.isSpecial,
      }));
    case "atributos":
      return (await db.attribute.findMany({ include: { _count: { select: { digimon: true } } } })).map((a) => ({
        slug: a.slug, name: ln(a), subtitle: ja ? a.name.split(" (")[0] : a.nameJp, description: td(a.description), details: td(a.details), color: a.color, count: a._count.digimon,
      }));
    case "tipos":
      return (await db.digimonType.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((ty) => ({
        slug: ty.slug, name: ln(ty), subtitle: ja ? null : ty.nameJp, description: td(ty.description), color: "#22d3ee", count: ty._count.digimon,
      }));
    case "familias":
      return (await db.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((f) => ({
        slug: f.slug, name: ln(f), subtitle: [f.abbr, ja ? f.name : f.nameJp].filter(Boolean).join(" · "), description: td(f.description), color: f.color, count: f._count.digimon,
      }));
    case "grupos":
      return (await db.group.findMany({ orderBy: [{ legendary: "desc" }, { name: "asc" }], include: { _count: { select: { members: true } } } })).map((g) => ({
        slug: g.slug, name: ln(g), subtitle: ja ? (g.nameJp ? t(g.name) === g.nameJp ? null : t(g.name) : null) : g.nameJp, description: td(g.description), color: g.legendary ? "#facc15" : "#94a3b8", count: g._count.members, legendary: g.legendary,
      }));
    case "anos": {
      const years = await db.digimon.groupBy({ by: ["drbYear"], where: { drbYear: { not: null } }, _count: { _all: true }, orderBy: { drbYear: "desc" } });
      const newest = years[0]?.drbYear;
      return years.map((y) => ({
        slug: String(y.drbYear), name: String(y.drbYear),
        subtitle: y.drbYear === newest ? t("Mais recentes") : null,
        color: "var(--primary)", count: y._count._all,
      }));
    }
  }
}

export async function getTaxonomyTerm(kind: TaxonomyKind, slug: string) {
  const all = await listTaxonomy(kind);
  return all.find((i) => i.slug === slug) ?? null;
}
