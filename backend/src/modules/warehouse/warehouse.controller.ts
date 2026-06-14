import { Request, Response } from "express";
import { TransactionType } from "@prisma/client";
import * as service from "./warehouse.service";

export async function stockIn(req: Request, res: Response) {
  const { productId, quantity, reason } = req.body;
  const result = await service.stockIn(productId, quantity, reason, req.user?.id);
  res.status(201).json({ success: true, data: result });
}

export async function stockOut(req: Request, res: Response) {
  const { productId, quantity, reason } = req.body;
  const result = await service.stockOut(productId, quantity, reason, req.user?.id);
  res.status(201).json({ success: true, data: result });
}

export async function history(req: Request, res: Response) {
  const q = req.query as any;
  const result = await service.history({
    page: q.page,
    pageSize: q.pageSize,
    productId: q.productId,
    type: q.type as TransactionType | undefined,
  });
  res.json({ success: true, ...result });
}

export async function inventory(_req: Request, res: Response) {
  const data = await service.inventory();
  res.json({ success: true, data });
}

export async function lowStock(_req: Request, res: Response) {
  const data = await service.lowStock();
  res.json({ success: true, data });
}
