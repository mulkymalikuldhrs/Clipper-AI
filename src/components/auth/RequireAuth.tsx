import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="w-full max-w-xs px-6">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Super Clipper
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/70">memuat sesi</span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <span className="block h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
            menghubungkan ke sesi clipper…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}
