import type { Media, MediaStage } from "@prisma/client";
import { db } from "@/lib/db";
import { MEDIA_KINDS } from "@/lib/constants";
import { saveMedia } from "../actions";
import { Checkbox, Input, Panel, Select, Textarea } from "../_components/form";
import { SubmitButton } from "../_components/client";

export async function MediaForm({ m }: { m?: (Media & { stages: MediaStage[] }) | null }) {
  const stages = await db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }] });
  return (
    <form action={saveMedia}>
      {m && <input type="hidden" name="id" value={m.id} />}
      <Panel title="Dados da obra">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nome" name="name" defaultValue={m?.name} required className="md:col-span-2" />
          <Select label="Tipo" name="kind" defaultValue={m?.kind ?? "game"} options={Object.entries(MEDIA_KINDS).map(([k, v]) => [k, v.label])} />
          <Input label="Nome japonês" name="nameJp" defaultValue={m?.nameJp} />
          <Input label="Slug (URL)" name="slug" defaultValue={m?.slug} hint="Vazio = gerado do nome" />
          <Input label="Plataforma" name="platform" defaultValue={m?.platform} />
          <Input label="Ano de início" name="year" type="number" defaultValue={m?.year} />
          <Input label="Ano de término" name="endYear" type="number" defaultValue={m?.endYear} />
          <Input label="Cor" name="color" type="color" defaultValue={m?.color ?? "#6366f1"} />
          <Textarea label="Descrição" name="description" defaultValue={m?.description} className="md:col-span-3" />
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-medium text-muted">Estágios disponíveis nesta obra</legend>
          <div className="flex flex-wrap gap-4 rounded-[4px] border border-line p-3">
            {stages.map((s) => <Checkbox key={s.id} name="stageIds" value={s.id} label={s.name} defaultChecked={m?.stages.some((x) => x.stageId === s.id)} />)}
          </div>
        </fieldset>
        <div className="mt-4 flex justify-end"><SubmitButton>{m ? "Salvar obra" : "Criar obra"}</SubmitButton></div>
      </Panel>
    </form>
  );
}
