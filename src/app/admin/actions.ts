"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { assertEditor } from "@/lib/editor";
import { EVOLUTION_KINDS, MEDIA_KINDS, REVIEW_STATUSES, STATUSES, SOURCE_KINDS, FEATURE_CATEGORIES } from "@/lib/constants";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const ids = (fd: FormData, k: string) => fd.getAll(k).map(Number).filter((n) => Number.isInteger(n) && n > 0);
const oneOf = <T extends Record<string, unknown>>(dict: T, v: string | null, fallback: keyof T) => (v && v in dict ? v : (fallback as string));

function back(fd: FormData, fallback: string) {
  return str(fd, "returnTo") ?? fallback;
}
function withMsg(url: string, key: "ok" | "erro", msg: string) {
  const u = new URL(url, "http://x");
  u.searchParams.set(key, msg);
  return u.pathname + u.search;
}
function describe(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return `Já existe um registro com o mesmo valor em: ${(e.meta?.target as string[] | undefined)?.join(", ") ?? "campo único"}.`;
    if (e.code === "P2003") return "Este registro está vinculado a outro e não pode ser alterado assim.";
    if (e.code === "P2025") return "Registro não encontrado.";
  }
  return e instanceof Error ? e.message : "Erro desconhecido.";
}
async function run<T>(fd: FormData, fallback: string, op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (e) {
    redirect(withMsg(back(fd, fallback), "erro", describe(e)));
  }
}
function refresh() {
  revalidatePath("/", "layout");
}

export async function saveDigimon(fd: FormData) {
  assertEditor();
  const id = num(fd, "id");
  const name = str(fd, "name");
  const fallback = id ? `/admin/digimon/${id}` : "/admin/digimon/novo";
  if (!name) redirect(withMsg(fallback, "erro", "O nome é obrigatório."));
  const slug = slugify(str(fd, "slug") ?? name);
  let number = num(fd, "number");
  if (!number) number = ((await db.digimon.aggregate({ _max: { number: true } }))._max.number ?? 0) + 1;

  const data = {
    name,
    slug,
    number,
    nameJp: str(fd, "nameJp"),
    romaji: str(fd, "romaji"),
    pronunciation: str(fd, "pronunciation"),
    otherNames: str(fd, "otherNames"),
    imageUrl: str(fd, "imageUrl"),
    imageCredit: str(fd, "imageCredit"),
    summary: str(fd, "summary"),
    nameMeaning: str(fd, "nameMeaning"),
    designOrigin: str(fd, "designOrigin"),
    physical: str(fd, "physical"),
    personality: str(fd, "personality"),
    combat: str(fd, "combat"),
    powerLevel: str(fd, "powerLevel"),
    firstAppearance: str(fd, "firstAppearance"),
    firstYear: num(fd, "firstYear"),
    reviewStatus: oneOf(REVIEW_STATUSES, str(fd, "reviewStatus"), "draft"),
    featured: fd.get("featured") === "on",
    stageId: num(fd, "stageId"),
    attributeId: num(fd, "attributeId"),
    baseId: num(fd, "baseId"),
    variantKind: str(fd, "variantKind"),
  };
  const typeIds = ids(fd, "typeIds");
  const groupIds = ids(fd, "groupIds");
  const familyIds = ids(fd, "familyIds");
  const families = familyIds.map((familyId) => ({
    familyId,
    status: oneOf(STATUSES, str(fd, `familyStatus_${familyId}`), "unconfirmed"),
  }));

  const saved = await run(fd, fallback, () =>
    db.$transaction(async (tx) => {
      const d = id ? await tx.digimon.update({ where: { id }, data }) : await tx.digimon.create({ data });
      if (data.baseId === d.id) throw new Error("Um Digimon não pode ser variante de si mesmo.");
      await tx.digimonTypeLink.deleteMany({ where: { digimonId: d.id } });
      await tx.groupMember.deleteMany({ where: { digimonId: d.id, groupId: { notIn: groupIds } } });
      const existingGroups = await tx.groupMember.findMany({ where: { digimonId: d.id }, select: { groupId: true } });
      await tx.digimonFamily.deleteMany({ where: { digimonId: d.id } });
      if (typeIds.length) await tx.digimonTypeLink.createMany({ data: typeIds.map((typeId) => ({ digimonId: d.id, typeId })) });
      const newGroups = groupIds.filter((g) => !existingGroups.some((e) => e.groupId === g));
      if (newGroups.length) await tx.groupMember.createMany({ data: newGroups.map((groupId) => ({ digimonId: d.id, groupId })) });
      if (families.length) await tx.digimonFamily.createMany({ data: families.map((f) => ({ ...f, digimonId: d.id })) });
      return d;
    }),
  );
  refresh();
  redirect(withMsg(`/admin/digimon/${saved.id}`, "ok", id ? "Alterações salvas." : "Digimon criado."));
}

