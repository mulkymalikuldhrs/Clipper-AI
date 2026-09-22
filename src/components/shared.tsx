import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 h-12 w-12 rounded-full bg-secondary grid place-items-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "primary" | "cyan" | "amber";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/25"
      : accent === "amber"
        ? "text-amber-300 bg-amber-500/10 border-amber-500/25"
        : "text-primary bg-primary/10 border-primary/25";
  return (
    <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("h-9 w-9 rounded-lg border grid place-items-center", accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const deg = Math.round((Math.min(100, Math.max(0, score)) / 100) * 360);
  const color = score >= 70 ? "#34d399" : score >= 45 ? "#fbbf24" : "#f87171";
  return (
    <div
      className="rounded-full grid place-items-center shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${deg}deg, hsl(190 30% 14%) ${deg}deg)`,
      }}
    >
      <div
        className="rounded-full bg-card grid place-items-center"
        style={{ width: size - 12, height: size - 12 }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}
