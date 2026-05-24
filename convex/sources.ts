import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const sourceInput = {
  key: v.string(),
  name: v.string(),
};

const cleanKey = (key: string) => key.trim().toLowerCase();
const cleanName = (name: string) => name.trim();

const uniqueSources = (
  items: { companyKey: string; productKey?: string }[],
) => {
  const companies = new Set<string>();
  const products = new Set<string>();

  for (const item of items) {
    companies.add(item.companyKey);

    if (item.productKey) {
      products.add(`${item.companyKey}:${item.productKey}`);
    }
  }

  return { companies, products };
};

export const listSettings = query({
  args: {},
  returns: v.object({
    companies: v.array(v.any()),
    discoveredCompanies: v.array(v.string()),
    discoveredProducts: v.array(
      v.object({ companyKey: v.string(), productKey: v.string() }),
    ),
    products: v.array(v.any()),
  }),
  handler: async (ctx) => {
    const [companies, products, events] = await Promise.all([
      ctx.db.query("sourceCompanies").order("asc").collect(),
      ctx.db.query("sourceProducts").order("asc").collect(),
      ctx.db.query("ingestEvents").order("desc").take(500),
    ]);

    const configuredCompanies = new Set(companies.map((item) => item.key));
    const configuredProducts = new Set(
      products.map((item) => `${item.companyKey}:${item.key}`),
    );
    const discovered = uniqueSources(events);

    return {
      companies,
      discoveredCompanies: [...discovered.companies]
        .filter((key) => !configuredCompanies.has(key))
        .sort(),
      discoveredProducts: [...discovered.products]
        .map((value) => {
          const [companyKey, productKey] = value.split(":");

          return { companyKey, productKey };
        })
        .filter(
          ({ companyKey, productKey }) =>
            !configuredProducts.has(`${companyKey}:${productKey}`),
        )
        .sort((first, second) =>
          `${first.companyKey}:${first.productKey}`.localeCompare(
            `${second.companyKey}:${second.productKey}`,
          ),
        ),
      products,
    };
  },
});

export const upsertCompany = mutation({
  args: sourceInput,
  returns: v.id("sourceCompanies"),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const name = cleanName(args.name);
    const now = Date.now();
    const existing = await ctx.db
      .query("sourceCompanies")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name, updatedAt: now });

      return existing._id;
    }

    return await ctx.db.insert("sourceCompanies", {
      key,
      name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertProduct = mutation({
  args: {
    ...sourceInput,
    companyKey: v.string(),
  },
  returns: v.id("sourceProducts"),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const companyKey = cleanKey(args.companyKey);
    const name = cleanName(args.name);
    const now = Date.now();
    const existing = await ctx.db
      .query("sourceProducts")
      .withIndex("by_key", (q) => q.eq("key", key))
      .filter((q) => q.eq(q.field("companyKey"), companyKey))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { companyKey, name, updatedAt: now });

      return existing._id;
    }

    return await ctx.db.insert("sourceProducts", {
      key,
      companyKey,
      name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeCompany = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const existing = await ctx.db
      .query("sourceCompanies")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    const products = await ctx.db
      .query("sourceProducts")
      .withIndex("by_company_key", (q) => q.eq("companyKey", key))
      .collect();

    await Promise.all(products.map((product) => ctx.db.delete(product._id)));

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});

export const removeProduct = mutation({
  args: {
    companyKey: v.string(),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const companyKey = cleanKey(args.companyKey);
    const existing = await ctx.db
      .query("sourceProducts")
      .withIndex("by_key", (q) => q.eq("key", key))
      .filter((q) => q.eq(q.field("companyKey"), companyKey))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});
