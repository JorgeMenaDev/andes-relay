import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { createAndesRelayClient } from "@openandes/relay-sdk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const endpoint =
  process.env.ANDES_RELAY_ENDPOINT ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const secret =
  process.env.ANDES_RELAY_INGEST_SECRET ??
  process.env.CUSTOMER_OPS_INGEST_SECRET;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required. Run Convex setup first.");
}

if (!endpoint || !secret) {
  throw new Error(
    "ANDES_RELAY_ENDPOINT and ANDES_RELAY_INGEST_SECRET are required.",
  );
}

const now = Date.now();

const andy = createAndesRelayClient({
  endpoint,
  secret,
  companyKey: "andesphere",
  productKey: "andy-partner",
  environment: "production",
});

const acredix = createAndesRelayClient({
  endpoint,
  secret,
  companyKey: "arketix",
  productKey: "acredix",
  environment: "production",
});

const submissions = [
  () =>
    andy.trackAccountCreated({
      eventId: "andy-account-created-001",
      occurredAt: now - 150_000,
      externalId: "andy_user_001",
      email: "sofia@example.com",
      name: "Sofia Alvarez",
      locale: "es",
      source: "clerk",
      context: {
        currentUrl: "https://andypartner.com/sign-up",
        userAgent: "poc-script",
        accountId: "andy_account_001",
      },
    }),
  () =>
    andy.submitSupportTicket({
      eventId: "andy-support-001",
      occurredAt: now - 120_000,
      contact: {
        email: "sofia@example.com",
        name: "Sofia Alvarez",
        locale: "es",
        externalId: "andy_user_001",
      },
      context: {
        currentUrl: "https://app.andy.com/dashboard/inbox",
        userAgent: "poc-script",
        accountId: "andy_account_001",
      },
      externalId: "andy-ticket-001",
      title: "WhatsApp messages are not syncing",
      message:
        "The dashboard shows the conversation but the latest reply is missing.",
      topic: "whatsapp",
      priority: "high",
    }),
  () =>
    andy.trackHelpSearch({
      eventId: "andy-help-search-001",
      occurredAt: now - 90_000,
      contact: {
        email: "sofia@example.com",
        name: "Sofia Alvarez",
        locale: "es",
        externalId: "andy_user_001",
      },
      context: {
        currentUrl: "https://app.andy.com/help",
        userAgent: "poc-script",
      },
      query: "como conectar whatsapp",
      resultCount: 2,
    }),
  () =>
    acredix.submitContactForm({
      eventId: "acredix-contact-form-001",
      occurredAt: now - 75_000,
      contact: {
        email: "maria@example.com",
        name: "Maria Torres",
        locale: "es",
        externalId: "acredix_contact_001",
      },
      context: {
        currentUrl: "https://acredix.cl/contacto",
        userAgent: "poc-script",
      },
      externalId: "acredix-contact-form-001",
      subject: "Financiamiento para empresa",
      message: "Quiero conversar sobre opciones de financiamiento.",
      company: "Torres SpA",
      page: "https://acredix.cl/contacto",
    }),
  () =>
    acredix.submitFeedback({
      eventId: "acredix-feedback-001",
      occurredAt: now - 60_000,
      contact: {
        email: "maria@example.com",
        name: "Maria Torres",
        locale: "es",
        externalId: "acredix_user_001",
      },
      context: {
        currentUrl: "https://app.acredix.com/deals/42",
        userAgent: "poc-script",
      },
      externalId: "acredix-feedback-001",
      title: "Add lender comparison export",
      message: "It would help if the comparison table could export to PDF.",
      type: "feature_request",
    }),
  () =>
    acredix.queueEmail({
      eventId: "acredix-email-001",
      occurredAt: now - 30_000,
      contact: {
        email: "maria@example.com",
        name: "Maria Torres",
        locale: "es",
        externalId: "acredix_user_001",
      },
      recipientEmail: "maria@example.com",
      templateKey: "support.followup",
      subject: "We received your Acredix request",
      locale: "es",
    }),
] as const;

const client = new ConvexHttpClient(convexUrl);

for (const submit of submissions) {
  const result = await submit();
  console.log(result);
}

const overview = await client.query(api.dashboard.getOverview);
console.log("overview:", overview);
