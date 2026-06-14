// Shared domain types mirroring the backend API responses.
export type Role = "ADMIN" | "MANAGER" | "WAREHOUSE_STAFF";
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
export type TransactionType = "STOCK_IN" | "STOCK_OUT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string | number;
  quantity: number;
  supplier?: string | null;
  description?: string | null;
  lowStockThreshold: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  createdAt: string;
  _count?: { orders: number };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  product?: { id: string; name: string; sku: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: string | number;
  notes?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; company?: string | null };
  items?: OrderItem[];
  _count?: { items: number };
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export interface InventoryTransaction {
  id: string;
  type: TransactionType;
  quantity: number;
  balanceAfter: number;
  reason?: string | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
  performedBy?: { id: string; name: string } | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface DashboardSummary {
  totals: { products: number; customers: number; orders: number; revenue: number };
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; sku: string; quantity: number; lowStockThreshold: number }[];
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
}
