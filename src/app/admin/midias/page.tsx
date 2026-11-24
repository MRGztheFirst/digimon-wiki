import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { AdminTitle, Flash } from "../_components/form";
import { MEDIA_KINDS, mediaKindOf } from "@/lib/constants";
import { yearRange } from "@/lib/utils";
import type { SP } from "../_lib";

export default async function AdminMedia({ searchParams }: { searchParams: SP }) {
  const { ok, erro } = await searchParams;
  const media = await db.media.findMany({ orderBy: [{ kind: "asc" }, { year: "asc" }], include: { _count: { select: { appearances: true, evolutionContexts: true, features: true } } } });
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Jogos e mídias" subtitle="Animes, filmes, mangás, jogos, V-Pets e card games." actions={<Link href="/admin/midias/nova" className="btn btn-primary"><Plus size={16} /> Nova obra</Link>} />
      <Flash ok={ok} erro={erro} />
      <div className="card scroll-slim overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">Obra</th><th className="p-3">Tipo</th><th className="p-3">Ano</th><th className="p-3">Aparições</th><th className="p-3">Evoluções</th><th className="p-3">Sistemas</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {media.map((m) => (
              <tr key={m.id} className="hover:bg-surface-2/50">
                <td className="p-3"><Link href={`/admin/midias/${m.id}`} className="font-semibold hover:text-primary">{m.name}</Link></td>
                <td className="p-3">{MEDIA_KINDS[mediaKindOf(m.kind)].label}</td>
                <td className="p-3">{yearRange(m.year, m.endYear)}</td>
                <td className="p-3">{m._count.appearances}</td>
                <td className="p-3">{m._count.evolutionContexts}</td>
                <td className="p-3">{m._count.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
