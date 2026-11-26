// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs daily at midnight UTC
crons.daily(
  "daily-midnight-audit",
  { hourUTC: 0, minuteUTC: 0 },
  internal.habits.index.internalResetHabitFlags,
  {} as any
);

// Runs hourly to clean up unaccepted >24h challenge invites & audit missed streaks
crons.hourly(
  "hourly-challenge-audit",
  { minuteUTC: 15 },
  internal.challenges.index.internalAuditChallenges,
  {}
);

export default crons;