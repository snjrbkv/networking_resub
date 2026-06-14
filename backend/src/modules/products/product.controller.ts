import { Request, Response } from "express";
import * as service from "./product.service";

export async function list(req: Request, res: Response) {
  const result = await service.list(req.query as any);
  res.json({ success: true, ...result });
}

export async function getById(req: Request, res: Response) {
  const product = await service.getById(req.params.id);
  res.json({ success: true, data: product });
}

export async function create(req: Request, res: Response) {
  const product = await service.create(req.body);
  res.status(201).json({ success: true, data: product });
}

export async function update(req: Request, res: Response) {
  const product = await service.update(req.params.id, req.body);
  res.json({ success: true, data: product });
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.params.id);
  res.json({ success: true, message: "Product deleted" });
}

export async function categories(_req: Request, res: Response) {
  const data = await service.categories();
  res.json({ success: true, data });
}
