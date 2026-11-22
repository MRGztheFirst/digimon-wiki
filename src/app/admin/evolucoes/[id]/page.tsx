import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash, Input, Panel, Select, Textarea } from "../../_components/form";
import { DeleteButton, SubmitButton } from "../../_components/client";
import { EvolutionForm } from "../evolution-form";
import { deleteChild, deleteEvolution, saveEvolutionContext } from "../../actions";
import { mediaOptions, sourceOptions, statusOptions, type SP } from "../../_lib";
import { StatusBadge } from "@/components/badges";

export default async function EditEvolution({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const e = await db.evolution.findUnique({
    where: { id: Number(id) || 0 },
    include: {
      from: { select: { id: true, name: true, slug: true } },
      to: { select: { id: true, name: true } },
      partners: { include: { digimon: { select: { id: true, name: true } } } },
      contexts: { include: { media: true, source: true }, orderBy: { media: { year: "asc" } } },
    },
  });
  if (!e) notFound();
  const [media, sources] = await Promise.all([mediaOptions(), sourceOptions()]);
  const ret = `/admin/evolucoes/${e.id}`;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <AdminTitle title={`${e.from.name} → ${e.to.name}`} subtitle={`Evolução #${e.id}`}
        actions={<>
          <Link href={`/linhas/${e.from.slug}`} target="_blank" className="btn btn-ghost"><ExternalLink size={15} /> Ver na árvore</Link>
          <DeleteButton action={deleteEvolution} fields={{ id: e.id }} confirmText="Excluir esta evolução e todos os seus contextos?" />
        </>} />
      <Flash ok={ok} erro={erro} />
      <EvolutionForm e={{ ...e, partners: e.partners.map((p) => p.digimon) }} />
      <Panel title={`Onde aparece (${e.contexts.length})`} description="Cada jogo ou mídia pode ter requisitos próprios. Não presuma que valem para outras obras.">
        <ul className="mb-4 divide-y divide-line text-sm">
          {e.contexts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 py-2.5">
              <div>
                <div className="flex items-center gap-2"><b>{c.media.name}</b><StatusBadge status={c.status} compact /></div>
                <div className="text-xs text-muted">Requisitos: {c.requirements ?? "não documentados"}{c.notes ? ` · ${c.notes}` : ""}{c.source ? ` · Fonte: ${c.source.title}` : ""}</div>
              </div>
              <DeleteButton action={deleteChild} fields={{ kind: "evolutionContext", id: c.id, returnTo: ret }} compact label="Remover contexto" />
            </li>
          ))}
        </ul>
        <form action={saveEvolutionContext} className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="evolutionId" value={e.id} />
          <Select label="Obra" name="mediaId" required empty="— Escolha —" options={media} />
          <Select label="Confiabilidade" name="status" defaultValue="media" options={statusOptions} />
          <Input label="Requisitos nesta obra" name="requirements" placeholder="Somente se documentados" />
          <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
          <Textarea label="Observações" name="notes" rows={2} className="sm:col-span-2" />
          <div className="sm:col-span-2"><SubmitButton className="btn btn-ghost">Salvar contexto (atualiza se a obra já existir)</SubmitButton></div>
        </form>
      </Panel>
    </div>
  );
}
