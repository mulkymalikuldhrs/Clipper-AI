import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { pushSnapshot } from "./ingestHttp";

const http = httpRouter();

// Convex Auth endpoints (JWT verification, OAuth, sign-in flows).
auth.addHttpRoutes(http);

// Bridge ingest endpoint.
http.route({ path: "/ingest", method: "POST", handler: pushSnapshot });

export default http;
