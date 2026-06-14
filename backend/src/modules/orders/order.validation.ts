import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const toNumber = (v: unknown) => (typeof v === "string" ? Number(v) : v);

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.preprocess(toNumber, z.number().int().positive()),
        })
      )
      .min(1, "An order must contain at least one item"),
  }),
});

export const updateOrderSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    customerId: z.string().uuid().optional(),
    notes: z.string().max(1000).nullable().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.preprocess(toNumber, z.number().int().positive()),
        })
      )
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.preprocess(toNumber, z.number().int().positive()).optional(),
    pageSize: z.preprocess(toNumber, z.number().int().positive().max(100)).optional(),
    search: z.string().max(120).optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    customerId: z.string().uuid().optional(),
    sortBy: z.enum(["orderNumber", "totalAmount", "status", "createdAt"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
