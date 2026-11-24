import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GitBranch, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash, Input, Panel, Select, Textarea } from "../../_components/form";
import { DeleteButton, SubmitButton } from "../../_components/client";
import { DigimonForm } from "../digimon-form";
import { addAbility, addAttack, addCitation, addTrivia, deleteChild, deleteDigimon, saveAppearance, uploadImage } from "../../actions";
import { mediaOptions, sourceOptions, statusOptions, type SP } from "../../_lib";
import { EvoKindBadge, StatusBadge } from "@/components/badges";
import { DigimonAvatar } from "@/components/digimon-avatar";

export default async function EditDigimon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id: idStr } = await params;
  const { ok, erro } = await searchParams;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();
  const d = await db.digimon.findUnique({
    where: { id },
    include: {
      types: true, families: true, groups: true, base: { select: { id: true, name: true } },
      attacks: { orderBy: { order: "asc" }, include: { source: true } },
      abilities: { include: { source: true } },
      trivia: { include: { source: true } },
      appearances: { include: { media: true, source: true }, orderBy: { media: { year: "asc" } } },
      citations: { include: { source: true } },
      evolutionsFrom: { include: { to: { select: { name: true } } } },
      evolutionsTo: { include: { from: { select: { name: true } } } },
      partnerIn: { include: { evolution: { include: { to: { select: { name: true } }, from: { select: { name: true } } } } } },
    },
  });
  if (!d) notFound();
  const [sources, media] = await Promise.all([sourceOptions(), mediaOptions()]);
  const ret = `/admin/digimon/${d.id}`;
  const Hidden = () => (<><input type="hidden" name="digimonId" value={d.id} /><input type="hidden" name="returnTo" value={ret} /></>);
  const del = (kind: string, itemId: number) => <DeleteButton action={deleteChild} fields={{ kind, id: itemId, returnTo: ret }} compact label="Remover" />;
  const evolutions = [
    ...d.evolutionsTo.map((e) => ({ id: e.id, label: `${e.from.name} → ${d.name}`, kind: e.kind, status: e.status })),
    ...d.evolutionsFrom.map((e) => ({ id: e.id, label: `${d.name} → ${e.to.name}`, kind: e.kind, status: e.status })),
    ...d.partnerIn.map(({ evolution: e }) => ({ id: e.id, label: `${e.from.name} + ${d.name} → ${e.to.name}`, kind: e.kind, status: e.status })),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminTitle title={`Editar ${d.name}`} subtitle={`/digimon/${d.slug}`}
        actions={<>
          <Link href={`/digimon/${d.slug}`} className="btn btn-ghost" target="_blank"><ExternalLink size={15} /> Ver página</Link>
          <DeleteButton action={deleteDigimon} fields={{ id: d.id }} confirmText={`Excluir ${d.name} e todas as suas evoluções, golpes e aparições? Esta ação não pode ser desfeita.`} />
        </>} />
      <Flash ok={ok} erro={erro} />
      <DigimonForm d={d} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Imagem" description="Envie uma imagem oficial ou de referência (até 5 MB). Informe o crédito.">
          <div className="flex gap-4">
            <DigimonAvatar name={d.name} imageUrl={d.imageUrl} className="h-24 w-24 shrink-0" />
            <form action={uploadImage} className="flex-1 space-y-2">
              <input type="hidden" name="id" value={d.id} />
              <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="block w-full text-sm file:mr-3 file:rounded-[4px] file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:text-fg" />
              <Input label="Crédito" name="imageCredit" defaultValue={d.imageCredit} placeholder="ex.: © Bandai" />
              <SubmitButton className="btn btn-ghost">Enviar imagem</SubmitButton>
            </form>
          </div>
        </Panel>

        <Panel title={`Evoluções (${evolutions.length})`} actions={<Link href={`/admin/evolucoes/nova?from=${d.id}`} className="btn btn-ghost py-1.5 text-xs"><Plus size={14} /> Nova</Link>}>
          <ul className="divide-y divide-line text-sm">
            {evolutions.map((e) => (
              <li key={`${e.id}-${e.label}`} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/evolucoes/${e.id}`} className="hover:text-primary">{e.label}</Link>
                <span className="flex gap-1">{e.kind !== "normal" && <EvoKindBadge kind={e.kind} />}<StatusBadge status={e.status} compact /></span>
              </li>
            ))}
          </ul>
          <Link href={`/linhas/${d.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"><GitBranch size={13} /> Ver árvore pública</Link>
        </Panel>

        <Panel title={`Golpes e ataques (${d.attacks.length})`}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {d.attacks.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 py-2">
                <div><b>{a.name}</b>{a.localizedName && <span className="text-muted"> (localizado: {a.localizedName})</span>} <StatusBadge status={a.status} compact />{a.description && <div className="text-xs text-muted">{a.description}</div>}</div>
                {del("attack", a.id)}
              </li>
            ))}
          </ul>
          <form action={addAttack} className="grid gap-2 sm:grid-cols-2">
            <Hidden />
            <Input label="Nome original" name="name" required />
            <Input label="Nome localizado (dublagem)" name="localizedName" />
            <Textarea label="Descrição" name="description" rows={2} className="sm:col-span-2" />
            <Select label="Confiabilidade" name="status" defaultValue="official" options={statusOptions} />
            <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
            <div className="sm:col-span-2"><SubmitButton className="btn btn-ghost">Adicionar golpe</SubmitButton></div>
          </form>
        </Panel>

        <Panel title={`Habilidades especiais (${d.abilities.length})`}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {d.abilities.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 py-2">
                <div><b>{a.name}</b>{a.description && <div className="text-xs text-muted">{a.description}</div>}</div>
                {del("ability", a.id)}
              </li>
            ))}
          </ul>
          <form action={addAbility} className="grid gap-2 sm:grid-cols-2">
            <Hidden />
            <Input label="Nome" name="name" required />
            <Select label="Confiabilidade" name="status" defaultValue="official" options={statusOptions} />
            <Textarea label="Descrição" name="description" rows={2} className="sm:col-span-2" />
            <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
            <div className="self-end"><SubmitButton className="btn btn-ghost">Adicionar habilidade</SubmitButton></div>
          </form>
        </Panel>

        <Panel title={`Curiosidades (${d.trivia.length})`}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {d.trivia.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-2 py-2">
                <div>{t.text} <StatusBadge status={t.status} compact /></div>
                {del("trivia", t.id)}
              </li>
            ))}
          </ul>
          <form action={addTrivia} className="grid gap-2 sm:grid-cols-2">
            <Hidden />
            <Textarea label="Curiosidade" name="text" rows={2} className="sm:col-span-2" />
            <Select label="Confiabilidade" name="status" defaultValue="unconfirmed" options={statusOptions} />
            <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
            <div className="sm:col-span-2"><SubmitButton className="btn btn-ghost">Adicionar curiosidade</SubmitButton></div>
          </form>
        </Panel>

        <Panel title={`Fontes e referências (${d.citations.length})`} description="Associe fontes ao registro inteiro (*) ou a campos específicos.">
          <ul className="mb-4 divide-y divide-line text-sm">
            {d.citations.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 py-2">
                <div><b>{c.source.title}</b> <span className="text-xs text-muted">[{c.field}]</span>{c.note && <div className="text-xs text-muted">{c.note}</div>}</div>
                {del("citation", c.id)}
              </li>
            ))}
          </ul>
          <form action={addCitation} className="grid gap-2 sm:grid-cols-2">
            <Hidden />
            <Select label="Fonte" name="sourceId" required empty="— Escolha —" options={sources} />
            <Select label="Campo" name="field" defaultValue="*" options={[["*", "Registro inteiro"], ["summary", "Descrição"], ["attribute", "Atributo"], ["stage", "Estágio"], ["types", "Tipo"], ["families", "Família"], ["nameMeaning", "Significado do nome"], ["designOrigin", "Origem do design"], ["firstAppearance", "Primeira aparição"], ["powerLevel", "Nível de poder"]]} />
            <Input label="Link específico" name="url" placeholder="https://..." />
            <Input label="Observação" name="note" />
            <div className="sm:col-span-2"><SubmitButton className="btn btn-ghost">Associar fonte</SubmitButton></div>
          </form>
        </Panel>
      </div>

      <Panel title={`Aparições (${d.appearances.length})`} description="Em qual obra aparece, participação e forma apresentada.">
        <div className="scroll-slim mb-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <tbody className="divide-y divide-line">
              {d.appearances.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 pr-3 font-semibold">{a.media.name}</td>
                  <td className="py-2 pr-3 text-muted">{[a.role, a.form].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="py-2 pr-3"><StatusBadge status={a.status} compact /></td>
                  <td className="py-2 text-right">{del("appearance", a.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={saveAppearance} className="grid gap-2 sm:grid-cols-3">
          <Hidden />
          <Select label="Obra" name="mediaId" required empty="— Escolha —" options={media} />
          <Input label="Participação" name="role" placeholder="ex.: Parceiro de..." />
          <Input label="Forma apresentada" name="form" />
          <Select label="Confiabilidade" name="status" defaultValue="media" options={statusOptions} />
          <Select label="Fonte" name="sourceId" empty="— Sem fonte —" options={sources} />
          <div className="self-end"><SubmitButton className="btn btn-ghost">Salvar aparição</SubmitButton></div>
        </form>
      </Panel>
    </div>
  );
}
