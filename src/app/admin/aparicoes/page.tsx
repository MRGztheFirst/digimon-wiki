import Link from "next/link";
import { db } from "@/lib/db";
import { AdminTitle, Flash, Input, Panel, Select } from "../_components/form";
import { DeleteButton, DigimonPicker, SubmitButton } from "../_components/client";
import { deleteChild, saveAppearance } from "../actions";
import { mediaOptions, sourceOptions, statusOptions, type SP } from "../_lib";
import { StatusBadge } from "@/components/badges";
import { Pagination } from "@/components/ui";

const PAGE = 60;

export default async function AdminAppearances({ searchParams }: { searchParams: SP }) {
  const { ok, erro, midia, pagina } = await searchParams;
  const page = Number(pagina) || 1;
  const where = midia ? { mediaId: Number(midia) } : {};
  const [media, sources, total, items] = await Promise.all([
    mediaOptions(),
    sourceOptions(),
    db.appearance.count({ where }),
    db.appearance.findMany({ where, include: { digimon: { select: { id: true, name: true } }, media: { select: { name: true } } }, orderBy: [{ media: { year: "asc" } }, { digimon: { number: "asc" } }], skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const ret = `/admin/aparicoes${midia ? `?midia=${midia}` : ""}`;
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminTitle title="Aparições" subtitle={`${total} registros — em qual obra cada Digimon aparece, com participação e forma.`} />
      <Flash ok={ok} erro={erro} />
      <Panel title="Adicionar ou atualizar aparição">
        <form action={saveAppearance} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="returnTo" value={ret} />
          <DigimonPicker name="digimonId" label="Digimon" required />
          <Select label="Obra" name="mediaId" defaultValue={midia} required empty="— Escolha —" options={media} />
          <Input label="Participação" name="role" />
          <Input label="Forma apresentada" name="form" />
          <Select label="Confiabilidade" name="status" defaultValue="media" options={statusOptions} />
          <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
          <div className="md:col-span-3"><SubmitButton>Salvar aparição</SubmitButton></div>
        </form>
      </Panel>
      <form className="flex gap-2">
        <select name="midia" defaultValue={midia ?? ""} className="input max-w-sm">
          <option value="">Todas as obras</option>
          {media.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <button className="btn btn-ghost">Filtrar</button>
      </form>
      <div className="card divide-y divide-line">
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
            <Link href={`/admin/digimon/${a.digimon.id}`} className="w-48 shrink-0 font-semibold hover:text-primary">{a.digimon.name}</Link>
            <span className="w-64 shrink-0 text-muted">{a.media.name}</span>
            <span className="flex-1 truncate text-muted">{[a.role, a.form].filter(Boolean).join(" · ")}</span>
            <StatusBadge status={a.status} compact />
            <DeleteButton action={deleteChild} fields={{ kind: "appearance", id: a.id, returnTo: ret }} compact label="Remover" />
          </div>
        ))}
      </div>
      <Pagination page={page} total={total} pageSize={PAGE} makeHref={(p) => `/admin/aparicoes?${new URLSearchParams({ ...(midia ? { midia } : {}), pagina: String(p) })}`} />
    </div>
  );
}
