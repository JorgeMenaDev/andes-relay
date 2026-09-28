import { ConvexError, v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";

export const operatorIdentity = async (ctx: Pick<QueryCtx, "auth">) => {
  const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
  const subjects = (process.env.ANDES_RELAY_OPERATOR_SUBJECTS ?? "")
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
  const identity = await ctx.auth.getUserIdentity();
  return issuer && identity?.issuer === issuer && subjects.includes(identity.subject)
    ? identity
    : null;
};

export const requireOperator = async (ctx: Pick<QueryCtx, "auth">) => {
  const identity = await operatorIdentity(ctx);
  if (!identity) throw new ConvexError("Operator access required");
  return identity;
};

export const canOperate = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => Boolean(await operatorIdentity(ctx)),
});
