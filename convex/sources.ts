import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const sourceInput = {
  key: v.string(),
  name: v.string(),
};

const cleanKey = (key: string) => key.trim().toLowerCase();
const cleanName = (name: string) => name.trim();

const uniqueSources = (items: { companyKey?: string; productKey?: string }[]) => {
  const workspaces = new Set<string>();
  const products = new Set<string>();

  for (const item of items) {
    if (!item.companyKey) {
      continue;
    }

    workspaces.add(item.companyKey);

    if (item.productKey) {
      products.add(`${item.companyKey}:${item.productKey}`);
    }
  }

  return { products, workspaces };
};

export const listSettings = query({
  args: {},
  returns: v.object({
    discoveredWorkspaces: v.array(v.string()),
    discoveredProducts: v.array(
      v.object({ productKey: v.string(), workspaceKey: v.string() }),
    ),
    products: v.array(v.any()),
    workspaces: v.array(v.any()),
  }),
  handler: async (ctx) => {
    const [workspaces, products, events] = await Promise.all([
      ctx.db.query("sourceCompanies").order("asc").collect(),
      ctx.db.query("sourceProducts").order("asc").collect(),
      ctx.db.query("ingestEvents").order("desc").take(500),
    ]);

    const configuredWorkspaces = new Set(workspaces.map((item) => item.key));
    const configuredProducts = new Set(
      products.map((item) => `${item.companyKey}:${item.key}`),
    );
    const discovered = uniqueSources(events);

    return {
      discoveredWorkspaces: [...discovered.workspaces]
        .filter((key) => !configuredWorkspaces.has(key))
        .sort(),
      discoveredProducts: [...discovered.products]
        .map((value) => {
          const [workspaceKey, productKey] = value.split(":");

          return { productKey, workspaceKey };
        })
        .filter(
          ({ productKey, workspaceKey }) =>
            !configuredProducts.has(`${workspaceKey}:${productKey}`),
        )
        .sort((first, second) =>
          `${first.workspaceKey}:${first.productKey}`.localeCompare(
            `${second.workspaceKey}:${second.productKey}`,
          ),
        ),
      products: products.map((product) => ({
        key: product.key,
        name: product.name,
        workspaceKey: product.companyKey,
      })),
      workspaces,
    };
  },
});

export const upsertWorkspace = mutation({
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
    workspaceKey: v.string(),
  },
  returns: v.id("sourceProducts"),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const companyKey = cleanKey(args.workspaceKey);
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

export const removeWorkspace = mutation({
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
    key: v.string(),
    workspaceKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = cleanKey(args.key);
    const companyKey = cleanKey(args.workspaceKey);
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

export const upsertCompany = upsertWorkspace;
export const removeCompany = removeWorkspace;

export const seedWorkspaces = mutation({
  args: {
    products: v.array(
      v.object({
        key: v.string(),
        name: v.string(),
        workspaceKey: v.string(),
      }),
    ),
    workspaces: v.array(v.object(sourceInput)),
  },
  returns: v.object({
    products: v.number(),
    workspaces: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const workspaceInput of args.workspaces) {
      const workspace = {
        key: cleanKey(workspaceInput.key),
        name: cleanName(workspaceInput.name),
      };
      const existing = await ctx.db
        .query("sourceCompanies")
        .withIndex("by_key", (q) => q.eq("key", workspace.key))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: workspace.name,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("sourceCompanies", {
          ...workspace,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    for (const productInput of args.products) {
      const product = {
        key: cleanKey(productInput.key),
        name: cleanName(productInput.name),
        workspaceKey: cleanKey(productInput.workspaceKey),
      };
      const companyKey = product.workspaceKey;
      const existing = await ctx.db
        .query("sourceProducts")
        .withIndex("by_key", (q) => q.eq("key", product.key))
        .filter((q) => q.eq(q.field("companyKey"), companyKey))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: product.name,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("sourceProducts", {
          key: product.key,
          name: product.name,
          companyKey,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      products: args.products.length,
      workspaces: args.workspaces.length,
    };
  },
});
