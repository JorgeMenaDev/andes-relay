import { v } from "convex/values";

export const companyKey = v.union(v.literal("andesphere"), v.literal("arketix"));

export const eventType = v.union(
  v.literal("support.ticket.created"),
  v.literal("support.ticket.message"),
  v.literal("feedback.created"),
  v.literal("help.search"),
  v.literal("email.intent.created"),
  v.literal("email.preference.updated"),
);

export const ticketStatus = v.union(
  v.literal("open"),
  v.literal("waiting"),
  v.literal("resolved"),
  v.literal("closed"),
);

export const feedbackStatus = v.union(
  v.literal("new"),
  v.literal("reviewed"),
  v.literal("planned"),
  v.literal("closed"),
);

export const emailStatus = v.union(
  v.literal("queued"),
  v.literal("sent"),
  v.literal("failed"),
);

export const locale = v.union(
  v.literal("en"),
  v.literal("es"),
  v.literal("pt"),
  v.literal("fr"),
  v.literal("de"),
);

export const priority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent"),
);

export const actor = v.union(
  v.literal("user"),
  v.literal("operator"),
  v.literal("system"),
);

export const source = v.object({
  companyKey,
  productKey: v.string(),
  environment: v.optional(v.string()),
  externalId: v.optional(v.string()),
});

export const contact = v.object({
  email: v.string(),
  name: v.optional(v.string()),
  locale: v.optional(locale),
  externalId: v.optional(v.string()),
});

export const context = v.object({
  currentUrl: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  accountId: v.optional(v.string()),
});

export const supportPayload = v.object({
  externalId: v.optional(v.string()),
  title: v.string(),
  message: v.string(),
  topic: v.optional(v.string()),
  priority: v.optional(priority),
});

export const supportMessagePayload = v.object({
  ticketExternalId: v.string(),
  message: v.string(),
  actor: v.optional(actor),
});

export const feedbackPayload = v.object({
  externalId: v.optional(v.string()),
  title: v.string(),
  message: v.string(),
  type: v.optional(v.string()),
});

export const helpSearchPayload = v.object({
  query: v.string(),
  resultCount: v.optional(v.number()),
});

export const emailIntentPayload = v.object({
  recipientEmail: v.string(),
  templateKey: v.string(),
  subject: v.string(),
  locale: v.optional(locale),
});

export const preferencesPayload = v.object({
  productUpdates: v.optional(v.boolean()),
  supportReplies: v.optional(v.boolean()),
  marketing: v.optional(v.boolean()),
});

export const opsEvent = v.object({
  eventId: v.string(),
  type: eventType,
  occurredAt: v.number(),
  source,
  contact: v.optional(contact),
  context: v.optional(context),
  support: v.optional(supportPayload),
  supportMessage: v.optional(supportMessagePayload),
  feedback: v.optional(feedbackPayload),
  search: v.optional(helpSearchPayload),
  email: v.optional(emailIntentPayload),
  preferences: v.optional(preferencesPayload),
  payload: v.optional(v.any()),
});
