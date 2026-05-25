import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { opsEvent } from "./validators";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const addUnique = <T>(items: T[], item: T) =>
  items.includes(item) ? items : [...items, item];

const eventExternalId = (eventId: string, externalId?: string) =>
  externalId ?? eventId;

const created = (recordId: string) => ({ status: "created" as const, recordId });
const duplicate = (recordId: string) => ({
  status: "duplicate" as const,
  recordId,
});
const ignored = (recordId: string) => ({ status: "ignored" as const, recordId });

export const ingestEvent = mutation({
  args: { event: opsEvent },
  returns: v.object({
    status: v.union(
      v.literal("created"),
      v.literal("duplicate"),
      v.literal("ignored"),
    ),
    recordId: v.optional(v.string()),
  }),
  handler: async (ctx, { event }) => {
    const existingEvent = await ctx.db
      .query("ingestEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", event.eventId))
      .unique();

    if (existingEvent) {
      return duplicate(existingEvent._id);
    }

    const now = Date.now();
    const workspaceKey = event.source.workspaceKey ?? event.source.companyKey;

    if (!workspaceKey) {
      throw new Error("Andes Relay source.workspaceKey is required");
    }

    const { productKey, environment } = event.source;
    const companyKey = workspaceKey;
    const externalId = event.source.externalId;
    let contactId: Id<"contacts"> | undefined;

    if (event.contact) {
      const normalizedEmail = normalizeEmail(event.contact.email);
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_normalized_email", (q) =>
          q.eq("normalizedEmail", normalizedEmail),
        )
        .unique();

      const externalRefs =
        event.contact.externalId === undefined
          ? []
          : [
              {
                companyKey,
                productKey,
                externalId: event.contact.externalId,
                environment,
              },
            ];

      if (existingContact) {
        contactId = existingContact._id;
        await ctx.db.patch(existingContact._id, {
          email: event.contact.email,
          name: event.contact.name ?? existingContact.name,
          locale: event.contact.locale ?? existingContact.locale,
          companies: addUnique(existingContact.companies, companyKey),
          products: addUnique(existingContact.products, productKey),
          externalRefs: [
            ...existingContact.externalRefs,
            ...externalRefs.filter(
              (ref) =>
                !existingContact.externalRefs.some(
                  (existingRef) =>
                    existingRef.companyKey === ref.companyKey &&
                    existingRef.productKey === ref.productKey &&
                    existingRef.externalId === ref.externalId,
                ),
            ),
          ],
          updatedAt: now,
        });
      } else {
        contactId = await ctx.db.insert("contacts", {
          email: event.contact.email,
          normalizedEmail,
          name: event.contact.name,
          locale: event.contact.locale,
          companies: [companyKey],
          products: [productKey],
          externalRefs,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const eventLogId = await ctx.db.insert("ingestEvents", {
      eventId: event.eventId,
      type: event.type,
      companyKey,
      productKey,
      externalId,
      occurredAt: event.occurredAt,
      createdAt: now,
      payload: event.payload ?? event,
    });

    if (event.type === "support.ticket.created" && event.support) {
      const sourceExternalId = eventExternalId(
        event.eventId,
        event.support.externalId,
      );
      const existingTicket = await ctx.db
        .query("supportTickets")
        .withIndex("by_source_external", (q) =>
          q
            .eq("companyKey", companyKey)
            .eq("productKey", productKey)
            .eq("externalId", sourceExternalId),
        )
        .unique();

      if (existingTicket) {
        return duplicate(existingTicket._id);
      }

      const ticketId = await ctx.db.insert("supportTickets", {
        externalId: sourceExternalId,
        contactId,
        companyKey,
        productKey,
        title: event.support.title,
        message: event.support.message,
        topic: event.support.topic,
        priority: event.support.priority ?? "normal",
        status: "open",
        locale: event.contact?.locale,
        context: event.context,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("ticketMessages", {
        ticketId,
        actor: "user",
        message: event.support.message,
        occurredAt: event.occurredAt,
      });

      return created(ticketId);
    }

    const supportMessage = event.supportMessage;

    if (event.type === "support.ticket.message" && supportMessage) {
      const ticket = await ctx.db
        .query("supportTickets")
        .withIndex("by_source_external", (q) =>
          q
            .eq("companyKey", companyKey)
            .eq("productKey", productKey)
            .eq("externalId", supportMessage.ticketExternalId),
        )
        .unique();

      if (!ticket) {
        return ignored(eventLogId);
      }

      const messageId = await ctx.db.insert("ticketMessages", {
        ticketId: ticket._id,
        actor: supportMessage.actor ?? "user",
        message: supportMessage.message,
        occurredAt: event.occurredAt,
      });

      await ctx.db.patch(ticket._id, {
        status: "open",
        updatedAt: now,
      });

      return created(messageId);
    }

    if (event.type === "feedback.created" && event.feedback) {
      const sourceExternalId = eventExternalId(
        event.eventId,
        event.feedback.externalId,
      );
      const existingFeedback = await ctx.db
        .query("feedbackItems")
        .withIndex("by_source_external", (q) =>
          q
            .eq("companyKey", companyKey)
            .eq("productKey", productKey)
            .eq("externalId", sourceExternalId),
        )
        .unique();

      if (existingFeedback) {
        return duplicate(existingFeedback._id);
      }

      const feedbackId = await ctx.db.insert("feedbackItems", {
        externalId: sourceExternalId,
        contactId,
        companyKey,
        productKey,
        title: event.feedback.title,
        message: event.feedback.message,
        feedbackType: event.feedback.type,
        status: "new",
        locale: event.contact?.locale,
        context: event.context,
        createdAt: now,
        updatedAt: now,
      });

      return created(feedbackId);
    }

    if (event.type === "contact.form.submitted" && event.contactForm) {
      const sourceExternalId = eventExternalId(
        event.eventId,
        event.contactForm.externalId,
      );
      const existingSubmission = await ctx.db
        .query("contactSubmissions")
        .withIndex("by_source_external", (q) =>
          q
            .eq("companyKey", companyKey)
            .eq("productKey", productKey)
            .eq("externalId", sourceExternalId),
        )
        .unique();

      if (existingSubmission) {
        return duplicate(existingSubmission._id);
      }

      const submissionId = await ctx.db.insert("contactSubmissions", {
        externalId: sourceExternalId,
        contactId,
        companyKey,
        productKey,
        subject: event.contactForm.subject,
        message: event.contactForm.message,
        company: event.contactForm.company,
        phone: event.contactForm.phone,
        locale: event.contact?.locale,
        context: {
          ...event.context,
          currentUrl: event.contactForm.page ?? event.context?.currentUrl,
        },
        createdAt: now,
      });

      return created(submissionId);
    }

    if (event.type === "user.account.created" && event.account) {
      const sourceExternalId = eventExternalId(
        event.eventId,
        event.account.externalId,
      );
      const existingAccount = await ctx.db
        .query("accountCreations")
        .withIndex("by_source_external", (q) =>
          q
            .eq("companyKey", companyKey)
            .eq("productKey", productKey)
            .eq("externalId", sourceExternalId),
        )
        .unique();

      if (existingAccount) {
        return duplicate(existingAccount._id);
      }

      const accountId = await ctx.db.insert("accountCreations", {
        externalId: sourceExternalId,
        contactId,
        companyKey,
        productKey,
        email: event.account.email,
        name: event.account.name,
        locale: event.account.locale ?? event.contact?.locale,
        plan: event.account.plan,
        source: event.account.source,
        context: event.context,
        createdAt: now,
      });

      return created(accountId);
    }

    if (event.type === "help.search" && event.search) {
      const searchId = await ctx.db.insert("helpSearches", {
        contactId,
        companyKey,
        productKey,
        query: event.search.query,
        resultCount: event.search.resultCount,
        locale: event.contact?.locale,
        currentUrl: event.context?.currentUrl,
        createdAt: now,
      });

      return created(searchId);
    }

    if (event.type === "email.intent.created" && event.email) {
      const emailId = await ctx.db.insert("emailJobs", {
        companyKey,
        productKey,
        recipientEmail: event.email.recipientEmail,
        templateKey: event.email.templateKey,
        subject: event.email.subject,
        status: "queued",
        locale: event.email.locale ?? event.contact?.locale,
        createdAt: now,
        updatedAt: now,
      });

      return created(emailId);
    }

    if (event.type === "email.preference.updated" && contactId) {
      await ctx.db.patch(contactId, {
        emailPreferences: event.preferences,
        updatedAt: now,
      });

      return created(contactId);
    }

    return ignored(eventLogId);
  },
});
