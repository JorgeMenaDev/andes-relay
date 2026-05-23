import { v } from "convex/values";
import { query } from "./_generated/server";
import { feedbackStatus, ticketStatus } from "./validators";

const limitArg = v.optional(v.number());

export const getOverview = query({
  args: {},
  returns: v.object({
    openTickets: v.number(),
    newFeedback: v.number(),
    queuedEmails: v.number(),
    contacts: v.number(),
    recentSearches: v.number(),
  }),
  handler: async (ctx) => {
    const [openTickets, newFeedback, queuedEmails, contacts, recentSearches] =
      await Promise.all([
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
        ctx.db.query("helpSearches").order("desc").take(25),
      ]);

    return {
      openTickets: openTickets.length,
      newFeedback: newFeedback.length,
      queuedEmails: queuedEmails.length,
      contacts: contacts.length,
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
