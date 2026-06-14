import { z } from "zod";

const toNumber = (v: unknown) => (typeof v === "string" ? Number(v) : v);

export const stockMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.preprocess(toNumber, z.number().int().positive()),
    reason: z.string().max(300).optional(),
  }),
});

export const listHistorySchema = z.object({
  query: z.object({
    page: z.preprocess(toNumber, z.number().int().positive()).optional(),
    pageSize: z.preprocess(toNumber, z.number().int().positive().max(100)).optional(),
    productId: z.string().uuid().optional(),
    type: z.enum(["STOCK_IN", "STOCK_OUT"]).optional(),
  }),
});
