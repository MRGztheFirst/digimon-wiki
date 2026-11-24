import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { cardSelect } from "./queries";
import { PAGE_SIZE } from "./constants";

export type SearchFilters = {
  q?: string;
  estagio?: string;
  atributo?: string;
  tipo?: string;
  familia?: string;
  jogo?: string;
  anime?: string;
  midia?: string;
  habilidade?: string;
  de?: string;
  para?: string;
  grupo?: string;
  ordem?: string;
  pagina?: number;
};

export const FILTER_KEYS = ["q", "estagio", "atributo", "tipo", "familia", "jogo", "anime", "midia", "habilidade", "de", "para", "grupo", "ordem"] as const;

export function buildWhere(f: SearchFilters): Prisma.DigimonWhereInput {
  const and: Prisma.DigimonWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q } },
        { nameJp: { contains: f.q } },
        { romaji: { contains: f.q } },
        { otherNames: { contains: f.q } },
      ],
    });
  }
  if (f.estagio) and.push({ stage: { slug: f.estagio } });
  if (f.atributo) and.push({ attribute: { slug: f.atributo } });
  if (f.tipo) and.push({ types: { some: { type: { slug: f.tipo } } } });
  if (f.familia) and.push({ families: { some: { family: { slug: f.familia } } } });
  if (f.grupo) and.push({ groups: { some: { group: { slug: f.grupo } } } });
  for (const m of [f.jogo, f.anime, f.midia]) {
    if (!m) continue;
    const inMedia = { contexts: { some: { media: { slug: m } } } };
    and.push({ OR: [{ appearances: { some: { media: { slug: m } } } }, { evolutionsFrom: { some: inMedia } }, { evolutionsTo: { some: inMedia } }] });
  }
  if (f.habilidade) {
    and.push({
      OR: [
        { attacks: { some: { OR: [{ name: { contains: f.habilidade } }, { localizedName: { contains: f.habilidade } }, { description: { contains: f.habilidade } }] } } },
        { abilities: { some: { OR: [{ name: { contains: f.habilidade } }, { description: { contains: f.habilidade } }] } } },
      ],
    });
  }
  if (f.de) {
    and.push({
      evolutionsTo: {
        some: { OR: [{ from: { name: { contains: f.de } } }, { partners: { some: { digimon: { name: { contains: f.de } } } } }] },
      },
    });
  }
  if (f.para) {
    and.push({
      OR: [
        { evolutionsFrom: { some: { to: { name: { contains: f.para } } } } },
        { partnerIn: { some: { evolution: { to: { name: { contains: f.para } } } } } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export function orderBy(ordem?: string): Prisma.DigimonOrderByWithRelationInput[] {
  switch (ordem) {
    case "nome": return [{ name: "asc" }];
    case "populares": return [{ viewCount: "desc" }, { number: "asc" }];
    case "recentes": return [{ createdAt: "desc" }, { id: "desc" }];
    case "estagio": return [{ stage: { order: "asc" } }, { name: "asc" }];
    default: return [{ number: "asc" }];
  }
}

export async function searchDigimon(f: SearchFilters, pageSize = PAGE_SIZE) {
  const where = buildWhere(f);
  const page = Math.max(1, f.pagina ?? 1);
  const [total, items] = await Promise.all([
    db.digimon.count({ where }),
    db.digimon.findMany({ where, select: cardSelect, orderBy: orderBy(f.ordem), skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { total, items, page, pageSize };
}
