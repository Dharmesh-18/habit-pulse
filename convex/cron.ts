// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs daily at midnight UTC
crons.daily(
  "daily-midnight-audit",
  { hourUTC: 0, minuteUTC: 0 },
  internal.habits.index.internalResetHabitFlags,
  // Pass any required internal args or trigger a batch job
  {} as any
);

export default crons;