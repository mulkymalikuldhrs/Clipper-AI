import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Status } from "@/components/shared";
import { cn, timeAgo } from "@/lib/utils";
import { Scissors, ChevronDown, LogOut, ArrowUpRight } from "lucide-react";

type NavItem = { to: string; label: string; end?: boolean; count?: number };

const GROUPS: { section: string; items: { to: string; label: string; end?: boolean; countKey?: "campaigns" | "joined" }[] }[] = [
  {
    section: "Pantau",
    items: [
      { to: "/app", label: "Ringkasan", end: true },
      { to: "/app/scanner", label: "Scanner", countKey: "campaigns" },
      { to: "/app/analytics", label: "Analitik" },
    ],
  },
  {
    section: "Produksi",
    items: [
      { to: "/app/autopilot", label: "Autopilot", countKey: "joined" },
      { to: "/app/earnings", label: "Earnings" },
    ],
  },
  { section: "Sistem", items: [
    { to: "/app/bridge", label: "Bridge" },
    { to: "/app/organism", label: "Organism" },
  ] },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const viewer = useQuery(api.users.getViewer, {});
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const campaigns = useQuery(api.queries.listCampaigns, {});
  const { signOut } = useAuthActions();

  const counts = {
    campaigns: campaigns?.length ?? 0,
    joined: (campaigns ?? []).filter((c) => c.joined).length,
  };

  const flat: NavItem[] = GROUPS.flatMap((g) => g.items);
  const active =
    [...flat]
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + "/"))) ??
    flat[0];

  const syncStale = !snapshot || Date.now() - snapshot.fetchedAt > 6 * 60 * 60 * 1000;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <span className="grid h-7 w-7 place-items-center rounded-md border border-primary/25 bg-primary/10">
            <Scissors className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="leading-none">
            <span className="block text-[13px] font-semibold tracking-tight">Super Clipper</span>
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              console v2
            </span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {GROUPS.map((g) => (
            <div key={g.section} className="pt-5">
              <p className="px-2.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                {g.section}
              </p>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const count = item.countKey ? counts[item.countKey] : undefined;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                          isActive
                            ? "bg-secondary/70 text-foreground"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "h-1 w-1 shrink-0 rounded-full",
                              isActive ? "bg-primary" : "bg-muted-foreground/40"
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {count != null && count > 0 && (
                            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <p className="font-mono text-[9px] leading-relaxed tracking-wide text-muted-foreground/60">
            bridge memakai sesi akunmu sendiri
            <br />
            bukan afiliasi konten.com
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]">
            <span className="hidden text-muted-foreground/60 sm:inline">super-clipper</span>
            <span className="hidden text-muted-foreground/40 sm:inline">/</span>
            <span className="truncate uppercase tracking-[0.12em] text-foreground">
              {active?.label ?? "Ringkasan"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 lg:flex">
              <Status tone={snapshot ? (syncStale ? "warn" : "good") : "neutral"}>
                {snapshot ? `sync ${timeAgo(snapshot.fetchedAt)}` : "belum sync"}
              </Status>
              {snapshot?.source && (
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {snapshot.source}
                </span>
              )}
            </span>

            <span className="hidden h-4 w-px bg-border lg:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-left transition-colors hover:bg-secondary/40">
                  <span className="grid h-6 w-6 place-items-center rounded-sm bg-secondary font-mono text-[10px] font-semibold">
                    {(viewer?.name ?? "C").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden max-w-32 truncate text-[12px] sm:block">
                    {viewer?.name ?? "Clipper"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
                  Akun
                </DropdownMenuLabel>
                <div className="px-2 pb-1.5">
                  <p className="truncate text-[13px] font-medium">{viewer?.name ?? "Clipper"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{viewer?.email ?? ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/app/bridge")}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Status bridge & sync
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    try {
                      await signOut();
                    } finally {
                      navigate("/");
                    }
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 no-scrollbar md:hidden">
          {flat.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 md:px-8">
          <p className="font-mono text-[10px] text-muted-foreground/60">
            Super Clipper • mirror dashboard konten.com dari sesimu sendiri
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
            asChild
          >
            <a href="https://konten.com/clipper-dashboard" target="_blank" rel="noreferrer">
              buka konten.com <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
}
