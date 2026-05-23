import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  actor,
  companyKey,
  context,
  emailStatus,
  feedbackStatus,
  locale,
  priority,
  ticketStatus,
} from "./validators";

const externalRef = v.object({
  companyKey,
  productKey: v.string(),
  externalId: v.string(),
  environment: v.optional(v.string()),
});

const preferences = v.object({
  productUpdates: v.optional(v.boolean()),
  supportReplies: v.optional(v.boolean()),
  marketing: v.optional(v.boolean()),
});

export default defineSchema({
  contacts: defineTable({
    email: v.string(),
    normalizedEmail: v.string(),
    name: v.optional(v.string()),
    locale: v.optional(locale),
    companies: v.array(companyKey),
    products: v.array(v.string()),
    externalRefs: v.array(externalRef),
    emailPreferences: v.optional(preferences),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_normalized_email", ["normalizedEmail"]),

  ingestEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    companyKey,
    productKey: v.string(),
    externalId: v.optional(v.string()),
    occurredAt: v.number(),
    createdAt: v.number(),
    payload: v.optional(v.any()),
  })
    .index("by_event_id", ["eventId"])
    .index("by_created_at", ["createdAt"])
    .index("by_product_created_at", ["companyKey", "productKey", "createdAt"]),

  supportTickets: defineTable({
    externalId: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyKey,
    productKey: v.string(),
    title: v.string(),
    message: v.string(),
    topic: v.optional(v.string()),
    priority,
    status: ticketStatus,
    locale: v.optional(locale),
    context: v.optional(context),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status_updated_at", ["status", "updatedAt"])
    .index("by_product_updated_at", ["companyKey", "productKey", "updatedAt"])
    .index("by_source_external", ["companyKey", "productKey", "externalId"]),

  ticketMessages: defineTable({
    ticketId: v.id("supportTickets"),
    actor,
    message: v.string(),
    occurredAt: v.number(),
  }).index("by_ticket_occurred_at", ["ticketId", "occurredAt"]),

  feedbackItems: defineTable({
    externalId: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyKey,
    productKey: v.string(),
    title: v.string(),
    message: v.string(),
    feedbackType: v.optional(v.string()),
    status: feedbackStatus,
    locale: v.optional(locale),
    context: v.optional(context),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status_created_at", ["status", "createdAt"])
    .index("by_product_created_at", ["companyKey", "productKey", "createdAt"])
    .index("by_source_external", ["companyKey", "productKey", "externalId"]),

  contactSubmissions: defineTable({
    externalId: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyKey,
    productKey: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    locale: v.optional(locale),
    context: v.optional(context),
    createdAt: v.number(),
  })
    .index("by_product_created_at", ["companyKey", "productKey", "createdAt"])
    .index("by_source_external", ["companyKey", "productKey", "externalId"]),

  accountCreations: defineTable({
    externalId: v.string(),
    contactId: v.optional(v.id("contacts")),
    companyKey,
    productKey: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    locale: v.optional(locale),
    plan: v.optional(v.string()),
    source: v.optional(v.string()),
    context: v.optional(context),
    createdAt: v.number(),
  })
    .index("by_product_created_at", ["companyKey", "productKey", "createdAt"])
    .index("by_source_external", ["companyKey", "productKey", "externalId"]),

  helpSearches: defineTable({
    contactId: v.optional(v.id("contacts")),
    companyKey,
    productKey: v.string(),
    query: v.string(),
    resultCount: v.optional(v.number()),
    locale: v.optional(locale),
    currentUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_product_created_at", ["companyKey", "productKey", "createdAt"]),

  emailJobs: defineTable({
    companyKey,
    productKey: v.string(),
    recipientEmail: v.string(),
    templateKey: v.string(),
    subject: v.string(),
    status: emailStatus,
    locale: v.optional(locale),
    error: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_status_created_at", ["status", "createdAt"])
    .index("by_product_created_at", ["companyKey", "productKey", "createdAt"]),
});
