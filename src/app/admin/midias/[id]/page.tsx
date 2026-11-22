import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash, Input, Panel, Select, Textarea } from "../../_components/form";
import { DeleteButton, SubmitButton } from "../../_components/client";
import { MediaForm } from "../media-form";
import { addMediaFeature, deleteChild, deleteMedia } from "../../actions";
import { FEATURE_CATEGORIES, type FeatureCategory } from "@/lib/constants";
import { sourceOptions, statusOptions, type SP } from "../../_lib";
import { StatusBadge } from "@/components/badges";

export default async function EditMedia({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const m = await db.media.findUnique({ where: { id: Number(id) || 0 }, include: { stages: true, features: { orderBy: { order: "asc" }, include: { source: true } }, _count: { select: { appearances: true, evolutionContexts: true } } } });
  if (!m) notFound();
  const sources = await sourceOptions();
  const ret = `/admin/midias/${m.id}`;
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <AdminTitle title={m.name} subtitle={`${m._count.appearances} aparições · ${m._count.evolutionContexts} evoluções registradas`}
        actions={<>
          <Link href={`/universos/${m.slug}`} target="_blank" className="btn btn-ghost"><ExternalLink size={15} /> Ver página</Link>
          <DeleteButton action={deleteMedia} fields={{ id: m.id }} confirmText={`Excluir ${m.name}? Aparições e contextos de evolução desta obra também serão removidos.`} />
        </>} />
      <Flash ok={ok} erro={erro} />
      <MediaForm m={m} />
      <Panel title="Sistemas e particularidades" description="Sistema de evolução, requisitos, sistemas exclusivos e particularidades deste universo.">
        <ul className="mb-4 divide-y divide-line text-sm">
          {m.features.map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-3 py-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">{FEATURE_CATEGORIES[f.category as FeatureCategory] ?? f.category}</span><b>{f.title}</b><StatusBadge status={f.status} compact /></div>
                <p className="text-xs text-muted">{f.body}</p>
              </div>
              <DeleteButton action={deleteChild} fields={{ kind: "mediaFeature", id: f.id, returnTo: ret }} compact label="Remover" />
            </li>
          ))}
        </ul>
        <form action={addMediaFeature} className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="mediaId" value={m.id} />
          <Select label="Categoria" name="category" options={Object.entries(FEATURE_CATEGORIES)} />
          <Input label="Título" name="title" required />
          <Textarea label="Descrição" name="body" className="sm:col-span-2" />
          <Select label="Confiabilidade" name="status" defaultValue="media" options={statusOptions} />
          <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
          <div className="sm:col-span-2"><SubmitButton className="btn btn-ghost">Adicionar</SubmitButton></div>
        </form>
      </Panel>
    </div>
  );
}
