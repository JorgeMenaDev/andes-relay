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

const supportApp = createAndesRelayClient({
  endpoint,
  secret,
  workspaceKey: "example-co",
  productKey: "support-app",
  environment: "production",
});

const salesSite = createAndesRelayClient({
  endpoint,
  secret,
  workspaceKey: "example-co",
  productKey: "sales-site",
  environment: "production",
});

const submissions = [
  () =>
    supportApp.trackAccountCreated({
      eventId: "support-app-account-created-001",
      occurredAt: now - 150_000,
      externalId: "support_app_user_001",
      email: "user@example.com",
      name: "Example User",
      locale: "en",
      source: "clerk",
      context: {
        currentUrl: "https://app.example.com/sign-up",
        userAgent: "poc-script",
        accountId: "support_app_account_001",
      },
    }),
  () =>
    supportApp.submitSupportTicket({
      eventId: "support-app-ticket-001",
      occurredAt: now - 120_000,
      contact: {
        email: "user@example.com",
        name: "Example User",
        locale: "en",
        externalId: "support_app_user_001",
      },
      context: {
        currentUrl: "https://app.example.com/dashboard/inbox",
        userAgent: "poc-script",
        accountId: "support_app_account_001",
      },
      externalId: "support-app-ticket-001",
      title: "Messages are not syncing",
      message: "The dashboard shows the conversation but the latest reply is missing.",
      topic: "inbox",
      priority: "high",
    }),
  () =>
    supportApp.trackHelpSearch({
      eventId: "support-app-help-search-001",
      occurredAt: now - 90_000,
      contact: {
        email: "user@example.com",
        name: "Example User",
        locale: "en",
        externalId: "support_app_user_001",
      },
      context: {
        currentUrl: "https://app.example.com/help",
        userAgent: "poc-script",
      },
      query: "connect inbox",
      resultCount: 2,
    }),
  () =>
    salesSite.submitContactForm({
      eventId: "sales-site-contact-form-001",
      occurredAt: now - 75_000,
      contact: {
        email: "buyer@example.com",
        name: "Example Buyer",
        locale: "en",
        externalId: "sales_site_contact_001",
      },
      context: {
        currentUrl: "https://example.com/contact",
        userAgent: "poc-script",
      },
      externalId: "sales-site-contact-form-001",
      subject: "Pricing question",
      message: "I want to talk about the product.",
      company: "Example Buyer Co",
      page: "https://example.com/contact",
    }),
  () =>
    salesSite.submitFeedback({
      eventId: "sales-site-feedback-001",
      occurredAt: now - 60_000,
      contact: {
        email: "buyer@example.com",
        name: "Example Buyer",
        locale: "en",
        externalId: "sales_site_user_001",
      },
      context: {
        currentUrl: "https://app.example.com/report/42",
        userAgent: "poc-script",
      },
      externalId: "sales-site-feedback-001",
      title: "Add export",
      message: "It would help if the table could export to PDF.",
      type: "feature_request",
    }),
  () =>
    salesSite.queueEmail({
      eventId: "sales-site-email-001",
      occurredAt: now - 30_000,
      contact: {
        email: "buyer@example.com",
        name: "Example Buyer",
        locale: "en",
        externalId: "sales_site_user_001",
      },
      recipientEmail: "buyer@example.com",
      templateKey: "support.followup",
      subject: "We received your request",
      locale: "en",
    }),
] as const;

const client = new ConvexHttpClient(convexUrl);

for (const submit of submissions) {
  const result = await submit();
  console.log(result);
}

const overview = await client.query(api.dashboard.getOverview);
console.log("overview:", overview);
