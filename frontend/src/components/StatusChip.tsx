import { Chip } from "@mui/material";
import { OrderStatus } from "../types";

const map: Record<OrderStatus, { label: string; color: "default" | "info" | "warning" | "success" | "primary" }> = {
  PENDING: { label: "Pending", color: "warning" },
  PROCESSING: { label: "Processing", color: "info" },
  SHIPPED: { label: "Shipped", color: "primary" },
  DELIVERED: { label: "Delivered", color: "success" },
};

export default function StatusChip({ status }: { status: OrderStatus }) {
  const cfg = map[status] ?? { label: status, color: "default" as const };
  return <Chip size="small" label={cfg.label} color={cfg.color} variant="filled" />;
}
