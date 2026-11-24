import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Input({ label, name, defaultValue, type = "text", placeholder, required, hint, className }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; placeholder?: string; required?: boolean; hint?: string; className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}{required && <span className="text-primary"> *</span>}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} className="input" />
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Textarea({ label, name, defaultValue, rows = 3, placeholder, hint, className }: {
  label: string; name: string; defaultValue?: string | null; rows?: number; placeholder?: string; hint?: string; className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} placeholder={placeholder} className="input" />
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Select({ label, name, defaultValue, options, empty, className, required }: {
  label: string; name: string; defaultValue?: string | number | null; options: [string | number, string][]; empty?: string; className?: string; required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}{required && <span className="text-primary"> *</span>}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="input" required={required}>
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked, value }: { label: React.ReactNode; name: string; defaultChecked?: boolean; value?: string | number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--primary)]" />
      {label}
    </label>
  );
}

export function Flash({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  const isErr = !!erro;
  return (
    <div className={cn("fade-in mb-5 flex items-start gap-2 rounded-[4px] border p-3 text-sm", isErr ? "border-red-500/40 bg-red-500/10" : "border-green-500/40 bg-green-500/10")} role={isErr ? "alert" : "status"}>
      {isErr ? <XCircle size={18} className="shrink-0 text-red-500" /> : <CheckCircle2 size={18} className="shrink-0 text-green-500" />}
      {erro ?? ok}
    </div>
  );
}

export function Panel({ title, children, description, actions, className }: { title: string; children: React.ReactNode; description?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card min-w-0 p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function AdminTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
