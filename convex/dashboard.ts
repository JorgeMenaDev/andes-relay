import { v } from "convex/values";
import { query } from "./_generated/server";
import { feedbackStatus, ticketStatus } from "./validators";

const limitArg = v.optional(v.number());
const signalType = v.union(
  v.literal("ticket"),
  v.literal("feedback"),
  v.literal("form"),
  v.literal("account"),
  v.literal("contact"),
  v.literal("email"),
  v.literal("search"),
);

const matchesSource = (
  item: { companyKey?: string; productKey?: string },
  companyKey?: string,
  productKey?: string,
) =>
  (!companyKey || item.companyKey === companyKey) &&
  (!productKey || item.productKey === productKey);

const matchesContactSource = (
  item: { companies?: string[]; products?: string[] },
  companyKey?: string,
  productKey?: string,
) =>
  (!companyKey || item.companies?.includes(companyKey)) &&
  (!productKey || item.products?.includes(productKey));

const inWindow = (timestamp: number, since?: number) =>
  since === undefined || timestamp >= since;

export const getOverview = query({
  args: {},
  returns: v.object({
    openTickets: v.number(),
    newFeedback: v.number(),
    queuedEmails: v.number(),
    contacts: v.number(),
    contactSubmissions: v.number(),
    accountCreations: v.number(),
    recentSearches: v.number(),
  }),
  handler: async (ctx) => {
    const [
      openTickets,
      newFeedback,
      queuedEmails,
      contacts,
      contactSubmissions,
      accountCreations,
      recentSearches,
    ] = await Promise.all([
        ctx.db
          .query("supportTickets")
          .withIndex("by_status_updated_at", (q) => q.eq("status", "open"))
          .collect(),
        ctx.db
          .query("feedbackItems")
          .withIndex("by_status_created_at", (q) => q.eq("status", "new"))
          .collect(),
        ctx.db
          .query("emailJobs")
          .withIndex("by_status_created_at", (q) => q.eq("status", "queued"))
          .collect(),
        ctx.db.query("contacts").collect(),
        ctx.db.query("contactSubmissions").order("desc").take(25),
        ctx.db.query("accountCreations").order("desc").take(25),
        ctx.db.query("helpSearches").order("desc").take(25),
      ]);

    return {
      openTickets: openTickets.length,
      newFeedback: newFeedback.length,
      queuedEmails: queuedEmails.length,
      contacts: contacts.length,
      contactSubmissions: contactSubmissions.length,
      accountCreations: accountCreations.length,
      recentSearches: recentSearches.length,
    };
  },
});

export const listTickets = query({
  args: {
    status: v.optional(ticketStatus),
    limit: limitArg,
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status;

    if (status) {
      return await ctx.db
        .query("supportTickets")
        .withIndex("by_status_updated_at", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("supportTickets").order("desc").take(limit);
  },
});

export const listFeedback = query({
  args: {
    status: v.optional(feedbackStatus),
    limit: limitArg,
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status;

    if (status) {
      return await ctx.db
        .query("feedbackItems")
        .withIndex("by_status_created_at", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("feedbackItems").order("desc").take(limit);
  },
});

export const listContacts = query({
  args: { limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db.query("contacts").order("desc").take(args.limit ?? 50),
});

export const listContactSubmissions = query({
  args: { limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db
      .query("contactSubmissions")
      .order("desc")
      .take(args.limit ?? 50),
});

export const listAccountCreations = query({
  args: { limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db
      .query("accountCreations")
      .order("desc")
      .take(args.limit ?? 50),
});

export const listHelpSearches = query({
  args: { limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db.query("helpSearches").order("desc").take(args.limit ?? 50),
});

export const listEmailJobs = query({
  args: { limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db.query("emailJobs").order("desc").take(args.limit ?? 50),
});

export const listActivity = query({
  args: {
    companyKey: v.optional(v.string()),
    limit: limitArg,
    productKey: v.optional(v.string()),
    since: v.optional(v.number()),
    type: v.optional(signalType),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const [
      tickets,
      feedback,
      forms,
      accounts,
      contacts,
      emails,
      searches,
    ] = await Promise.all([
      args.type && args.type !== "ticket"
        ? []
        : ctx.db.query("supportTickets").order("desc").take(200),
      args.type && args.type !== "feedback"
        ? []
        : ctx.db.query("feedbackItems").order("desc").take(200),
      args.type && args.type !== "form"
        ? []
        : ctx.db.query("contactSubmissions").order("desc").take(200),
      args.type && args.type !== "account"
        ? []
        : ctx.db.query("accountCreations").order("desc").take(200),
      args.type && args.type !== "contact"
        ? []
        : ctx.db.query("contacts").order("desc").take(200),
      args.type && args.type !== "email"
        ? []
        : ctx.db.query("emailJobs").order("desc").take(200),
      args.type && args.type !== "search"
        ? []
        : ctx.db.query("helpSearches").order("desc").take(200),
    ]);

    const activity = [
      ...tickets
        .filter(
          (item) =>
            inWindow(item.updatedAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: item.message,
          occurredAt: item.updatedAt,
          statusLabel: item.status,
          title: item.title,
          type: "ticket",
        })),
      ...feedback
        .filter(
          (item) =>
            inWindow(item.updatedAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: item.message,
          occurredAt: item.updatedAt,
          statusLabel: item.status,
          title: item.title,
          type: "feedback",
        })),
      ...forms
        .filter(
          (item) =>
            inWindow(item.createdAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: item.message,
          occurredAt: item.createdAt,
          statusLabel: "submitted",
          title: item.subject ?? "Contact form submission",
          type: "form",
        })),
      ...accounts
        .filter(
          (item) =>
            inWindow(item.createdAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: item.email,
          occurredAt: item.createdAt,
          statusLabel: item.source ?? "created",
          title: item.name ?? item.email,
          type: "account",
        })),
      ...contacts
        .filter(
          (item) =>
            inWindow(item.updatedAt, args.since) &&
            matchesContactSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          companyKey: item.companies[0] ?? "unknown",
          description: item.email,
          occurredAt: item.updatedAt,
          productKey: item.products[0] ?? "unknown",
          statusLabel: item.locale ?? "contact",
          title: item.name ?? item.email,
          type: "contact",
        })),
      ...emails
        .filter(
          (item) =>
            inWindow(item.updatedAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: item.recipientEmail,
          occurredAt: item.updatedAt,
          statusLabel: item.status,
          title: item.subject,
          type: "email",
        })),
      ...searches
        .filter(
          (item) =>
            inWindow(item.createdAt, args.since) &&
            matchesSource(item, args.companyKey, args.productKey),
        )
        .map((item) => ({
          ...item,
          description: `${item.resultCount ?? 0} results`,
          occurredAt: item.createdAt,
          statusLabel: item.locale ?? "search",
          title: item.query,
          type: "search",
        })),
    ];

    return activity
      .sort((first, second) => second.occurredAt - first.occurredAt)
      .slice(0, limit);
  },
});
