import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";
if (!convexUrl) {
  console.error("VITE_CONVEX_URL missing — run `bun convex dev --once` first.");
}

/**
 * Resolve the Convex URL for the browser.
 * In the Freebuff sandbox the page is served via an e2b tunnel (<port>-<sandbox>.e2b.app),
 * so the local backend URL (127.0.0.1:3210) must be translated to its public tunnel
 * (https://3210-<sandbox>.e2b.app) — otherwise the browser cannot reach the backend.
 */
function resolveConvexUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".e2b.app")) {
    const sandbox = window.location.hostname.replace(/^\d+-/, "");
    return `https://3210-${sandbox}`;
  }
  return convexUrl;
}

const client = new ConvexReactClient(resolveConvexUrl());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>
);
