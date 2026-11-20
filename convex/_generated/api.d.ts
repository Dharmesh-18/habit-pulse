/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements_helpers from "../achievements/helpers.js";
import type * as achievements_index from "../achievements/index.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_oauth from "../auth/oauth.js";
import type * as auth_oauthTypes from "../auth/oauthTypes.js";
import type * as common_auth from "../common/auth.js";
import type * as common_rateLimiter from "../common/rateLimiter.js";
import type * as cron from "../cron.js";
import type * as habits_index from "../habits/index.js";
import type * as http from "../http.js";
import type * as jobs_reminders from "../jobs/reminders.js";
import type * as leaderboard_index from "../leaderboard/index.js";
import type * as notifications_actions from "../notifications/actions.js";
import type * as notifications_copy from "../notifications/copy.js";
import type * as notifications_providers_emailProvider from "../notifications/providers/emailProvider.js";
import type * as notifications_pushSubscriptions from "../notifications/pushSubscriptions.js";
import type * as notifications_templates from "../notifications/templates.js";
import type * as notifications_types from "../notifications/types.js";
import type * as notifications_webPush from "../notifications/webPush.js";
import type * as payments_catalog from "../payments/catalog.js";
import type * as payments_index from "../payments/index.js";
import type * as shop_helpers from "../shop/helpers.js";
import type * as shop_index from "../shop/index.js";
import type * as storage_index from "../storage/index.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "achievements/helpers": typeof achievements_helpers;
  "achievements/index": typeof achievements_index;
  "auth/index": typeof auth_index;
  "auth/oauth": typeof auth_oauth;
  "auth/oauthTypes": typeof auth_oauthTypes;
  "common/auth": typeof common_auth;
  "common/rateLimiter": typeof common_rateLimiter;
  cron: typeof cron;
  "habits/index": typeof habits_index;
  http: typeof http;
  "jobs/reminders": typeof jobs_reminders;
  "leaderboard/index": typeof leaderboard_index;
  "notifications/actions": typeof notifications_actions;
  "notifications/copy": typeof notifications_copy;
  "notifications/providers/emailProvider": typeof notifications_providers_emailProvider;
  "notifications/pushSubscriptions": typeof notifications_pushSubscriptions;
  "notifications/templates": typeof notifications_templates;
  "notifications/types": typeof notifications_types;
  "notifications/webPush": typeof notifications_webPush;
  "payments/catalog": typeof payments_catalog;
  "payments/index": typeof payments_index;
  "shop/helpers": typeof shop_helpers;
  "shop/index": typeof shop_index;
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
