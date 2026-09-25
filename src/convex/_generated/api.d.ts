/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apiData from "../apiData.js";
import type * as apiHttp from "../apiHttp.js";
import type * as auth from "../auth.js";
import type * as bridge from "../bridge.js";
import type * as brief from "../brief.js";
import type * as campaigns from "../campaigns.js";
import type * as connectors from "../connectors.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as ingestHttp from "../ingestHttp.js";
import type * as lib_contentRewards from "../lib/contentRewards.js";
import type * as lib_ingest from "../lib/ingest.js";
import type * as lib_konten from "../lib/konten.js";
import type * as lib_organism from "../lib/organism.js";
import type * as lib_workspace from "../lib/workspace.js";
import type * as maintenance from "../maintenance.js";
import type * as platform from "../platform.js";
import type * as queries from "../queries.js";
import type * as users from "../users.js";
import type * as workspace from "../workspace.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apiData: typeof apiData;
  apiHttp: typeof apiHttp;
  auth: typeof auth;
  bridge: typeof bridge;
  brief: typeof brief;
  campaigns: typeof campaigns;
  connectors: typeof connectors;
  crons: typeof crons;
  http: typeof http;
  ingest: typeof ingest;
  ingestHttp: typeof ingestHttp;
  "lib/contentRewards": typeof lib_contentRewards;
  "lib/ingest": typeof lib_ingest;
  "lib/konten": typeof lib_konten;
  "lib/organism": typeof lib_organism;
  "lib/workspace": typeof lib_workspace;
  maintenance: typeof maintenance;
  platform: typeof platform;
  queries: typeof queries;
  users: typeof users;
  workspace: typeof workspace;
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
