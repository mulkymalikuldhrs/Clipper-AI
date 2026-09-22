/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bridge from "../bridge.js";
import type * as brief from "../brief.js";
import type * as campaigns from "../campaigns.js";
import type * as crons from "../crons.js";
import type * as demo from "../demo.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as ingestHttp from "../ingestHttp.js";
import type * as lib_konten from "../lib/konten.js";
import type * as maintenance from "../maintenance.js";
import type * as queries from "../queries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bridge: typeof bridge;
  brief: typeof brief;
  campaigns: typeof campaigns;
  crons: typeof crons;
  demo: typeof demo;
  http: typeof http;
  ingest: typeof ingest;
  ingestHttp: typeof ingestHttp;
  "lib/konten": typeof lib_konten;
  maintenance: typeof maintenance;
  queries: typeof queries;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
