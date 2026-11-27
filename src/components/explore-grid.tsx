import Link from "next/link";
import { artSources, cn } from "@/lib/utils";
import { AttributeIcon, FamilyIcon } from "@/components/icons";

export type ShowMon = { slug: string; name: string; imageUrl: string | null; stage?: { name: string; color: string } | null };
type Named = { slug: string; name: string; color?: string | null };
type Entry = { href: string; title: string; stat: string };

export type ExploreData = {
  encyclopedia: Entry;
  lines: Entry;
  universes: Entry;
  stages: Entry;
  attributes: Entry;
  types: Entry;
  families: Entry;
  groups: Entry;
  compare: Entry;
  trivia: Entry;
  wall: ShowMon[];
  chain: ShowMon[];
  knights: ShowMon[];
  duel: [ShowMon | undefined, ShowMon | undefined];
  fusion: [ShowMon | undefined, ShowMon | undefined, ShowMon | undefined];
  stageBars: Named[];
  attributeIcons: Named[];
  familyIcons: Named[];
  typeNames: string[];
  mediaStrips: { slug: string; name: string; year: number | null; color: string }[];
};

const motion = "transition-transform ease-out motion-reduce:transition-none motion-reduce:transform-none";
const ease = `${motion} duration-500`;

function Plate({ m, className, flip }: { m?: ShowMon; className?: string; flip?: boolean }) {
  return (
    <span className={cn("plate block shrink-0 overflow-hidden rounded-[6px]", className)}>
      {m?.imageUrl && <img src={m.imageUrl} srcSet={artSources(m.imageUrl)?.srcSet} sizes="120px" alt="" loading="lazy" decoding="async" className={cn("h-full w-full object-contain p-[8%]", flip && "-scale-x-100")} />}
    </span>
  );
}

function Caption({ e, big }: { e: Entry; big?: boolean }) {
  return (
    <span className="relative block">
      <span className={cn("block font-brand font-semibold leading-tight group-hover:text-primary", big ? "text-3xl sm:text-4xl" : "text-lg")}>{e.title}</span>
      <span className={cn("mt-1 block font-mono uppercase tracking-wider text-muted", big ? "text-xs" : "text-[10.5px]")}>{e.stat}</span>
    </span>
  );
}

function Shell({ e, className, children }: { e: Entry; className?: string; children: React.ReactNode }) {
  return (
    <Link href={e.href} className={cn("card group relative flex flex-col justify-between gap-4 overflow-hidden p-4 transition-colors hover:border-primary/70", className)}>
      <span aria-hidden="true" className="block">{children}</span>
      <Caption e={e} />
    </Link>
  );
}

