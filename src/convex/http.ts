import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { pushSnapshot } from "./ingestHttp";
import { apiCampaigns, apiPlans, apiWorkspace } from "./apiHttp";

const http = httpRouter();

// Convex Auth endpoints (JWT verification, OAuth, sign-in flows).
auth.addHttpRoutes(http);

// Bridge / discovery ingest endpoint (shared-token boundary, not the public API).
http.route({ path: "/ingest", method: "POST", handler: pushSnapshot });

// Workspace HTTP API v1 — bearer API key, read-only, metered against the workspace plan.
http.route({ path: "/api/v1/workspace", method: "GET", handler: apiWorkspace });
http.route({ path: "/api/v1/campaigns", method: "GET", handler: apiCampaigns });
http.route({ path: "/api/v1/plans", method: "GET", handler: apiPlans });

export default http;
