import { AdminTitle, Flash } from "../../_components/form";
import { DigimonForm } from "../digimon-form";
import type { SP } from "../../_lib";

export default async function NewDigimon({ searchParams }: { searchParams: SP }) {
  const { erro } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Novo Digimon" subtitle="Preencha apenas o que tiver fonte. Golpes, curiosidades, aparições e fontes podem ser adicionados após criar o registro." />
      <Flash erro={erro} />
      <DigimonForm />
    </div>
  );
}
