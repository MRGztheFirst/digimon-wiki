"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { useFormStatus } from "react-dom";

type Picked = { id: number; name: string };

export function DigimonPicker({ name, label, initial, required }: { name: string; label: string; initial?: Picked | null; required?: boolean }) {
  const [value, setValue] = useState<Picked | null>(initial ?? null);
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}{required && <span className="text-primary"> *</span>}</span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      {value ? (
        <div className="flex items-center justify-between rounded-[0.65rem] border border-line bg-surface-2 px-3 py-2 text-sm">
          <span className="font-semibold">{value.name}</span>
          <button type="button" onClick={() => setValue(null)} className="text-muted hover:text-fg" aria-label="Trocar"><X size={15} /></button>
        </div>
      ) : (
        <SearchBox compact placeholder="Buscar Digimon..." onPick={(r) => setValue({ id: r.id, name: r.name })} />
      )}
    </div>
  );
}

export function DigimonMultiPicker({ name, label, initial = [], hint }: { name: string; label: string; initial?: Picked[]; hint?: string }) {
  const [values, setValues] = useState<Picked[]>(initial);
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {values.map((v) => <input key={v.id} type="hidden" name={name} value={v.id} />)}
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold">
              {v.name}
              <button type="button" onClick={() => setValues(values.filter((x) => x.id !== v.id))} aria-label={`Remover ${v.name}`}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <SearchBox compact placeholder="Adicionar Digimon..." onPick={(r) => !values.some((v) => v.id === r.id) && setValues([...values, { id: r.id, name: r.name }])} />
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? "Salvando..." : children}
    </button>
  );
}

export function DeleteButton({ action, fields, label = "Excluir", confirmText = "Tem certeza? Esta ação não pode ser desfeita.", compact }: {
  action: (fd: FormData) => Promise<void>; fields: Record<string, string | number>; label?: string; confirmText?: string; compact?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={compact ? "rounded-md p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500" : "btn btn-danger"} aria-label={label} title={label}>
        <Trash2 size={compact ? 14 : 15} />
        {!compact && label}
      </button>
    </form>
  );
}