export function ExploreGrid({ d }: { d: ExploreData }) {
  const cols = Array.from({ length: 6 }, (_, c) => d.wall.filter((_, i) => i % 6 === c));
  const strips = d.mediaStrips.slice(0, 5);
  const maxBar = d.stageBars.length;

  return (
    <div className="grid grid-flow-row-dense grid-cols-2 gap-3 lg:grid-cols-4 lg:auto-rows-[minmax(176px,auto)]">
      <Link href={d.encyclopedia.href} className="card group relative flex min-h-72 flex-col justify-end overflow-hidden p-5 transition-colors hover:border-primary/70 col-span-2 lg:row-span-2 lg:p-6">
        <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <span className={cn("absolute -left-[12%] -right-[12%] -top-[30%] -bottom-[10%] flex -rotate-[8deg] gap-2.5 group-hover:scale-[1.04]", motion, "duration-700")}>
            {cols.map((col, ci) => (
              <span
                key={ci}
                className={cn("flex flex-1 flex-col gap-2.5", motion, "duration-[900ms]", ci % 2 ? "-mt-12 group-hover:-translate-y-8" : "group-hover:translate-y-8")}
              >
                {col.map((m) => <Plate key={m.slug} m={m} className="aspect-square w-full" />)}
              </span>
            ))}
          </span>
          <span className="absolute inset-0 bg-linear-to-t from-surface from-25% via-surface/80 via-45% to-surface/5" />
        </span>
        <Caption e={d.encyclopedia} big />
      </Link>

      <Shell e={d.lines} className="col-span-2">
        <span className="flex items-start">
          {d.chain.map((m, i) => (
            <span key={m.slug} className="flex min-w-0 flex-1 items-start last:flex-none">
              <span className={cn("flex w-14 flex-col items-center gap-1.5 sm:w-[4.5rem] group-hover:-translate-y-1.5", ease)} style={{ transitionDelay: `${i * 90}ms` }}>
                <Plate m={m} className="aspect-square w-full" />
                <span className="h-[3px] w-6 rounded-full" style={{ background: m.stage?.color }} />
                <span className="hidden w-full truncate text-center font-mono text-[10px] text-muted sm:block">{m.name}</span>
              </span>
              {i < d.chain.length - 1 && (
                <span className="relative mx-1 mt-7 h-px flex-1 bg-line sm:mt-9">
                  <span className={cn("absolute inset-0 origin-left scale-x-0 bg-primary group-hover:scale-x-100", ease)} style={{ transitionDelay: `${i * 90 + 60}ms` }} />
                </span>
              )}
            </span>
          ))}
        </span>
      </Shell>

      <Shell e={d.universes} className="col-span-2 sm:col-span-1">
        <span className="flex flex-col gap-1 pr-5">
          {strips.map((m, i) => (
            <span
              key={m.slug}
              className={cn("flex items-center gap-2 rounded-[3px] border-l-[3px] px-2 py-0.5 text-[11px] group-hover:translate-x-[var(--fan)]", ease)}
              style={{ borderColor: m.color, background: `color-mix(in oklab, ${m.color} 14%, var(--surface))`, ["--fan" as string]: `${i * 5}px`, transitionDelay: `${i * 50}ms` }}
            >
              <span className="font-mono text-muted">{m.year}</span>
              <span className="truncate">{m.name}</span>
            </span>
          ))}
        </span>
      </Shell>

      <Shell e={d.stages}>
        <span className="flex h-20 items-end gap-1.5">
          {d.stageBars.map((s, i) => (
            <span
              key={s.slug}
              title={s.name}
              className={cn("flex-1 origin-bottom rounded-t-[2px] scale-y-50 group-hover:scale-y-100", ease)}
              style={{ height: `${((i + 1) / maxBar) * 100}%`, background: s.color ?? "var(--muted)", transitionDelay: `${i * 45}ms` }}
            />
          ))}
        </span>
      </Shell>

      <Shell e={d.groups} className="col-span-2">
        <span className="flex items-center pl-1">
          {d.knights.map((m, i) => (
            <span
              key={m.slug}
              className={cn("relative -ml-6 first:ml-0 group-hover:-ml-3 group-hover:first:ml-0", "transition-[margin] duration-500 ease-out motion-reduce:transition-none")}
              style={{ zIndex: d.knights.length - i }}
            >
              <Plate m={m} className="h-[4.5rem] w-[4.5rem] ring-2 ring-surface sm:h-20 sm:w-20" />
            </span>
          ))}
        </span>
      </Shell>

      <Shell e={d.compare}>
        <span className="flex items-center justify-center gap-2 sm:gap-4">
          <span className={cn("group-hover:translate-x-1", ease)}><Plate m={d.duel[0]} className="h-12 w-12 sm:h-16 sm:w-16" /></span>
          <span className={cn("font-brand text-sm font-bold text-muted group-hover:scale-125 group-hover:text-primary", ease)}>VS</span>
          <span className={cn("group-hover:-translate-x-1", ease)}><Plate m={d.duel[1]} className="h-12 w-12 sm:h-16 sm:w-16" flip /></span>
        </span>
      </Shell>

      <Shell e={d.trivia} className="col-span-2 sm:col-span-1">
        <span className="flex items-center justify-center gap-1.5 text-muted">
          <span className={cn("group-hover:translate-x-1", ease)}><Plate m={d.fusion[0]} className="h-12 w-12" /></span>
          <span className="font-mono text-sm">+</span>
          <span className={cn("group-hover:-translate-x-1", ease)}><Plate m={d.fusion[1]} className="h-12 w-12" /></span>
          <span className="font-mono text-sm">=</span>
          <span className={cn("group-hover:scale-110", ease)}><Plate m={d.fusion[2]} className="h-16 w-16" /></span>
        </span>
      </Shell>

      <Shell e={d.attributes} className="col-span-2 sm:col-span-1">
        <span className="flex flex-wrap items-center gap-3">
          {d.attributeIcons.map((a, i) => (
            <span key={a.slug} className={cn("group-hover:-translate-y-1.5", ease)} style={{ transitionDelay: `${i * 60}ms` }}>
              <AttributeIcon slug={a.slug} name={a.name} size={34} />
            </span>
          ))}
        </span>
      </Shell>

      <Shell e={d.families} className="col-span-2 sm:col-span-1">
        <span className="grid grid-cols-5 gap-2.5">
          {d.familyIcons.map((f, i) => (
            <span key={f.slug} className={cn("flex justify-center group-hover:scale-115", ease)} style={{ transitionDelay: `${i * 35}ms` }}>
              <FamilyIcon slug={f.slug} name={f.name} size={28} />
            </span>
          ))}
        </span>
      </Shell>

      <Shell e={d.types} className="col-span-2">
        <span className="flex flex-col gap-2 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          {[0, 1].map((row) => (
            <span key={row} className={cn("flex gap-2 whitespace-nowrap duration-[1400ms]", motion, row ? "-ml-10 group-hover:translate-x-10" : "group-hover:-translate-x-10")}>
              {d.typeNames.filter((_, i) => i % 2 === row).map((n) => (
                <span key={n} className="rounded-[4px] border border-line bg-bg px-2 py-1 text-xs">{n}</span>
              ))}
            </span>
          ))}
        </span>
      </Shell>
    </div>
  );
}
