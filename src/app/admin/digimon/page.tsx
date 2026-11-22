import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash } from "../_components/form";
import { Pagination } from "@/components/ui";
import { ReviewBadge } from "@/components/badges";
import { padNumber } from "@/lib/utils";
import type { SP } from "../_lib";

const PAGE = 40;

export default async function AdminDigimonList({ searchParams }: { searchParams: SP }) {
  const { q, ok, erro, pagina, revisao } = await searchParams;
  const page = Number(pagina) || 1;
  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { nameJp: { contains: q } }, { slug: { contains: q } }] } : {}),
    ...(revisao ? { reviewStatus: revisao } : {}),
  };
  const [total, items] = await Promise.all([
    db.digimon.count({ where }),
    db.digimon.findMany({ where, orderBy: { number: "asc" }, skip: (page - 1) * PAGE, take: PAGE, include: { stage: true, attribute: true, _count: { select: { evolutionsFrom: true, evolutionsTo: true, appearances: true } } } }),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Digimon" subtitle={`${total} registros`} actions={<Link href="/admin/digimon/novo" className="btn btn-primary"><Plus size={16} /> Novo Digimon</Link>} />
      <Flash ok={ok} erro={erro} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nome, nome japonês ou slug" className="input max-w-sm" />
        <select name="revisao" defaultValue={revisao ?? ""} className="input w-auto">
          <option value="">Toda revisão</option>
          <option value="verified">Verificado</option>
          <option value="review">Em revisão</option>
          <option value="draft">Rascunho</option>
        </select>
        <button className="btn btn-ghost"><Search size={15} /> Filtrar</button>
      </form>
      <div className="card scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">Nº</th><th className="p-3">Nome</th><th className="p-3">Estágio</th><th className="p-3">Atributo</th><th className="p-3">Evol.</th><th className="p-3">Apar.</th><th className="p-3">Revisão</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((d) => (
              <tr key={d.id} className="hover:bg-surface-2/50">
                <td className="p-3 font-mono text-xs text-muted">{padNumber(d.number)}</td>
                <td className="p-3"><Link href={`/admin/digimon/${d.id}`} className="font-semibold hover:text-primary">{d.name}</Link> <span className="text-xs text-muted">{d.nameJp}</span></td>
                <td className="p-3">{d.stage?.name ?? "—"}</td>
                <td className="p-3">{d.attribute?.name.split(" (")[0] ?? "—"}</td>
                <td className="p-3">{d._count.evolutionsFrom + d._count.evolutionsTo}</td>
                <td className="p-3">{d._count.appearances}</td>
                <td className="p-3"><ReviewBadge status={d.reviewStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE} makeHref={(p) => `/admin/digimon?${new URLSearchParams({ ...(q ? { q } : {}), ...(revisao ? { revisao } : {}), pagina: String(p) })}`} />
    </div>
  );
}
