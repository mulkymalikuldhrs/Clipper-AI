/**
 * Dashboard primitives — a restrained "operations console" language.
 *
 * Rules for this file (keep it consistent when adding more):
 * - Hairline borders, no shadows, no gradients, no decorative icon tiles.
 * - Numbers are monospace + tabular so columns line up.
 * - Labels are 10–11px mono uppercase with wide tracking.
 * - Colour is only used to carry meaning (status/score), never for decoration.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ tones */

const TONE_TEXT = {
  neutral: "text-muted-foreground",
  primary: "text-primary",
  good: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-red-300",
  info: "text-cyan-300",
} as const;

const TONE_BAR = {
  neutral: "bg-muted-foreground/50",
  primary: "bg-primary/80",
  good: "bg-emerald-400/80",
  warn: "bg-amber-400/80",
  bad: "bg-red-400/80",
  info: "bg-cyan-400/80",
} as const;

export type Tone = keyof typeof TONE_TEXT;

export function toneForScore(score: number | undefined | null): Tone {
  const s = score ?? 0;
  return s >= 70 ? "good" : s >= 45 ? "warn" : "bad";
}

/* ------------------------------------------------------------ page header */

export function PageHeader({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{title}</h1>
        {meta && (
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">{meta}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ----------------------------------------------------------------- panels */

export function Panel({
  title,
  meta,
  actions,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("min-w-0 rounded-md border border-border bg-card/60", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-baseline gap-2">
            {title && (
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {title}
              </h2>
            )}
            {meta && <span className="truncate text-[11px] text-muted-foreground/70">{meta}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "px-4 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* --------------------------------------------------------- metric strips */

export function MetricStrip({
  items,
  className,
}: {
  items: { label: string; value: string; hint?: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border/70 sm:grid-cols-3 lg:grid-cols-5",
        className
      )}
    >
      {items.map((m) => (
        <div key={m.label} className="bg-card px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {m.label}
          </p>
          <p className="mt-1.5 font-mono text-[17px] font-semibold tabular-nums tracking-tight">
            {m.value}
          </p>
          {m.hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{m.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- indicators */

export function Status({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em]",
        TONE_TEXT[tone],
        className
      )}
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "primary",
  className,
}: {
  value: number | null | undefined;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <span className={cn("flex h-1 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <span
        className={cn("h-full rounded-full transition-[width] duration-500", TONE_BAR[tone])}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

export function Score({
  value,
  className,
  meterClassName = "w-12",
}: {
  value: number;
  className?: string;
  meterClassName?: string;
}) {
  const tone = toneForScore(value);
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("w-7 font-mono text-[13px] font-semibold tabular-nums", TONE_TEXT[tone])}>
        {value}
      </span>
      <Meter value={value} tone={tone} className={meterClassName} />
    </span>
  );
}

/* ------------------------------------------------------------- data table */

export function TableShell({
  cols,
  head,
  children,
  minWidth = "46rem",
  className,
}: {
  cols: string;
  head: ReactNode[];
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <div className={className} style={{ minWidth }}>
        <div
          className="grid items-center gap-4 border-b border-border px-4 py-2"
          style={{ gridTemplateColumns: cols }}
        >
          {head.map((h, i) => (
            <span
              key={i}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border/60">{children}</div>
      </div>
    </div>
  );
}

export function TableRow({
  cols,
  children,
  to,
  className,
}: {
  cols: string;
  children: ReactNode;
  to?: string;
  className?: string;
}) {
  const classes = cn(
    "grid items-center gap-4 px-4 py-3 text-[13px]",
    to && "transition-colors hover:bg-secondary/30",
    className
  );
  if (to) {
    return (
      <Link to={to} className={classes} style={{ gridTemplateColumns: cols }}>
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ key/value */

export function KeyValueList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-border/60", className)}>{children}</div>;
}

export function KeyValue({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-right text-[13px]", mono && "font-mono tabular-nums")}>
        {children}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ lists */

export function Bullets({
  items,
  tone = "neutral",
  ordered,
  empty,
  className,
}: {
  items: string[];
  tone?: Tone;
  ordered?: boolean;
  empty?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return <p className="text-[13px] text-muted-foreground/80">{empty ?? "Tidak ada data."}</p>;
  }
  const List = ordered ? "ol" : "ul";

  return (
    <List className={cn("space-y-2.5", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
          <span
            className={cn(
              "mt-[3px] w-4 shrink-0 font-mono text-[10px] tabular-nums",
              TONE_TEXT[tone]
            )}
          >
            {ordered ? String(i + 1).padStart(2, "0") : "—"}
          </span>
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </List>
  );
}

/* --------------------------------------------------------------- empty/loading */

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-card/20 px-5 py-8", className)}>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function RowsLoading({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-border/60", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <span className="h-3 w-7 animate-pulse rounded-sm bg-secondary" />
          <span className="h-3 flex-1 animate-pulse rounded-sm bg-secondary" />
          <span className="hidden h-3 w-16 animate-pulse rounded-sm bg-secondary sm:block" />
        </div>
      ))}
    </div>
  );
}

export function PanelLoading({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card/40", className)}>
      <RowsLoading rows={6} />
    </div>
  );
}

/* ------------------------------------------------------------ copy button */

export function CopyButton({
  text,
  label = "Salin",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
        className
      )}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? "Tersalin" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ misc */

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <MonoLabel>{label}</MonoLabel>
      <div className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
