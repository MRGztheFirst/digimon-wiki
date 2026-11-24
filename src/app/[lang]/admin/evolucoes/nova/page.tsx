import { db } from "@/lib/db";
import { AdminTitle, Flash } from "../../_components/form";
import { EvolutionForm } from "../evolution-form";
import type { SP } from "../../_lib";

export default async function NewEvolution({ searchParams }: { searchParams: SP }) {
  const { erro, from } = await searchParams;
  const preset = from ? await db.digimon.findUnique({ where: { id: Number(from) }, select: { id: true, name: true } }) : null;
  return (
    <div className="mx-auto max-w-4xl">
      <AdminTitle title="Nova evolução" subtitle="Depois de criar, adicione em quais jogos/mídias ela aparece e os requisitos de cada um." />
      <Flash erro={erro} />
      <EvolutionForm presetFrom={preset} />
    </div>
  );
}
