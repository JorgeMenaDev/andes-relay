<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Andes Relay Notes

- Always use Bun in this repo. Do not use npm, pnpm, or yarn.
- This repo is intended to be open source. Treat committed files as public by default.
- OpenAndes is the umbrella brand; Andes Relay is this project.
- Use "workspace" for the top-level source boundary in user-facing copy and SDK examples. `companyKey` may remain in storage as a compatibility alias during migration.
- Keep support tickets, feedback, contact forms, account creations, help searches, and email intents as separate concepts.
- Keep product app integration through `@openandes/relay-sdk`; do not reintroduce copy/pasted per-product ingestion clients after the package is published.
- The SDK currently lives at `packages/relay-sdk` and is consumed locally with Bun workspaces.
- The SDK is public-publish ready for npm. Keep package publishing docs generic in committed files; account-specific npm details belong in ignored `.ops/` notes.
- Root `bun run build` runs `prebuild`, which builds the SDK before Next.js builds. Preserve that ordering.
- Do not commit `.env.local`, ingestion secrets, Resend keys, Clerk keys, npm tokens, Vercel account names, personal emails, or production account ownership details.
- Generated SDK `dist` output is ignored and should not be committed.
- Do not hardcode private company, product, account, email, or workspace names in public docs or source. Use generic examples in the repo and source labels in the dashboard settings.
- Use ignored `.ops/` files for Jorge-only deployment/account runbooks. Never reference those private notes from public README examples unless the user explicitly asks to publish sanitized information.
- After local folder moves or project renames, delete `.next/` before running `bun dev` if Turbopack reports `Next.js package not found`.

## Verification

Use these checks after changing app or SDK code:

```bash
bun run check
bun run poc:submit
```

`bun run poc:submit` should submit through the SDK and return `created` for fresh event ids or `duplicate` for existing POC ids.
