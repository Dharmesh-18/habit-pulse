// convex/notifications/copy.ts
export interface ReminderCopyContext {
  title: string;
  category: string;
  reminderTime: string;
  userName?: string;
}

const REMINDER_MESSAGES: Array<(s: ReminderCopyContext) => string> = [
  (s) =>
    `🔥 Don't break the chain! "${s.title}" (${s.category}) is due at ${s.reminderTime}. Tap to check in!`,
  (s) =>
    `🎯 Quest alert! Your ${s.category} habit "${s.title}" unlocks at ${s.reminderTime}. Ready to climb the leaderboard?`,
  (s) =>
    `⚡ ${s.reminderTime}: Time for "${s.title}"! Small step, big win 🚀`,
  (s) =>
    `💪 Level up time! "${s.title}" (${s.category}) is waiting at ${s.reminderTime}.`,
  (s) =>
    `🏆 Ready to beat yesterday? "${s.title}" is scheduled for ${s.reminderTime}.`,
  (s) =>
    `🌟 One tap, one win! Complete "${s.title}" (${s.category}) at ${s.reminderTime}. You've got this!`,
];

export function getReminderMessage(status: ReminderCopyContext): string {
  const index = Math.floor(Math.random() * REMINDER_MESSAGES.length);
  return REMINDER_MESSAGES[index](status);
}