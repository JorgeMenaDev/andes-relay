export type Locale = "en" | "es" | "pt" | "fr" | "de";
export type Priority = "low" | "normal" | "high" | "urgent";

export type SourceConfig = {
  endpoint: string;
  secret: string;
  companyKey: string;
  productKey: string;
  environment?: string;
};

export type Contact = {
  email: string;
  name?: string;
  locale?: Locale;
  externalId?: string;
};

export type Context = {
  currentUrl?: string;
  userAgent?: string;
  accountId?: string;
};

export type BaseEventInput = {
  eventId: string;
  occurredAt?: number;
  contact?: Contact;
  context?: Context;
};

export type SupportTicketInput = BaseEventInput & {
  externalId?: string;
  title: string;
  message: string;
  topic?: string;
  priority?: Priority;
};

export type FeedbackInput = BaseEventInput & {
  externalId?: string;
  title: string;
  message: string;
  type?: string;
};

export type ContactFormInput = BaseEventInput & {
  externalId?: string;
  subject?: string;
  message: string;
  company?: string;
  phone?: string;
  page?: string;
};

export type AccountCreatedInput = BaseEventInput & {
  externalId?: string;
  email: string;
  name?: string;
  locale?: Locale;
  plan?: string;
  source?: string;
};

export type HelpSearchInput = BaseEventInput & {
  query: string;
  resultCount?: number;
};

export type EmailIntentInput = BaseEventInput & {
  recipientEmail: string;
  templateKey: string;
  subject: string;
  locale?: Locale;
};

const buildHeaders = (secret: string) => ({
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
});

export const createAndesRelayClient = ({
  endpoint,
  secret,
  companyKey,
  productKey,
  environment,
}: SourceConfig) => {
  const submitEvent = async (event: Record<string, unknown>) => {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/ingest`, {
      method: "POST",
      headers: buildHeaders(secret),
      body: JSON.stringify({
        ...event,
        source: {
          companyKey,
          productKey,
          environment,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Andes Relay ingest failed: ${response.status}`);
    }

    return await response.json();
  };

  return {
    submitEvent,
    submitSupportTicket: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      externalId,
      title,
      message,
      topic,
      priority,
    }: SupportTicketInput) =>
      submitEvent({
        eventId,
        type: "support.ticket.created",
        occurredAt,
        contact,
        context,
        support: { externalId, title, message, topic, priority },
      }),
    submitFeedback: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      externalId,
      title,
      message,
      type,
    }: FeedbackInput) =>
      submitEvent({
        eventId,
        type: "feedback.created",
        occurredAt,
        contact,
        context,
        feedback: { externalId, title, message, type },
      }),
    submitContactForm: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      externalId,
      subject,
      message,
      company,
      phone,
      page,
    }: ContactFormInput) =>
      submitEvent({
        eventId,
        type: "contact.form.submitted",
        occurredAt,
        contact,
        context,
        contactForm: { externalId, subject, message, company, phone, page },
      }),
    trackAccountCreated: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      externalId,
      email,
      name,
      locale,
      plan,
      source,
    }: AccountCreatedInput) =>
      submitEvent({
        eventId,
        type: "user.account.created",
        occurredAt,
        contact: contact ?? { email, name, locale, externalId },
        context,
        account: { externalId, email, name, locale, plan, source },
      }),
    trackHelpSearch: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      query,
      resultCount,
    }: HelpSearchInput) =>
      submitEvent({
        eventId,
        type: "help.search",
        occurredAt,
        contact,
        context,
        search: { query, resultCount },
      }),
    queueEmail: ({
      eventId,
      occurredAt = Date.now(),
      contact,
      context,
      recipientEmail,
      templateKey,
      subject,
      locale,
    }: EmailIntentInput) =>
      submitEvent({
        eventId,
        type: "email.intent.created",
        occurredAt,
        contact,
        context,
        email: { recipientEmail, templateKey, subject, locale },
    }),
  };
};

export const createCustomerOpsClient = createAndesRelayClient;
