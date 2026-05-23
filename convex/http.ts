import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => json({ ok: true })),
});

http.route({
  path: "/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret =
      process.env.ANDES_RELAY_INGEST_SECRET ??
      process.env.CUSTOMER_OPS_INGEST_SECRET;

    if (!secret) {
      return json({ error: "ANDES_RELAY_INGEST_SECRET is not configured" }, 500);
    }

    const auth = request.headers.get("authorization");
    const key =
      request.headers.get("x-andes-relay-key") ??
      request.headers.get("x-customer-ops-key");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

    if (bearer !== secret && key !== secret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const event = await request.json();
    const result = await ctx.runMutation(api.ingest.ingestEvent, { event });

    return json(result);
  }),
});

export default http;
