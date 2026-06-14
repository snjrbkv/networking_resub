import { z } from "zod";

const toNumber = (v: unknown) => (typeof v === "string" ? Number(v) : v);

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    address: z.string().max(300).optional(),
    company: z.string().max(150).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(40).nullable().optional(),
    address: z.string().max(300).nullable().optional(),
    company: z.string().max(150).nullable().optional(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.preprocess(toNumber, z.number().int().positive()).optional(),
    pageSize: z.preprocess(toNumber, z.number().int().positive().max(100)).optional(),
    search: z.string().max(120).optional(),
    sortBy: z.enum(["name", "company", "createdAt"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
