import { v } from "convex/values";
import { mutation } from "./_generated/server";

const archiveTarget = v.union(
  v.object({
    id: v.id("supportTickets"),
    type: v.literal("ticket"),
  }),
  v.object({
    id: v.id("feedbackItems"),
    type: v.literal("feedback"),
  }),
  v.object({
    id: v.id("contactSubmissions"),
    type: v.literal("form"),
  }),
  v.object({
    id: v.id("accountCreations"),
    type: v.literal("account"),
  }),
  v.object({
    id: v.id("contacts"),
    type: v.literal("contact"),
  }),
  v.object({
    id: v.id("emailJobs"),
    type: v.literal("email"),
  }),
  v.object({
    id: v.id("helpSearches"),
    type: v.literal("search"),
  }),
);

export const archive = mutation({
  args: { target: archiveTarget },
  returns: v.null(),
  handler: async (ctx, { target }) => {
    const archivedAt = Date.now();

    switch (target.type) {
      case "ticket":
        await ctx.db.patch(target.id, { archivedAt, updatedAt: archivedAt });
        break;
      case "feedback":
        await ctx.db.patch(target.id, { archivedAt, updatedAt: archivedAt });
        break;
      case "contact":
        await ctx.db.patch(target.id, { archivedAt, updatedAt: archivedAt });
        break;
      case "email":
        await ctx.db.patch(target.id, { archivedAt, updatedAt: archivedAt });
        break;
      default:
        await ctx.db.patch(target.id, { archivedAt });
    }

    return null;
  },
});