export async function deleteDigimon(fd: FormData) {
  assertEditor();
  const id = num(fd, "id")!;
  await run(fd, `/admin/digimon/${id}`, () => db.digimon.delete({ where: { id } }));
  refresh();
  redirect(withMsg("/admin/digimon", "ok", "Digimon excluído."));
}

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

export async function uploadImage(fd: FormData) {
  assertEditor();
  const id = num(fd, "id")!;
  const ret = `/admin/digimon/${id}`;
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(withMsg(ret, "erro", "Selecione um arquivo de imagem."));
  const ext = IMAGE_TYPES[file.type];
  if (!ext) redirect(withMsg(ret, "erro", "Formato não suportado. Use PNG, JPG, WEBP, GIF ou AVIF."));
  if (file.size > 5 * 1024 * 1024) redirect(withMsg(ret, "erro", "A imagem deve ter no máximo 5 MB."));
  const d = await db.digimon.findUniqueOrThrow({ where: { id }, select: { slug: true } });
  const filename = `${d.slug}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  await db.digimon.update({ where: { id }, data: { imageUrl: `/api/uploads/${filename}`, imageCredit: str(fd, "imageCredit") } });
  refresh();
  redirect(withMsg(ret, "ok", "Imagem enviada."));
}

export async function addAttack(fd: FormData) {
  assertEditor();
  const digimonId = num(fd, "digimonId")!;
  const name = str(fd, "name");
  const ret = back(fd, `/admin/digimon/${digimonId}`);
  if (!name) redirect(withMsg(ret, "erro", "Informe o nome do golpe."));
  const order = await db.attack.count({ where: { digimonId } });
  await run(fd, ret, () =>
    db.attack.create({ data: { digimonId, name, localizedName: str(fd, "localizedName"), description: str(fd, "description"), status: oneOf(STATUSES, str(fd, "status"), "official"), sourceId: num(fd, "sourceId"), order } }),
  );
  refresh();
  redirect(withMsg(ret, "ok", "Golpe adicionado."));
}

export async function addAbility(fd: FormData) {
  assertEditor();
  const digimonId = num(fd, "digimonId")!;
  const name = str(fd, "name");
  const ret = back(fd, `/admin/digimon/${digimonId}`);
  if (!name) redirect(withMsg(ret, "erro", "Informe o nome da habilidade."));
  await run(fd, ret, () => db.ability.create({ data: { digimonId, name, description: str(fd, "description"), status: oneOf(STATUSES, str(fd, "status"), "official"), sourceId: num(fd, "sourceId") } }));
  refresh();
  redirect(withMsg(ret, "ok", "Habilidade adicionada."));
}

export async function addTrivia(fd: FormData) {
  assertEditor();
  const digimonId = num(fd, "digimonId")!;
  const text = str(fd, "text");
  const ret = back(fd, `/admin/digimon/${digimonId}`);
  if (!text) redirect(withMsg(ret, "erro", "Escreva a curiosidade."));
  await run(fd, ret, () => db.trivia.create({ data: { digimonId, text, status: oneOf(STATUSES, str(fd, "status"), "unconfirmed"), sourceId: num(fd, "sourceId") } }));
  refresh();
  redirect(withMsg(ret, "ok", "Curiosidade adicionada."));
}

export async function addCitation(fd: FormData) {
  assertEditor();
  const digimonId = num(fd, "digimonId")!;
  const sourceId = num(fd, "sourceId");
  const ret = back(fd, `/admin/digimon/${digimonId}`);
  if (!sourceId) redirect(withMsg(ret, "erro", "Escolha uma fonte."));
  await run(fd, ret, () => db.citation.create({ data: { digimonId, sourceId, field: str(fd, "field") ?? "*", url: str(fd, "url"), note: str(fd, "note") } }));
  refresh();
  redirect(withMsg(ret, "ok", "Fonte associada."));
}

const DELETABLE = {
  attack: (id: number) => db.attack.delete({ where: { id } }),
  ability: (id: number) => db.ability.delete({ where: { id } }),
  trivia: (id: number) => db.trivia.delete({ where: { id } }),
  citation: (id: number) => db.citation.delete({ where: { id } }),
  appearance: (id: number) => db.appearance.delete({ where: { id } }),
  evolutionContext: (id: number) => db.evolutionContext.delete({ where: { id } }),
  mediaFeature: (id: number) => db.mediaFeature.delete({ where: { id } }),
} as const;

export async function deleteChild(fd: FormData) {
  assertEditor();
  const kind = str(fd, "kind") as keyof typeof DELETABLE;
  const id = num(fd, "id")!;
  const ret = back(fd, "/admin");
  if (!(kind in DELETABLE)) redirect(withMsg(ret, "erro", "Tipo inválido."));
  await run(fd, ret, async () => {
    await DELETABLE[kind](id);
  });
  refresh();
  redirect(withMsg(ret, "ok", "Item removido."));
}

export async function saveAppearance(fd: FormData) {
  assertEditor();
  const digimonId = num(fd, "digimonId");
  const mediaId = num(fd, "mediaId");
  const ret = back(fd, "/admin/aparicoes");
  if (!digimonId || !mediaId) redirect(withMsg(ret, "erro", "Escolha o Digimon e a obra."));
  const data = { role: str(fd, "role"), form: str(fd, "form"), notes: str(fd, "notes"), status: oneOf(STATUSES, str(fd, "status"), "media"), sourceId: num(fd, "sourceId") };
  await run(fd, ret, () =>
    db.appearance.upsert({ where: { digimonId_mediaId: { digimonId, mediaId } }, update: data, create: { ...data, digimonId, mediaId } }),
  );
  refresh();
  redirect(withMsg(ret, "ok", "Aparição salva."));
}

export async function saveEvolution(fd: FormData) {
  assertEditor();
  const id = num(fd, "id");
  const fromId = num(fd, "fromId");
  const toId = num(fd, "toId");
  const fallback = id ? `/admin/evolucoes/${id}` : "/admin/evolucoes/nova";
  if (!fromId || !toId) redirect(withMsg(fallback, "erro", "Escolha o Digimon de origem e o de destino."));
  if (fromId === toId) redirect(withMsg(fallback, "erro", "Origem e destino não podem ser o mesmo Digimon."));
  const partnerIds = ids(fd, "partnerIds").filter((p) => p !== fromId && p !== toId);
  const data = {
    fromId,
    toId,
    kind: oneOf(EVOLUTION_KINDS, str(fd, "kind"), "normal"),
    status: oneOf(STATUSES, str(fd, "status"), "unconfirmed"),
    requirements: str(fd, "requirements"),
    notes: str(fd, "notes"),
    sourceId: num(fd, "sourceId"),
  };
  const saved = await run(fd, fallback, () =>
    db.$transaction(async (tx) => {
      const e = id ? await tx.evolution.update({ where: { id }, data }) : await tx.evolution.create({ data });
      await tx.evolutionPartner.deleteMany({ where: { evolutionId: e.id } });
      if (partnerIds.length) await tx.evolutionPartner.createMany({ data: partnerIds.map((digimonId) => ({ evolutionId: e.id, digimonId })) });
      return e;
    }),
  );
  refresh();
  redirect(withMsg(`/admin/evolucoes/${saved.id}`, "ok", id ? "Evolução atualizada." : "Evolução criada."));
}

export async function deleteEvolution(fd: FormData) {
  assertEditor();
  const id = num(fd, "id")!;
  await run(fd, `/admin/evolucoes/${id}`, () => db.evolution.delete({ where: { id } }));
  refresh();
  redirect(withMsg("/admin/evolucoes", "ok", "Evolução excluída."));
}

export async function saveEvolutionContext(fd: FormData) {
  assertEditor();
  const evolutionId = num(fd, "evolutionId")!;
  const mediaId = num(fd, "mediaId");
  const ret = `/admin/evolucoes/${evolutionId}`;
  if (!mediaId) redirect(withMsg(ret, "erro", "Escolha a obra."));
  const data = { requirements: str(fd, "requirements"), notes: str(fd, "notes"), status: oneOf(STATUSES, str(fd, "status"), "media"), sourceId: num(fd, "sourceId") };
  await run(fd, ret, () =>
    db.evolutionContext.upsert({ where: { evolutionId_mediaId: { evolutionId, mediaId } }, update: data, create: { ...data, evolutionId, mediaId } }),
  );
  refresh();
  redirect(withMsg(ret, "ok", "Contexto salvo."));
}

export async function saveMedia(fd: FormData) {
  assertEditor();
  const id = num(fd, "id");
  const name = str(fd, "name");
  const fallback = id ? `/admin/midias/${id}` : "/admin/midias/nova";
  if (!name) redirect(withMsg(fallback, "erro", "O nome é obrigatório."));
  const data = {
    name,
    slug: slugify(str(fd, "slug") ?? name),
    nameJp: str(fd, "nameJp"),
    kind: oneOf(MEDIA_KINDS, str(fd, "kind"), "other"),
    year: num(fd, "year"),
    endYear: num(fd, "endYear"),
    platform: str(fd, "platform"),
    description: str(fd, "description"),
    color: str(fd, "color") ?? "#6366f1",
  };
  const stageIds = ids(fd, "stageIds");
  const saved = await run(fd, fallback, () =>
    db.$transaction(async (tx) => {
      const m = id ? await tx.media.update({ where: { id }, data }) : await tx.media.create({ data });
      await tx.mediaStage.deleteMany({ where: { mediaId: m.id, stageId: { notIn: stageIds } } });
      const existing = await tx.mediaStage.findMany({ where: { mediaId: m.id }, select: { stageId: true } });
      const add = stageIds.filter((s) => !existing.some((e) => e.stageId === s));
      if (add.length) await tx.mediaStage.createMany({ data: add.map((stageId) => ({ mediaId: m.id, stageId })) });
      return m;
    }),
  );
  refresh();
  redirect(withMsg(`/admin/midias/${saved.id}`, "ok", id ? "Obra atualizada." : "Obra criada."));
}

export async function deleteMedia(fd: FormData) {
  assertEditor();
  const id = num(fd, "id")!;
  await run(fd, `/admin/midias/${id}`, () => db.media.delete({ where: { id } }));
  refresh();
  redirect(withMsg("/admin/midias", "ok", "Obra excluída."));
}

export async function addMediaFeature(fd: FormData) {
  assertEditor();
  const mediaId = num(fd, "mediaId")!;
  const ret = `/admin/midias/${mediaId}`;
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!title || !body) redirect(withMsg(ret, "erro", "Preencha título e descrição."));
  const order = await db.mediaFeature.count({ where: { mediaId } });
  await run(fd, ret, () =>
    db.mediaFeature.create({
      data: { mediaId, title, body, category: oneOf(FEATURE_CATEGORIES, str(fd, "category"), "particularity"), status: oneOf(STATUSES, str(fd, "status"), "media"), sourceId: num(fd, "sourceId"), order },
    }),
  );
  refresh();
  redirect(withMsg(ret, "ok", "Sistema/particularidade adicionado."));
}

export async function saveTaxonomy(fd: FormData) {
  assertEditor();
  const entity = str(fd, "entity");
  const id = num(fd, "id");
  const name = str(fd, "name");
  const ret = `/admin/classificacoes/${entity}`;
  if (!name) redirect(withMsg(ret, "erro", "O nome é obrigatório."));
  const slug = slugify(str(fd, "slug") ?? name);
  const common = { name, slug, description: str(fd, "description") };
  await run(fd, ret, async () => {
    switch (entity) {
      case "estagios": {
        const data = { ...common, nameEn: str(fd, "nameEn"), nameJp: str(fd, "nameJp"), romaji: str(fd, "romaji"), order: num(fd, "order") ?? 0, isSpecial: fd.get("isSpecial") === "on", color: str(fd, "color") ?? "#64748b" };
        return id ? db.stage.update({ where: { id }, data }) : db.stage.create({ data });
      }
      case "atributos": {
        const data = { ...common, nameJp: str(fd, "nameJp"), details: str(fd, "details"), color: str(fd, "color") ?? "#64748b" };
        return id ? db.attribute.update({ where: { id }, data }) : db.attribute.create({ data });
      }
      case "tipos": {
        const data = { ...common, nameJp: str(fd, "nameJp") };
        return id ? db.digimonType.update({ where: { id }, data }) : db.digimonType.create({ data });
      }
      case "familias": {
        const data = { ...common, abbr: str(fd, "abbr"), nameJp: str(fd, "nameJp"), color: str(fd, "color") ?? "#64748b" };
        return id ? db.family.update({ where: { id }, data }) : db.family.create({ data });
      }
      case "grupos": {
        const data = { ...common, nameJp: str(fd, "nameJp"), legendary: fd.get("legendary") === "on" };
        return id ? db.group.update({ where: { id }, data }) : db.group.create({ data });
      }
      default:
        throw new Error("Classificação desconhecida.");
    }
  });
  refresh();
  redirect(withMsg(ret, "ok", id ? "Alterações salvas." : "Item criado."));
}

export async function deleteTaxonomy(fd: FormData) {
  assertEditor();
  const entity = str(fd, "entity");
  const id = num(fd, "id")!;
  const ret = `/admin/classificacoes/${entity}`;
  await run(fd, ret, async () => {
    switch (entity) {
      case "estagios": return db.stage.delete({ where: { id } });
      case "atributos": return db.attribute.delete({ where: { id } });
      case "tipos": return db.digimonType.delete({ where: { id } });
      case "familias": return db.family.delete({ where: { id } });
      case "grupos": return db.group.delete({ where: { id } });
      default: throw new Error("Classificação desconhecida.");
    }
  });
  refresh();
  redirect(withMsg(ret, "ok", "Item excluído."));
}

export async function saveSource(fd: FormData) {
  assertEditor();
  const id = num(fd, "id");
  const title = str(fd, "title");
  const ret = "/admin/fontes";
  if (!title) redirect(withMsg(ret, "erro", "O título é obrigatório."));
  const url = str(fd, "url");
  if (url && !/^https?:\/\//i.test(url)) redirect(withMsg(ret, "erro", "A URL deve começar com http:// ou https://"));
  const data = { title, url, publisher: str(fd, "publisher"), kind: oneOf(SOURCE_KINDS, str(fd, "kind"), "other"), notes: str(fd, "notes") };
  await run(fd, ret, () => (id ? db.source.update({ where: { id }, data }) : db.source.create({ data })));
  refresh();
  redirect(withMsg(ret, "ok", id ? "Fonte atualizada." : "Fonte criada."));
}

export async function deleteSource(fd: FormData) {
  assertEditor();
  const id = num(fd, "id")!;
  await run(fd, "/admin/fontes", () => db.source.delete({ where: { id } }));
  refresh();
  redirect(withMsg("/admin/fontes", "ok", "Fonte excluída."));
}
