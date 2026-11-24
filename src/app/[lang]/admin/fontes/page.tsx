import { db } from "@/lib/db";
import { AdminTitle, Flash, Input, Panel, Select, Textarea } from "../_components/form";
import { DeleteButton, SubmitButton } from "../_components/client";
import { deleteSource, saveSource } from "../actions";
import { SOURCE_KINDS, type SourceKind } from "@/lib/constants";
import type { Source } from "@/generated/prisma/client";
import type { SP } from "../_lib";

const kindOptions = Object.entries(SOURCE_KINDS) as [string, string][];

function SourceFields({ s }: { s?: Source }) {
  return (
    <>
      <Input label="Título" name="title" defaultValue={s?.title} required className="md:col-span-2" />
      <Select label="Tipo" name="kind" defaultValue={s?.kind ?? "official"} options={kindOptions} />
      <Input label="URL" name="url" type="url" defaultValue={s?.url} placeholder="https://..." className="md:col-span-2" />
      <Input label="Publicador" name="publisher" defaultValue={s?.publisher} />
      <Textarea label="Observações" name="notes" defaultValue={s?.notes} rows={2} className="md:col-span-3" />
    </>
  );
}

export default async function AdminSources({ searchParams }: { searchParams: SP }) {
  const { ok, erro, q } = await searchParams;
  const sources = await db.source.findMany({
    where: q ? { title: { contains: q } } : {},
    orderBy: [{ kind: "asc" }, { title: "asc" }],
    include: { _count: { select: { citations: true, evolutions: true, evolutionContexts: true, appearances: true, attacks: true, trivia: true, mediaFeatures: true } } },
  });
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <AdminTitle title="Fontes e referências" subtitle="Priorize o Digimon Reference Book, materiais oficiais e a Wikimon." />
      <Flash ok={ok} erro={erro} />
      <Panel title="Nova fonte">
        <form action={saveSource} className="grid gap-3 md:grid-cols-3">
          <SourceFields />
          <div className="md:col-span-3"><SubmitButton>Criar fonte</SubmitButton></div>
        </form>
      </Panel>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Filtrar por título" className="input max-w-sm" />
        <button className="btn btn-ghost">Filtrar</button>
      </form>
      <div className="card divide-y divide-line">
        {sources.map((s) => {
          const uses = Object.values(s._count).reduce((a, b) => a + b, 0);
          return (
            <details key={s.id} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3 text-sm hover:bg-surface-2/50">
                <b className="flex-1 truncate">{s.title}</b>
                <span className="text-xs text-muted">{SOURCE_KINDS[s.kind as SourceKind] ?? s.kind}</span>
                <span className="text-xs text-muted">{uses} usos</span>
              </summary>
              <div className="border-t border-line bg-surface-2/30 p-4">
                <form action={saveSource} className="grid gap-3 md:grid-cols-3">
                  <input type="hidden" name="id" value={s.id} />
                  <SourceFields s={s} />
                  <div className="md:col-span-3"><SubmitButton>Salvar</SubmitButton></div>
                </form>
                <div className="mt-3"><DeleteButton action={deleteSource} fields={{ id: s.id }} confirmText={`Excluir a fonte "${s.title}"? Os ${uses} itens que a usam ficarão sem fonte.`} /></div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
