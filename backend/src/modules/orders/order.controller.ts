import { Request, Response } from "express";
import * as service from "./order.service";

export async function list(req: Request, res: Response) {
  const result = await service.list(req.query as any);
  res.json({ success: true, ...result });
}

export async function getById(req: Request, res: Response) {
  const order = await service.getById(req.params.id);
  res.json({ success: true, data: order });
}

export async function create(req: Request, res: Response) {
  const order = await service.create(req.body, req.user?.id);
  res.status(201).json({ success: true, data: order });
}

export async function update(req: Request, res: Response) {
  const order = await service.update(req.params.id, req.body);
  res.json({ success: true, data: order });
}

export async function updateStatus(req: Request, res: Response) {
  const order = await service.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, data: order });
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.params.id, req.user?.id);
  res.json({ success: true, message: "Order deleted and stock restored" });
}
