import Link from "next/link";
import type { Metadata } from "next";
import { X } from "lucide-react";
import { db } from "@/lib/db";
import { Container, Missing, PageHeader } from "@/components/ui";
import { DigimonAvatar } from "@/components/digimon-avatar";
import { AttributeBadge, EvoKindBadge, Pill, StageBadge, StatusBadge } from "@/components/badges";
import { DigimonPickerNav } from "@/components/digimon-picker-nav";
import { paramList } from "@/lib/utils";

export const metadata: Metadata = { title: "Comparador de Digimon" };

const MAX = 4;

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const slugs = [...new Set(paramList(sp.d))].slice(0, MAX);
  const found = await db.digimon.findMany({
    where: { slug: { in: slugs } },
    include: {
      stage: true,
      attribute: true,
      types: { include: { type: true } },
      families: { include: { family: true } },
      groups: { include: { group: true } },
      attacks: { orderBy: { order: "asc" } },
      abilities: true,
      appearances: { include: { media: true } },
      evolutionsFrom: { include: { to: { select: { name: true, slug: true } }, contexts: { include: { media: { select: { name: true, kind: true } } } } } },
      evolutionsTo: { include: { from: { select: { name: true, slug: true } } } },
    },
  });
  const list = slugs.map((s) => found.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => !!d);
  const href = (s: string[]) => (s.length ? `/comparar?d=${s.join(",")}` : "/comparar");

  const mediaSets = list.map((d) => new Set(d.appearances.map((a) => a.media.name)));
  const shared = mediaSets.length > 1 ? [...mediaSets[0]].filter((m) => mediaSets.every((s) => s.has(m))) : [];

  const rows: [string, (d: (typeof list)[number]) => React.ReactNode, ((d: (typeof list)[number]) => string)?][] = [
    ["Estágio", (d) => <StageBadge stage={d.stage} />, (d) => d.stage?.slug ?? ""],
    ["Atributo", (d) => <AttributeBadge attribute={d.attribute} />, (d) => d.attribute?.slug ?? ""],
    ["Tipo", (d) => (d.types.length ? d.types.map((t) => t.type.name).join(", ") : null), (d) => d.types.map((t) => t.typeId).sort().join()],
    ["Família", (d) => (d.families.length ? (
      <span className="flex flex-wrap gap-1">{d.families.map((f) => <Pill key={f.familyId} color={f.family.color}>{f.family.name}{f.status !== "official" ? " (?)" : ""}</Pill>)}</span>
    ) : null), (d) => d.families.map((f) => f.familyId).sort().join()],
    ["Grupo", (d) => (d.groups.length ? d.groups.map((g) => g.group.name).join(", ") : null)],
    ["Habilidades", (d) => (d.abilities.length ? d.abilities.map((a) => a.name).join(", ") : null)],
    ["Golpes", (d) => (d.attacks.length ? <ul className="space-y-0.5">{d.attacks.map((a) => <li key={a.id}>{a.name}{a.localizedName ? <span className="text-muted"> ({a.localizedName})</span> : null}</li>)}</ul> : null)],
    ["Evolui de", (d) => (d.evolutionsTo.length ? d.evolutionsTo.map((e) => <Link key={e.id} href={`/digimon/${e.from.slug}`} className="mr-2 text-accent hover:underline">{e.from.name}</Link>) : null)],
    ["Evolui para", (d) => (d.evolutionsFrom.length ? (
      <ul className="space-y-1">{d.evolutionsFrom.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center gap-1">
          <Link href={`/digimon/${e.to.slug}`} className="text-accent hover:underline">{e.to.name}</Link>
          {e.kind !== "normal" && <EvoKindBadge kind={e.kind} />}
          {e.status !== "official" && <StatusBadge status={e.status} compact />}
        </li>
      ))}</ul>
    ) : null)],
    ["Diferenças entre jogos", (d) => {
      const games = new Map<string, string[]>();
      d.evolutionsFrom.forEach((e) => e.contexts.filter((c) => c.media.kind === "game").forEach((c) => games.set(c.media.name, [...(games.get(c.media.name) ?? []), e.to.name])));
      return games.size ? (
        <ul className="space-y-1 text-xs">{[...games].map(([g, t]) => <li key={g}><b>{g}:</b> {t.join(", ")}</li>)}</ul>
      ) : null;
    }],
    ["Aparições", (d) => (d.appearances.length ? <span className="text-xs">{d.appearances.map((a) => a.media.name).join(" · ")}</span> : null)],
  ];

  return (
    <div>
      <PageHeader crumbs={[[null, "Comparador"]]} eyebrow="Ferramenta" title="Comparador de Digimon" subtitle={`Selecione até ${MAX} Digimon para comparar classificação, golpes, evoluções e aparições lado a lado. Linhas com valores diferentes ficam destacadas.`}>
        {list.length < MAX && (
          <div className="max-w-md">
            <DigimonPickerNav basePath="/comparar" param="d" append={list.map((d) => d.slug)} placeholder="Adicionar Digimon à comparação..." />
          </div>
        )}
      </PageHeader>
      <Container className="py-8">
        {list.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            Adicione Digimon usando a busca acima. Exemplos:{" "}
            <Link href="/comparar?d=wargreymon,metalgarurumon,omnimon" className="text-accent hover:underline">WarGreymon × MetalGarurumon × Omegamon</Link>
            {" · "}
            <Link href="/comparar?d=greymon,geogreymon,tyrannomon" className="text-accent hover:underline">Greymon × GeoGreymon × Tyranomon</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {shared.length > 0 && <p className="text-sm text-muted">Aparecem juntos em: <b className="text-fg">{shared.join(", ")}</b></p>}
            <div className="card scrollbar-thin overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: 180 + list.length * 220 }}>
                <thead>
                  <tr className="border-b border-line">
                    <th className="sticky left-0 z-10 w-40 bg-surface p-3" />
                    {list.map((d) => (
                      <th key={d.id} className="p-3 text-left align-top">
                        <div className="relative">
                          <Link href={href(slugs.filter((s) => s !== d.slug))} className="absolute right-0 top-0 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Remover ${d.name}`}><X size={14} /></Link>
                          <DigimonAvatar name={d.name} imageUrl={d.imageUrl} color={d.stage?.color} accent={d.attribute?.color} className="mb-2 aspect-square w-24" />
                          <Link href={`/digimon/${d.slug}`} className="font-display text-lg font-bold hover:text-primary">{d.name}</Link>
                          <div className="text-xs font-normal text-muted">{d.nameJp}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, render, key]) => {
                    const differs = key && list.length > 1 && new Set(list.map(key)).size > 1;
                    return (
                      <tr key={label} className="border-b border-line/60">
                        <th className="sticky left-0 z-10 bg-surface p-3 text-left align-top text-xs font-semibold uppercase tracking-wide text-muted">
                          {label}
                          {differs && <span className="ml-1 rounded bg-primary/15 px-1 text-[10px] normal-case text-primary">difere</span>}
                        </th>
                        {list.map((d) => {
                          const v = render(d);
                          return <td key={d.id} className="p-3 align-top">{v ?? <Missing />}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
