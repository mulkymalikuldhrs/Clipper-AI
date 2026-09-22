import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Memuat sesi clipper…</p>
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
