<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Andes Relay Notes

- Always use Bun in this repo. Do not use npm, pnpm, or yarn.
- OpenAndes is the umbrella brand; Andes Relay is this project.
- The app is currently deployed at `https://customer-ops-hub.vercel.app`.
- Production Convex is `https://confident-yak-264.convex.cloud`.
- Production HTTP ingestion is `https://confident-yak-264.convex.site/ingest`.
- Production dashboard auth is Clerk-protected. The current Vercel URL uses a Clerk test tenant until the final Andes Relay custom domain / production Clerk app is provisioned.
- Keep support tickets, feedback, contact forms, account creations, help searches, and email intents as separate concepts.
- Keep product app integration through `@openandes/relay-sdk`; do not reintroduce copy/pasted per-product ingestion clients after the package is published.
- The SDK currently lives at `packages/relay-sdk` and is consumed locally with Bun workspaces.
- The SDK is public-publish ready for npm, but publishing requires confirming the final npm scope/package name and running a real `bun publish` step.
- Root `bun run build` runs `prebuild`, which builds the SDK before Next.js builds. Preserve that ordering.
- Do not commit `.env.local`, ingestion secrets, Resend keys, Clerk keys, or npm tokens.
- Generated SDK `dist` output is ignored and should not be committed.

## Verification

Use these checks after changing app or SDK code:

```bash
bun run check
bun run poc:submit
```

`bun run poc:submit` should submit through the SDK and return `created` for fresh event ids or `duplicate` for existing POC ids.
