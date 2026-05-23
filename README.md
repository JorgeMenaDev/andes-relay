# Customer Ops Hub

Shared support, feedback, help-search, and email operations for Arketix and Andesphere products.

## Stack

- Next.js App Router dashboard
- Convex as the source of truth
- Clerk-ready authentication
- Resend-ready transactional email queue
- HTTP ingestion contract for every product app

## Local Setup

```bash
bun install
bunx convex dev
bun run poc:submit
bun run dev
```

The POC script creates one Andy support ticket, one Andy help search, one Acredix feedback item, and one Acredix queued email.

## Ingestion Contract

Product apps submit events to Convex HTTP actions:

```bash
curl -X POST "$CONVEX_SITE_URL/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_OPS_INGEST_SECRET" \
  -d '{"eventId":"example","type":"help.search","occurredAt":0,"source":{"companyKey":"arketix","productKey":"acredix"},"search":{"query":"support","resultCount":1}}'
```

Feedback and support are separate event types and become separate records. Email intents create queued jobs, so delivery can be centralized without every app implementing Resend.

## Product App Client

Use `sdk/customer-ops.ts` from product apps so every repo submits the same contract:

```ts
import { createCustomerOpsClient } from "./customer-ops";

const customerOps = createCustomerOpsClient({
  endpoint: process.env.CUSTOMER_OPS_ENDPOINT!,
  secret: process.env.CUSTOMER_OPS_INGEST_SECRET!,
  companyKey: "arketix",
  productKey: "acredix",
  environment: process.env.NODE_ENV,
});

await customerOps.submitFeedback({
  eventId: "feedback-123",
  contact: { email: "maria@example.com", locale: "es" },
  title: "Add export",
  message: "Please add PDF export.",
  type: "feature_request",
});
```

The same client has `submitSupportTicket`, `trackHelpSearch`, and `queueEmail`.
