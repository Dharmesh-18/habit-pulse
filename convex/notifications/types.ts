// convex/notifications/types.ts

export type NotificationChannel = "email" | "whatsapp" | "push";

export type NotificationEventType = "HABIT_CREATED" | "DAILY_REMINDER";

export interface RecipientInfo {
  email?: string;
  phone?: string; // Future WhatsApp / SMS support
  name?: string;
}

export interface HabitCreatedPayload {
  eventType: "HABIT_CREATED";
  habitTitle: string;
  category: string;
  reminderTime?: string;
}

export interface DailyReminderPayload {
  eventType: "DAILY_REMINDER";
  habitTitle: string;
  category: string;
  reminderTime: string;
}

export type NotificationPayload = HabitCreatedPayload | DailyReminderPayload;

export interface NotificationMessage {
  recipient: RecipientInfo;
  channels: NotificationChannel[];
  payload: NotificationPayload;
}

export interface ChannelProvider {
  channel: NotificationChannel;
  send(recipient: RecipientInfo, payload: NotificationPayload): Promise<boolean>;
}