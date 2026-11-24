import Link from "next/link";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash, Panel } from "./_components/form";
import { REVIEW_STATUSES, STATUSES, type ReviewStatus, type Status } from "@/lib/constants";
import { Pill } from "@/components/badges";
import type { SP } from "./_lib";

export default async function AdminHome({ searchParams }: { searchParams: SP }) {
  const { ok, erro } = await searchParams;
  const [counts, review, evoStatus, noEvo, noAttr, noSummary, noImage, recent] = await Promise.all([
    Promise.all([db.digimon.count(), db.evolution.count(), db.appearance.count(), db.media.count(), db.source.count(), db.trivia.count()]),
    db.digimon.groupBy({ by: ["reviewStatus"], _count: { _all: true } }),
    db.evolution.groupBy({ by: ["status"], _count: { _all: true } }),
    db.digimon.findMany({ where: { evolutionsFrom: { none: {} }, evolutionsTo: { none: {} }, partnerIn: { none: {} } }, select: { id: true, name: true }, take: 30 }),
    db.digimon.count({ where: { attributeId: null } }),
    db.digimon.count({ where: { summary: null } }),
    db.digimon.count({ where: { imageUrl: null } }),
    db.digimon.findMany({ orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, name: true, updatedAt: true, reviewStatus: true } }),
  ]);
  const [nD, nE, nA, nM, nS, nT] = counts;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Painel" subtitle="Visão geral do conteúdo e da qualidade dos dados."
        actions={<><Link href="/admin/digimon/novo" className="btn btn-primary"><Plus size={16} /> Digimon</Link><Link href="/admin/evolucoes/nova" className="btn btn-ghost"><Plus size={16} /> Evolução</Link></>} />
      <Flash ok={ok} erro={erro} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[[nD, "Digimon", "/admin/digimon"], [nE, "Evoluções", "/admin/evolucoes"], [nA, "Aparições", "/admin/aparicoes"], [nM, "Mídias", "/admin/midias"], [nS, "Fontes", "/admin/fontes"], [nT, "Curiosidades", "/admin/digimon"]].map(([n, l, h]) => (
          <Link key={l as string} href={h as string} className="card p-4 hover:border-fg/40">
            <div className="text-xs text-muted">{l}</div>
            <div className="font-display text-2xl font-bold">{n}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revisão editorial" description="Registros que ainda precisam ser conferidos com fontes.">
          <div className="flex flex-wrap gap-2">
            {review.map((r) => {
              const s = REVIEW_STATUSES[r.reviewStatus as ReviewStatus];
              return <Pill key={r.reviewStatus} color={s?.color}>{s?.label ?? r.reviewStatus}: {r._count._all}</Pill>;
            })}
          </div>
          <div className="mt-4 text-sm font-semibold">Evoluções por confiabilidade</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {evoStatus.map((r) => {
              const s = STATUSES[r.status as Status];
              return <Link key={r.status} href={`/admin/evolucoes?status=${r.status}`}><Pill color={s?.color}>{s?.label ?? r.status}: {r._count._all}</Pill></Link>;
            })}
          </div>
        </Panel>
        <Panel title="Qualidade dos dados">
          <ul className="space-y-2 text-sm">
            <Quality n={noAttr} label="Digimon sem atributo cadastrado" />
            <Quality n={noSummary} label="Digimon sem descrição geral" />
            <Quality n={noImage} label="Digimon sem imagem" />
            <Quality n={noEvo.length} label="Digimon sem nenhuma evolução" />
          </ul>
          {noEvo.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {noEvo.map((d) => <Link key={d.id} href={`/admin/digimon/${d.id}`} className="rounded-full bg-surface-2 px-2 py-0.5 hover:text-primary">{d.name}</Link>)}
            </div>
          )}
        </Panel>
        <Panel title="Editados recentemente" className="lg:col-span-2">
          <ul className="divide-y divide-line text-sm">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/digimon/${d.id}`} className="font-medium hover:text-primary">{d.name}</Link>
                <span className="text-xs text-muted">{d.updatedAt.toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Quality({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {n === 0 ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
      <span className="flex-1">{label}</span>
      <b>{n}</b>
    </li>
  );
}
