import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { isConvexUrlConfigured, resolveConvexUrl } from "./lib/convexUrl";
import "./index.css";

if (!isConvexUrlConfigured()) {
  console.error("VITE_CONVEX_URL missing — run `bun convex dev --once` first.");
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
