import { Request, Response } from "express";
import * as service from "./customer.service";

export async function list(req: Request, res: Response) {
  const result = await service.list(req.query as any);
  res.json({ success: true, ...result });
}

export async function getById(req: Request, res: Response) {
  const customer = await service.getById(req.params.id);
  res.json({ success: true, data: customer });
}

export async function history(req: Request, res: Response) {
  const data = await service.getHistory(req.params.id);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response) {
  const customer = await service.create(req.body);
  res.status(201).json({ success: true, data: customer });
}

export async function update(req: Request, res: Response) {
  const customer = await service.update(req.params.id, req.body);
  res.json({ success: true, data: customer });
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.params.id);
  res.json({ success: true, message: "Customer deleted" });
}
