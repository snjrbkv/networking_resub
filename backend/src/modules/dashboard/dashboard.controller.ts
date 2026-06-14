import { Request, Response } from "express";
import * as service from "./dashboard.service";

export async function summary(_req: Request, res: Response) {
  const data = await service.summary();
  res.json({ success: true, data });
}
