import { z } from "zod";

const toNumber = (v: unknown) => (typeof v === "string" ? Number(v) : v);

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    sku: z.string().min(2).max(60),
    category: z.string().min(1).max(80),
    price: z.preprocess(toNumber, z.number().nonnegative()),
    quantity: z.preprocess(toNumber, z.number().int().nonnegative()).optional(),
    supplier: z.string().max(120).optional(),
    description: z.string().max(2000).optional(),
    lowStockThreshold: z.preprocess(toNumber, z.number().int().nonnegative()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    sku: z.string().min(2).max(60).optional(),
    category: z.string().min(1).max(80).optional(),
    price: z.preprocess(toNumber, z.number().nonnegative()).optional(),
    quantity: z.preprocess(toNumber, z.number().int().nonnegative()).optional(),
    supplier: z.string().max(120).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    lowStockThreshold: z.preprocess(toNumber, z.number().int().nonnegative()).optional(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.preprocess(toNumber, z.number().int().positive()).optional(),
    pageSize: z.preprocess(toNumber, z.number().int().positive().max(100)).optional(),
    search: z.string().max(120).optional(),
    category: z.string().max(80).optional(),
    lowStock: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["name", "price", "quantity", "createdAt"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
