import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AdminTitle, Flash } from "../_components/form";
import { EvoKindBadge, StatusBadge } from "@/components/badges";
import { Pagination } from "@/components/ui";
import { EVOLUTION_KINDS, STATUSES } from "@/lib/constants";
import type { SP } from "../_lib";

const PAGE = 50;

export default async function AdminEvolutions({ searchParams }: { searchParams: SP }) {
  const { q, kind, status, ok, erro, pagina } = await searchParams;
  const page = Number(pagina) || 1;
  const where: Prisma.EvolutionWhereInput = {
    ...(q ? { OR: [{ from: { name: { contains: q } } }, { to: { name: { contains: q } } }, { partners: { some: { digimon: { name: { contains: q } } } } }] } : {}),
    ...(kind ? { kind } : {}),
    ...(status ? { status } : {}),
  };
  const [total, items] = await Promise.all([
    db.evolution.count({ where }),
    db.evolution.findMany({
      where, skip: (page - 1) * PAGE, take: PAGE, orderBy: [{ from: { number: "asc" } }],
      include: { from: { select: { name: true } }, to: { select: { name: true } }, partners: { include: { digimon: { select: { name: true } } } }, _count: { select: { contexts: true } } },
    }),
  ]);
  const qs = (p: number) => `/admin/evolucoes?${new URLSearchParams({ ...(q ? { q } : {}), ...(kind ? { kind } : {}), ...(status ? { status } : {}), pagina: String(p) })}`;
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Evoluções" subtitle={`${total} conexões. Cada evolução tem tipo, confiabilidade, fonte e contexto por mídia.`} actions={<Link href="/admin/evolucoes/nova" className="btn btn-primary"><Plus size={16} /> Nova evolução</Link>} />
      <Flash ok={ok} erro={erro} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Digimon de origem, destino ou parceiro" className="input max-w-xs" />
        <select name="kind" defaultValue={kind ?? ""} className="input w-auto"><option value="">Todos os tipos</option>{Object.entries(EVOLUTION_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select name="status" defaultValue={status ?? ""} className="input w-auto"><option value="">Toda confiabilidade</option>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button className="btn btn-ghost"><Search size={15} /> Filtrar</button>
      </form>
      <div className="card divide-y divide-line">
        {items.map((e) => (
          <Link key={e.id} href={`/admin/evolucoes/${e.id}`} className="flex flex-col gap-2 p-3 text-sm hover:bg-surface-2/50 sm:flex-row sm:items-center">
            <span className="flex-1">
              <b>{e.from.name}</b>{e.partners.map((p) => <span key={p.digimonId}> + <b>{p.digimon.name}</b></span>)} <span className="text-muted">→</span> <b>{e.to.name}</b>
              <span className="ml-2 text-xs text-muted">{e._count.contexts} mídia(s)</span>
            </span>
            <span className="flex gap-1"><EvoKindBadge kind={e.kind} /><StatusBadge status={e.status} /></span>
          </Link>
        ))}
        {!items.length && <p className="p-6 text-center text-sm text-muted">Nenhuma evolução encontrada.</p>}
      </div>
      <Pagination page={page} total={total} pageSize={PAGE} makeHref={qs} />
    </div>
  );
}
