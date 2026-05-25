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
  workspaceKey?: string,
  productKey?: string,
) =>
  (!workspaceKey || item.companyKey === workspaceKey) &&
  (!productKey || item.productKey === productKey);

const matchesContactSource = (
  item: { companies?: string[]; products?: string[] },
  workspaceKey?: string,
  productKey?: string,
) =>
  (!workspaceKey || item.companies?.includes(workspaceKey)) &&
  (!productKey || item.products?.includes(productKey));

const inWindow = (timestamp: number, since?: number) =>
  since === undefined || timestamp >= since;

const sourceArgs = {
  productKey: v.optional(v.string()),
  workspaceKey: v.optional(v.string()),
};

const filterBySource = <T extends { companyKey?: string; productKey?: string }>(
  items: T[],
  args: { productKey?: string; workspaceKey?: string },
) =>
  items.filter((item) =>
    matchesSource(item, args.workspaceKey, args.productKey),
  );

const filterContactsBySource = <
  T extends { companies?: string[]; products?: string[] },
>(
  items: T[],
  args: { productKey?: string; workspaceKey?: string },
) =>
  items.filter((item) =>
    matchesContactSource(item, args.workspaceKey, args.productKey),
  );

export const getOverview = query({
  args: sourceArgs,
  returns: v.object({
    openTickets: v.number(),
    newFeedback: v.number(),
    queuedEmails: v.number(),
    contacts: v.number(),
    contactSubmissions: v.number(),
    accountCreations: v.number(),
    recentSearches: v.number(),
  }),
  handler: async (ctx, args) => {
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
      openTickets: filterBySource(openTickets, args).length,
      newFeedback: filterBySource(newFeedback, args).length,
      queuedEmails: filterBySource(queuedEmails, args).length,
      contacts: filterContactsBySource(contacts, args).length,
      contactSubmissions: filterBySource(contactSubmissions, args).length,
      accountCreations: filterBySource(accountCreations, args).length,
      recentSearches: filterBySource(recentSearches, args).length,
    };
  },
});

export const listTickets = query({
  args: {
    ...sourceArgs,
    status: v.optional(ticketStatus),
    limit: limitArg,
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status;

    if (status) {
      const tickets = await ctx.db
        .query("supportTickets")
        .withIndex("by_status_updated_at", (q) => q.eq("status", status))
        .order("desc")
        .take(200);

      return filterBySource(tickets, args).slice(0, limit);
    }

    const tickets = await ctx.db.query("supportTickets").order("desc").take(200);

    return filterBySource(tickets, args).slice(0, limit);
  },
});

export const listFeedback = query({
  args: {
    ...sourceArgs,
    status: v.optional(feedbackStatus),
    limit: limitArg,
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status;

    if (status) {
      const feedback = await ctx.db
        .query("feedbackItems")
        .withIndex("by_status_created_at", (q) => q.eq("status", status))
        .order("desc")
        .take(200);

      return filterBySource(feedback, args).slice(0, limit);
    }

    const feedback = await ctx.db.query("feedbackItems").order("desc").take(200);

    return filterBySource(feedback, args).slice(0, limit);
  },
});

export const listContacts = query({
  args: { ...sourceArgs, limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const contacts = await ctx.db.query("contacts").order("desc").take(200);

    return filterContactsBySource(contacts, args).slice(0, args.limit ?? 50);
  },
});

export const listContactSubmissions = query({
  args: { ...sourceArgs, limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("contactSubmissions")
      .order("desc")
      .take(200);

    return filterBySource(submissions, args).slice(0, args.limit ?? 50);
  },
});

export const listAccountCreations = query({
  args: { ...sourceArgs, limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accountCreations")
      .order("desc")
      .take(200);

    return filterBySource(accounts, args).slice(0, args.limit ?? 50);
  },
});

export const listHelpSearches = query({
  args: { ...sourceArgs, limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const searches = await ctx.db.query("helpSearches").order("desc").take(200);

    return filterBySource(searches, args).slice(0, args.limit ?? 50);
  },
});

export const listEmailJobs = query({
  args: { ...sourceArgs, limit: limitArg },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const emails = await ctx.db.query("emailJobs").order("desc").take(200);

    return filterBySource(emails, args).slice(0, args.limit ?? 50);
  },
});

export const listActivity = query({
  args: {
    limit: limitArg,
    productKey: v.optional(v.string()),
    since: v.optional(v.number()),
    type: v.optional(signalType),
    workspaceKey: v.optional(v.string()),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
            matchesContactSource(item, args.workspaceKey, args.productKey),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
            matchesSource(item, args.workspaceKey, args.productKey),
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
