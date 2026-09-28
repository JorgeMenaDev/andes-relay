import { requireOperator } from "./access";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ticketStatus } from "./validators";

export const updateStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: ticketStatus,
  },
  returns: v.null(),
  handler: async (ctx, { ticketId, status }) => {
    await requireOperator(ctx);
    await ctx.db.patch(ticketId, {
      status,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const addOperatorReply = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  returns: v.id("ticketMessages"),
  handler: async (ctx, { ticketId, message }) => {
    await requireOperator(ctx);
    const now = Date.now();
    const messageId = await ctx.db.insert("ticketMessages", {
      ticketId,
      actor: "operator",
      message,
      occurredAt: now,
    });

    await ctx.db.patch(ticketId, {
      status: "waiting",
      updatedAt: now,
    });

    return messageId;
  },
});
