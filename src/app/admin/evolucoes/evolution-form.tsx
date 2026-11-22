import { EVOLUTION_KINDS } from "@/lib/constants";
import { saveEvolution } from "../actions";
import { Input, Panel, Select, Textarea } from "../_components/form";
import { DigimonMultiPicker, DigimonPicker, SubmitButton } from "../_components/client";
import { sourceOptions, statusOptions } from "../_lib";

type Picked = { id: number; name: string };
export type EvolutionFormData = {
  id: number; from: Picked; to: Picked; partners: Picked[]; kind: string; status: string;
  requirements: string | null; notes: string | null; sourceId: number | null;
};

export async function EvolutionForm({ e, presetFrom }: { e?: EvolutionFormData; presetFrom?: Picked | null }) {
  const sources = await sourceOptions();
  return (
    <form action={saveEvolution}>
      {e && <input type="hidden" name="id" value={e.id} />}
      <Panel title="Conexão evolutiva" description="Uma evolução nunca é obrigatória: registre cada possibilidade separadamente, com sua origem.">
        <div className="grid gap-4 md:grid-cols-2">
          <DigimonPicker name="fromId" label="Digimon de origem" initial={e?.from ?? presetFrom ?? null} required />
          <DigimonPicker name="toId" label="Digimon de destino" initial={e?.to ?? null} required />
          <div className="md:col-span-2">
            <DigimonMultiPicker name="partnerIds" label="Outros participantes (DNA / fusão)" initial={e?.partners ?? []} hint="Para DNA Digivolution e fusões, adicione os demais Digimon envolvidos." />
          </div>
          <Select label="Tipo de evolução" name="kind" defaultValue={e?.kind ?? "normal"} options={Object.entries(EVOLUTION_KINDS).map(([k, v]) => [k, v.label])} />
          <Select label="Confiabilidade" name="status" defaultValue={e?.status ?? "unconfirmed"} options={statusOptions} />
          <Input label="Requisitos gerais" name="requirements" defaultValue={e?.requirements} hint="Requisitos específicos de cada jogo ficam nos contextos por mídia." />
          <Select label="Fonte" name="sourceId" defaultValue={e?.sourceId} empty="— Sem fonte —" options={sources} />
          <Textarea label="Observações" name="notes" defaultValue={e?.notes} className="md:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end"><SubmitButton>{e ? "Salvar evolução" : "Criar evolução"}</SubmitButton></div>
      </Panel>
    </form>
  );
}
