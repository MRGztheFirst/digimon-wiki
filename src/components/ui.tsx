import Link from "next/link";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-7xl px-4 md:px-6", className)}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: [href: string | null, label: string][] }) {
  return (
    <nav aria-label="Trilha" className="mb-5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">
      <Link href="/" className="hover:text-fg">Início</Link>
      {items.map(([href, label], i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span aria-hidden="true">/</span>
          {href ? <Link href={href} className="hover:text-fg">{label}</Link> : <span className="text-fg">{label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title, subtitle, eyebrow, children, crumbs,
}: {
  title: React.ReactNode; subtitle?: React.ReactNode; eyebrow?: React.ReactNode; children?: React.ReactNode; crumbs?: [string | null, string][];
}) {
  return (
    <div className="border-b border-line">
      <Container className="pb-8 pt-8 md:pb-10 md:pt-10">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <div className="label mb-3">{eyebrow}</div>}
        <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</div>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}

export function Section({
  title, action, children, className, id, description,
}: {
  title: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string; description?: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-2.5">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SeeAll({ href, children = "Ver todos" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:text-primary">
      {children} →
    </Link>
  );
}

export function Field({ label, children, missing }: { label: string; children?: React.ReactNode; missing?: boolean }) {
  const empty = missing || children == null || children === false || children === "" || (Array.isArray(children) && children.length === 0);
  if (empty) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-line/70 py-3 last:border-0 sm:flex-row sm:gap-6">
      <dt className="label w-44 shrink-0 sm:pt-1">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export function Missing({ children = "Não documentado" }: { children?: React.ReactNode }) {
  return <span className="text-sm text-muted/70">— {children}</span>;
}

export function Pagination({ page, total, pageSize, makeHref }: { page: number; total: number; pageSize: number; makeHref: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))).sort((a, b) => a - b);
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1 font-mono text-sm" aria-label="Paginação">
      {page > 1 && <Link className="btn btn-ghost" href={makeHref(page - 1)}>← Anterior</Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1 text-muted">…</span>}
          <Link href={makeHref(n)} className={cn("btn min-w-10", n === page ? "btn-primary" : "btn-ghost")} aria-current={n === page ? "page" : undefined}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link className="btn btn-ghost" href={makeHref(page + 1)}>Próxima →</Link>}
    </nav>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}
