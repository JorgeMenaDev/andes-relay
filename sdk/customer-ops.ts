type CompanyKey = "andesphere" | "arketix";
type Locale = "en" | "es" | "pt" | "fr" | "de";
type Priority = "low" | "normal" | "high" | "urgent";

type SourceConfig = {
  endpoint: string;
  secret: string;
  companyKey: CompanyKey;
  productKey: string;
  environment?: string;
};

type Contact = {
  email: string;
  name?: string;
  locale?: Locale;
  externalId?: string;
};

type Context = {
  currentUrl?: string;
  userAgent?: string;
  accountId?: string;
};

type BaseEventInput = {
  eventId: string;
  occurredAt?: number;
  contact?: Contact;
  context?: Context;
};

type SupportTicketInput = BaseEventInput & {
  externalId?: string;
  title: string;
  message: string;
  topic?: string;
  priority?: Priority;
};

type FeedbackInput = BaseEventInput & {
  externalId?: string;
  title: string;
  message: string;
  type?: string;
};

type HelpSearchInput = BaseEventInput & {
  query: string;
  resultCount?: number;
};

type EmailIntentInput = BaseEventInput & {
  recipientEmail: string;
  templateKey: string;
  subject: string;
  locale?: Locale;
};

const buildHeaders = (secret: string) => ({
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
});

export const createCustomerOpsClient = ({
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
      throw new Error(`Customer Ops ingest failed: ${response.status}`);
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
