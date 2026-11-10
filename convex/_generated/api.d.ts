/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_index from "../auth/index.js";
import type * as common_auth from "../common/auth.js";
import type * as common_rateLimiter from "../common/rateLimiter.js";
import type * as cron from "../cron.js";
import type * as habits_index from "../habits/index.js";
import type * as jobs_reminders from "../jobs/reminders.js";
import type * as storage_index from "../storage/index.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/index": typeof auth_index;
  "common/auth": typeof common_auth;
  "common/rateLimiter": typeof common_rateLimiter;
  cron: typeof cron;
  "habits/index": typeof habits_index;
  "jobs/reminders": typeof jobs_reminders;
  "storage/index": typeof storage_index;
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
