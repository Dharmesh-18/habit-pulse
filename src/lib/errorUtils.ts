// src/lib/errorUtils.ts
import { ConvexError } from "convex/values";

export function parseConvexError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";

  // 1. If thrown via new ConvexError("...")
  if (error instanceof ConvexError) {
    return typeof error.data === "string" ? error.data : JSON.stringify(error.data);
  }

  // 2. Handle object with .data (often passed by Convex client)
  const anyErr = error as any;
  if (anyErr?.data && typeof anyErr.data === "string") {
    return anyErr.data;
  }

  const rawMessage: string = anyErr?.message ?? (typeof error === "string" ? error : "");

  if (!rawMessage) return "Request failed. Please try again.";

  // 3. Extract exact error message from Convex string format
  // Matches "Uncaught Error: <TARGET_MESSAGE>" before any newline or stack line
  const uncaughtMatch = rawMessage.match(/Uncaught Error:\s*([^\n\r]+)/);
  if (uncaughtMatch && uncaughtMatch[1]) {
    return uncaughtMatch[1].trim();
  }

  // Matches "Server Error: Error: <TARGET_MESSAGE>"
  const serverMatch = rawMessage.match(/Server Error:\s*(?:Error:\s*)?([^\n\r]+)/);
  if (serverMatch && serverMatch[1]) {
    return serverMatch[1].trim();
  }

  // Matches standard "Error: <TARGET_MESSAGE>"
  const genericMatch = rawMessage.match(/^Error:\s*([^\n\r]+)/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].trim();
  }

  // Fallback: strip brackets and take the first line
  const cleaned = rawMessage
    .replace(/^\[.*?\]\s*/g, "")
    .split(/[\r\n]+/)[0]
    .trim();

  return cleaned || "Request failed. Please try again.";
}