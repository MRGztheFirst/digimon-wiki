import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminTitle, Checkbox, Flash, Input, Panel, Textarea } from "../../_components/form";
import { DeleteButton, SubmitButton } from "../../_components/client";
import { deleteTaxonomy, saveTaxonomy } from "../../actions";
import type { SP } from "../../_lib";

type FieldDef = { name: string; label: string; type?: "text" | "number" | "color" | "textarea" | "checkbox"; wide?: boolean };

const ENTITIES: Record<string, { title: string; fields: FieldDef[]; load: () => Promise<(Record<string, unknown> & { id: number; name: string; _n: number })[]> }> = {
  estagios: {
    title: "Estágios",
    fields: [
      { name: "nameEn", label: "Nome internacional" }, { name: "nameJp", label: "Nome japonês" }, { name: "romaji", label: "Romanização" },
      { name: "order", label: "Ordem", type: "number" }, { name: "color", label: "Cor", type: "color" }, { name: "isSpecial", label: "Estágio especial", type: "checkbox" },
      { name: "description", label: "Descrição", type: "textarea", wide: true },
    ],
    load: async () => (await db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], include: { _count: { select: { digimon: true } } } })).map((x) => ({ ...x, _n: x._count.digimon })),
  },
  atributos: {
    title: "Atributos",
    fields: [
      { name: "nameJp", label: "Nome japonês" }, { name: "color", label: "Cor", type: "color" },
      { name: "description", label: "Descrição", type: "textarea", wide: true }, { name: "details", label: "Particularidades", type: "textarea", wide: true },
    ],
    load: async () => (await db.attribute.findMany({ include: { _count: { select: { digimon: true } } } })).map((x) => ({ ...x, _n: x._count.digimon })),
  },
  tipos: {
    title: "Tipos",
    fields: [{ name: "nameJp", label: "Nome japonês" }, { name: "description", label: "Descrição", type: "textarea", wide: true }],
    load: async () => (await db.digimonType.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((x) => ({ ...x, _n: x._count.digimon })),
  },
  familias: {
    title: "Famílias",
    fields: [{ name: "abbr", label: "Sigla" }, { name: "nameJp", label: "Nome japonês" }, { name: "color", label: "Cor", type: "color" }, { name: "description", label: "Descrição", type: "textarea", wide: true }],
    load: async () => (await db.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { digimon: true } } } })).map((x) => ({ ...x, _n: x._count.digimon })),
  },
  grupos: {
    title: "Grupos e organizações",
    fields: [{ name: "nameJp", label: "Nome japonês" }, { name: "legendary", label: "Lendário", type: "checkbox" }, { name: "description", label: "Descrição", type: "textarea", wide: true }],
    load: async () => (await db.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { members: true } } } })).map((x) => ({ ...x, _n: x._count.members })),
  },
};

function Fields({ fields, row }: { fields: FieldDef[]; row?: Record<string, unknown> }) {
  const v = (k: string) => (row?.[k] as string | number | null | undefined) ?? null;
  return (
    <>
      <Input label="Nome" name="name" defaultValue={v("name")} required />
      <Input label="Slug" name="slug" defaultValue={v("slug")} hint="Vazio = gerado do nome" />
      {fields.map((f) =>
        f.type === "textarea" ? (
          <Textarea key={f.name} label={f.label} name={f.name} defaultValue={v(f.name) as string | null} className={f.wide ? "md:col-span-3" : ""} />
        ) : f.type === "checkbox" ? (
          <div key={f.name} className="self-end pb-2"><Checkbox name={f.name} label={f.label} defaultChecked={!!row?.[f.name]} /></div>
        ) : (
          <Input key={f.name} label={f.label} name={f.name} type={f.type ?? "text"} defaultValue={v(f.name) ?? (f.type === "color" ? "#64748b" : null)} />
        ),
      )}
    </>
  );
}

export default async function AdminTaxonomy({ params, searchParams }: { params: Promise<{ entity: string }>; searchParams: SP }) {
  const { entity } = await params;
  const { ok, erro } = await searchParams;
  const def = ENTITIES[entity];
  if (!def) notFound();
  const rows = await def.load();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <AdminTitle title={def.title} subtitle={`${rows.length} itens`} />
      <Flash ok={ok} erro={erro} />
      <Panel title="Adicionar">
        <form action={saveTaxonomy} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="entity" value={entity} />
          <Fields fields={def.fields} />
          <div className="md:col-span-3"><SubmitButton>Criar</SubmitButton></div>
        </form>
      </Panel>
      <div className="card divide-y divide-line">
        {rows.map((r) => (
          <details key={r.id} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 text-sm hover:bg-surface-2/50">
              {typeof r.color === "string" && <span className="h-3 w-3 rounded-full" style={{ background: r.color }} />}
              <b className="flex-1">{r.name}</b>
              <span className="text-xs text-muted">{r._n} Digimon</span>
              <span className="text-xs text-accent group-open:hidden">Editar</span>
            </summary>
            <div className="border-t border-line bg-surface-2/30 p-4">
              <form action={saveTaxonomy} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="entity" value={entity} />
                <input type="hidden" name="id" value={r.id} />
                <Fields fields={def.fields} row={r} />
                <div className="flex items-center gap-2 md:col-span-3"><SubmitButton>Salvar</SubmitButton></div>
              </form>
              <div className="mt-3">
                <DeleteButton action={deleteTaxonomy} fields={{ entity, id: r.id }} confirmText={`Excluir "${r.name}"? Os Digimon vinculados perderão esta classificação.`} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
