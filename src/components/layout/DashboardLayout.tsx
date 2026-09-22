import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Scissors,
  LayoutDashboard,
  Radar,
  Clapperboard,
  BarChart3,
  Wallet,
  Cable,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/scanner", label: "Scanner", icon: Radar, end: false },
  { to: "/app/autopilot", label: "Autopilot", icon: Clapperboard, end: false },
  { to: "/app/analytics", label: "Analitik", icon: BarChart3, end: false },
  { to: "/app/earnings", label: "Earnings", icon: Wallet, end: false },
  { to: "/app/bridge", label: "Bridge", icon: Cable, end: false },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const viewer = useQuery(api.users.getViewer, {});
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border glass">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center">
            <Scissors className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm tracking-tight">Super Clipper</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Autopilot v2.0</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border grid place-items-center text-xs font-bold">
              {(viewer?.name ?? "C").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{viewer?.name ?? "Clipper"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{viewer?.email ?? ""}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => {
              try {
                await signOut();
              } finally {
                navigate("/");
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
        <footer className="border-t border-border px-6 py-3 text-[11px] font-mono text-muted-foreground">
          Super Clipper • bridge akunmu sendiri • bukan afiliasi konten.com
        </footer>
      </div>
    </div>
  );
}
