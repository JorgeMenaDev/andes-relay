<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Customer Ops Hub Notes

- Always use Bun in this repo. Do not use npm, pnpm, or yarn.
- The app is deployed at `https://customer-ops-hub.vercel.app`.
- Production Convex is `https://confident-yak-264.convex.cloud`.
- Production HTTP ingestion is `https://confident-yak-264.convex.site/ingest`.
- Keep support tickets and feedback as separate concepts. Do not merge those flows.
- Keep product app integration through `@arketix/customer-ops-sdk`; do not reintroduce copy/pasted per-product ingestion clients.
- The SDK currently lives at `packages/customer-ops-sdk` and is consumed locally with Bun workspaces.
- The SDK is publish-ready for GitHub Packages, but publishing requires registry auth and a real `bun publish` step.
- Root `bun run build` runs `prebuild`, which builds the SDK before Next.js builds. Preserve that ordering.
- Do not commit `.env.local`, ingestion secrets, Resend keys, Clerk keys, or GitHub package tokens.
- Generated SDK `dist` output is ignored and should not be committed.

## Verification

Use these checks after changing app or SDK code:

```bash
bun run check
bun run poc:submit
```

`bun run poc:submit` should submit through the SDK and return `created` for fresh event ids or `duplicate` for existing POC ids.
