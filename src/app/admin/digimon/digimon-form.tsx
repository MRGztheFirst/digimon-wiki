import { db } from "@/lib/db";
import { REVIEW_STATUSES } from "@/lib/constants";
import { saveDigimon } from "../actions";
import { Checkbox, Input, Panel, Select, Textarea } from "../_components/form";
import { DigimonPicker, SubmitButton } from "../_components/client";
import { statusOptions } from "../_lib";
import type { Prisma } from "@prisma/client";

type Full = Prisma.DigimonGetPayload<{ include: { types: true; families: true; groups: true; base: { select: { id: true; name: true } } } }>;

export async function DigimonForm({ d }: { d?: Full | null }) {
  const [stages, attributes, types, families, groups] = await Promise.all([
    db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }] }),
    db.attribute.findMany(),
    db.digimonType.findMany({ orderBy: { name: "asc" } }),
    db.family.findMany({ orderBy: { name: "asc" } }),
    db.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  const famStatus = new Map(d?.families.map((f) => [f.familyId, f.status]) ?? []);

  return (
    <form action={saveDigimon} className="space-y-4">
      {d && <input type="hidden" name="id" value={d.id} />}
      <Panel title="Informações básicas">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nome oficial" name="name" defaultValue={d?.name} required className="md:col-span-2" />
          <Input label="Nº interno" name="number" type="number" defaultValue={d?.number} hint="Vazio = próximo número livre" />
          <Input label="Nome japonês" name="nameJp" defaultValue={d?.nameJp} placeholder="アグモン" />
          <Input label="Romanização" name="romaji" defaultValue={d?.romaji} placeholder="Agumon" />
          <Input label="Pronúncia" name="pronunciation" defaultValue={d?.pronunciation} />
          <Input label="Slug (URL)" name="slug" defaultValue={d?.slug} hint="Vazio = gerado a partir do nome" />
          <Input label="Outros nomes" name="otherNames" defaultValue={d?.otherNames} hint="Separados por vírgula" className="md:col-span-2" />
          <Textarea label="Descrição geral" name="summary" defaultValue={d?.summary} rows={4} className="md:col-span-3" hint="Parágrafos separados por linha em branco." />
          <Textarea label="Significado do nome" name="nameMeaning" defaultValue={d?.nameMeaning} rows={2} />
          <Textarea label="Origem e inspiração do design" name="designOrigin" defaultValue={d?.designOrigin} rows={2} className="md:col-span-2" />
          <Input label="Primeira aparição" name="firstAppearance" defaultValue={d?.firstAppearance} className="md:col-span-2" />
          <Input label="Ano da primeira aparição" name="firstYear" type="number" defaultValue={d?.firstYear} />
        </div>
      </Panel>

      <Panel title="Classificação">
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Estágio" name="stageId" defaultValue={d?.stageId} empty="— Não definido —" options={stages.map((s) => [s.id, s.name])} />
          <Select label="Atributo" name="attributeId" defaultValue={d?.attributeId} empty="— Não documentado —" options={attributes.map((a) => [a.id, a.name])} />
          <Input label="Nível de poder" name="powerLevel" defaultValue={d?.powerLevel} hint="Somente com fonte confiável" />
        </div>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">Tipos</legend>
            <div className="scrollbar-thin max-h-56 space-y-1.5 overflow-auto rounded-[4px] border border-line p-3">
              {types.map((t) => <Checkbox key={t.id} name="typeIds" value={t.id} label={t.name} defaultChecked={d?.types.some((x) => x.typeId === t.id)} />)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">Famílias (com confiabilidade)</legend>
            <div className="space-y-1.5 rounded-[4px] border border-line p-3">
              {families.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2">
                  <Checkbox name="familyIds" value={f.id} label={f.name} defaultChecked={famStatus.has(f.id)} />
                  <select name={`familyStatus_${f.id}`} defaultValue={famStatus.get(f.id) ?? "unconfirmed"} className="input h-7 w-32 py-0 text-xs">
                    {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">Grupos / organizações</legend>
            <div className="space-y-1.5 rounded-[4px] border border-line p-3">
              {groups.map((g) => <Checkbox key={g.id} name="groupIds" value={g.id} label={g.name} defaultChecked={d?.groups.some((x) => x.groupId === g.id)} />)}
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel title="Características">
        <div className="grid gap-4 md:grid-cols-3">
          <Textarea label="Descrição física" name="physical" defaultValue={d?.physical} />
          <Textarea label="Personalidade" name="personality" defaultValue={d?.personality} />
          <Textarea label="Características de combate" name="combat" defaultValue={d?.combat} />
        </div>
      </Panel>

      <Panel title="Imagem, variantes e revisão">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="URL da imagem" name="imageUrl" defaultValue={d?.imageUrl} hint="Ou envie um arquivo na seção Imagem abaixo" className="md:col-span-2" />
          <Input label="Crédito da imagem" name="imageCredit" defaultValue={d?.imageCredit} />
          <DigimonPicker name="baseId" label="Forma base (se for variante)" initial={d?.base ?? null} />
          <Input label="Tipo de variante" name="variantKind" defaultValue={d?.variantKind} placeholder="X-Antibody, Modo, Burst Mode..." />
          <Select label="Revisão editorial" name="reviewStatus" defaultValue={d?.reviewStatus ?? "draft"} options={Object.entries(REVIEW_STATUSES).map(([k, v]) => [k, v.label])} />
          <Checkbox name="featured" label="Destacar na página inicial" defaultChecked={d?.featured} />
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <SubmitButton className="btn btn-primary shadow-xl">{d ? "Salvar alterações" : "Criar Digimon"}</SubmitButton>
      </div>
    </form>
  );
}
