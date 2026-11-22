import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";
import { Container, Missing, PageHeader } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { EvoKindBadge, StatusBadge } from "@/components/badges";
import { DigimonPickerNav } from "@/components/digimon-picker-nav";
import { MEDIA_KINDS, mediaKindOf } from "@/lib/constants";
import { cn, param, paramList } from "@/lib/utils";

export const metadata: Metadata = { title: "Comparar entre jogos e mídias" };

type SP = Promise<Record<string, string | string[] | undefined>>;
type Cell = { requirements: string | null; notes: string | null; status: string } | null;

export default async function CompareUniverses({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const slug = param(sp.digimon);
  const wanted = paramList(sp.m);
  const allMedia = await db.media.findMany({ orderBy: [{ year: "asc" }], include: { features: { where: { category: "evolution-system" }, take: 1 }, stages: { include: { stage: true } } } });

  const d = slug
    ? await db.digimon.findUnique({
        where: { slug },
        include: {
          stage: true,
          attribute: true,
          appearances: { include: { media: true } },
          evolutionsFrom: { where: { imported: false }, include: { to: { select: cardSelect }, partners: { include: { digimon: { select: { name: true } } } }, contexts: { include: { media: true } } } },
          evolutionsTo: { where: { imported: false }, include: { from: { select: cardSelect }, partners: { include: { digimon: { select: { name: true } } } }, contexts: { include: { media: true } } } },
          partnerIn: { include: { evolution: { include: { to: { select: cardSelect }, from: { select: { name: true } }, contexts: { include: { media: true } } } } } },
        },
      })
    : null;

  const relevantIds = new Set<number>();
  if (d) {
    d.appearances.forEach((a) => relevantIds.add(a.mediaId));
    [...d.evolutionsFrom, ...d.evolutionsTo, ...d.partnerIn.map((p) => p.evolution)].forEach((e) => e.contexts.forEach((c) => relevantIds.add(c.mediaId)));
  }
  const relevant = allMedia.filter((m) => (d ? relevantIds.has(m.id) : true));
  let selected = wanted.length ? allMedia.filter((m) => wanted.includes(m.slug)) : relevant.filter((m) => m.kind === "game");
  if (!selected.length) selected = relevant.slice(0, 4);

  const hrefWith = (mSlugs: string[]) => {
    const qs = new URLSearchParams();
    if (slug) qs.set("digimon", slug);
    if (mSlugs.length) qs.set("m", mSlugs.join(","));
    return `/universos/comparar?${qs}`;
  };
  const selSlugs = selected.map((m) => m.slug);

  type Row = { key: string; target: { slug: string; name: string; imageUrl: string | null; stage: { color: string } | null; attribute: { color: string } | null }; label: string; kind: string; status: string; cells: Map<number, Cell> };
  const rows = (list: { id: number; kind: string; status: string; label: string; target: Row["target"]; contexts: { mediaId: number; requirements: string | null; notes: string | null; status: string }[] }[]) =>
    list.map<Row>((e) => ({
      key: `${e.id}`,
      target: e.target,
      label: e.label,
      kind: e.kind,
      status: e.status,
      cells: new Map(e.contexts.map((c) => [c.mediaId, { requirements: c.requirements, notes: c.notes, status: c.status }])),
    }));

  const nextRows = d
    ? rows([
        ...d.evolutionsFrom.map((e) => ({ ...e, target: e.to, label: e.partners.length ? `com ${e.partners.map((p) => p.digimon.name).join(", ")}` : "" })),
        ...d.partnerIn.map(({ evolution: e }) => ({ ...e, target: e.to, label: `com ${e.from.name}` })),
      ])
    : [];
  const prevRows = d ? rows(d.evolutionsTo.map((e) => ({ ...e, target: e.from, label: e.partners.length ? `+ ${e.partners.map((p) => p.digimon.name).join(", ")}` : "" }))) : [];

  return (
    <div>
      <PageHeader
        crumbs={[["/universos", "Universos"], [null, "Comparar entre obras"]]}
        eyebrow="Digimon por Universo"
        title="Como um Digimon muda entre jogos e mídias"
        subtitle="Escolha um Digimon e as obras para comparar. Cada jogo tem seu próprio sistema — células vazias significam que a evolução não está registrada naquela obra, não que ela seja impossível."
      >
        <div className="max-w-md">
          <DigimonPickerNav basePath="/universos/comparar" param="digimon" keep={{ m: wanted.join(",") }} placeholder={d ? `Trocar Digimon (atual: ${d.name})` : "Escolha um Digimon..."} />
        </div>
      </PageHeader>
      <Container className="space-y-8 py-8">
        <div className="card p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Obras na comparação {d && "(destacadas: onde há dados deste Digimon)"}</div>
          <div className="flex flex-wrap gap-1.5">
            {allMedia.map((m) => {
              const on = selSlugs.includes(m.slug);
              const rel = relevantIds.has(m.id);
              return (
                <Link key={m.id} href={hrefWith(on ? selSlugs.filter((s) => s !== m.slug) : [...selSlugs, m.slug])}
                  className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition", on ? "border-accent/60 bg-accent/10 text-fg" : rel ? "border-line text-fg hover:border-fg/40" : "border-line/60 text-muted/70 hover:text-fg")}>
                  {on && <Check size={11} className="mr-1 inline" />}{m.name}
                </Link>
              );
            })}
          </div>
        </div>

        {!d ? (
          <div className="card p-8 text-center text-muted">Escolha um Digimon acima para montar a comparação. Exemplo: <Link className="text-accent hover:underline" href={hrefWith(["digital-monster-ver-1", "digimon-world", "digimon-adventure", "digimon-story-cyber-sleuth"]) + "&digimon=agumon"}>Agumon no V-Pet, Digimon World, Adventure e Cyber Sleuth</Link>.</div>
        ) : (
          <div className="card scrollbar-thin overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 260 + selected.length * 190 }}>
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-10 w-64 bg-surface p-3 text-left align-bottom">
                    <div className="flex items-center gap-3">
                      <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} accent={d.attribute?.color} className="h-12 w-12" />
                      <div>
                        <Link href={`/digimon/${d.slug}`} className="font-display text-lg font-bold hover:text-primary">{d.name}</Link>
                        <div className="text-xs font-normal text-muted">{d.stage?.name}</div>
                      </div>
                    </div>
                  </th>
                  {selected.map((m) => (
                    <th key={m.id} className="p-3 text-left align-bottom">
                      <Link href={`/universos/${m.slug}`} className="block font-semibold leading-tight hover:text-primary">{m.name}</Link>
                      <div className="text-xs font-normal text-muted">{MEDIA_KINDS[mediaKindOf(m.kind)].label}{m.year ? ` · ${m.year}` : ""}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <GroupRow title="Visão geral" span={selected.length} />
                <tr className="border-b border-line/60">
                  <RowHead>Aparece na obra</RowHead>
                  {selected.map((m) => {
                    const a = d.appearances.find((x) => x.mediaId === m.id);
                    return <td key={m.id} className="p-3 align-top">{a ? <span><Check size={14} className="inline text-green-500" /> {a.role ?? "Sim"}{a.form ? ` · ${a.form}` : ""}</span> : <Missing>Não registrado</Missing>}</td>;
                  })}
                </tr>
                <tr className="border-b border-line/60">
                  <RowHead>Sistema de evolução</RowHead>
                  {selected.map((m) => (
                    <td key={m.id} className="p-3 align-top text-xs text-muted">{m.features[0] ? <><b className="text-fg">{m.features[0].title}.</b> {m.features[0].body}</> : <Missing>Não cadastrado</Missing>}</td>
                  ))}
                </tr>
                <tr className="border-b border-line/60">
                  <RowHead>Estágios disponíveis</RowHead>
                  {selected.map((m) => (
                    <td key={m.id} className="p-3 align-top text-xs text-muted">{m.stages.length ? m.stages.sort((a, b) => a.stage.order - b.stage.order).map((s) => s.stage.name).join(", ") : <Missing>Não cadastrado</Missing>}</td>
                  ))}
                </tr>
                <GroupRow title="Evolui a partir de" span={selected.length} />
                <EvoRows rows={prevRows} media={selected} />
                <GroupRow title="Pode evoluir para" span={selected.length} />
                <EvoRows rows={nextRows} media={selected} />
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}

function RowHead({ children }: { children: React.ReactNode }) {
  return <th className="sticky left-0 z-10 bg-surface p-3 text-left align-top text-xs font-semibold uppercase tracking-wide text-muted">{children}</th>;
}
function GroupRow({ title, span }: { title: string; span: number }) {
  return (
    <tr className="bg-surface-2/60">
      <td colSpan={span + 1} className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-accent">{title}</td>
    </tr>
  );
}

function EvoRows({ rows, media }: { rows: { key: string; target: { slug: string; name: string; imageUrl: string | null; stage: { color: string } | null; attribute: { color: string } | null }; label: string; kind: string; status: string; cells: Map<number, Cell> }[]; media: { id: number }[] }) {
  if (!rows.length)
    return (
      <tr><td colSpan={media.length + 1} className="p-3"><Missing>Nenhuma evolução cadastrada.</Missing></td></tr>
    );
  return (
    <>
      {rows.map((r) => (
        <tr key={r.key} className="border-b border-line/60 hover:bg-surface-2/40">
          <th className="sticky left-0 z-10 bg-surface p-3 text-left align-top font-normal">
            <Link href={`/digimon/${r.target.slug}`} className="flex items-center gap-2 font-semibold hover:text-primary">
              <DigimonAvatar name={r.target.name} imageUrl={r.target.imageUrl} color={r.target.stage?.color} accent={r.target.attribute?.color} className="h-8 w-8" rounded="rounded-[4px]" />
              {r.target.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {r.kind !== "normal" && <EvoKindBadge kind={r.kind} />}
              {r.label && <span className="text-xs text-muted">{r.label}</span>}
            </div>
          </th>
          {media.map((m) => {
            const c = r.cells.get(m.id);
            return (
              <td key={m.id} className={cn("p-3 align-top", c && "bg-green-500/5")}>
                {c ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-green-500"><Check size={14} /> <span className="text-xs font-semibold">Registrada</span></div>
                    <div className="text-xs">{c.requirements ?? <span className="italic text-muted">Requisitos não documentados</span>}</div>
                    {c.notes && <div className="text-xs text-muted">{c.notes}</div>}
                    {c.status !== "media" && <StatusBadge status={c.status} />}
                  </div>
                ) : (
                  <Minus size={14} className="text-muted/50" aria-label="Não registrada nesta obra" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
