import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const listQueued = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) =>
    await ctx.db
      .query("emailJobs")
      .withIndex("by_status_created_at", (q) => q.eq("status", "queued"))
      .order("asc")
      .take(args.limit ?? 10),
});

export const markSent = internalMutation({
  args: {
    emailJobId: v.id("emailJobs"),
    providerMessageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { emailJobId, providerMessageId }) => {
    const now = Date.now();

    await ctx.db.patch(emailJobId, {
      status: "sent",
      providerMessageId,
      updatedAt: now,
      sentAt: now,
    });

    return null;
  },
});

export const markFailed = internalMutation({
  args: {
    emailJobId: v.id("emailJobs"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { emailJobId, error }) => {
    await ctx.db.patch(emailJobId, {
      status: "failed",
      error,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const sendQueued = action({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    sent: v.number(),
    failed: v.number(),
    skipped: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      return { sent: 0, failed: 0, skipped: "missing_resend_env" };
    }

    const jobs = await ctx.runQuery(internal.emails.listQueued, {
      limit: args.limit ?? 10,
    });

    let sent = 0;
    let failed = 0;

    for (const job of jobs) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: job.recipientEmail,
          subject: job.subject,
          html: `<p>${job.subject}</p><p>Template: ${job.templateKey}</p>`,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        await ctx.runMutation(internal.emails.markSent, {
          emailJobId: job._id,
          providerMessageId: payload.id,
        });
        sent += 1;
      } else {
        const error = await response.text();
        await ctx.runMutation(internal.emails.markFailed, {
          emailJobId: job._id,
          error: error.slice(0, 1000),
        });
        failed += 1;
      }
    }

    return { sent, failed };
  },
});
