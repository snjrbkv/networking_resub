/** Typed API service functions for each module. */
import { api } from "./client";
import {
  AuthResponse,
  Customer,
  DashboardSummary,
  InventoryItem,
  InventoryTransaction,
  Order,
  Paginated,
  Product,
  Role,
  User,
} from "../types";

// ─── Auth ───
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: AuthResponse }>("/auth/login", { email, password }).then((r) => r.data.data),
  register: (payload: { name: string; email: string; password: string; role?: Role }) =>
    api.post<{ data: AuthResponse }>("/auth/register", payload).then((r) => r.data.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get<{ data: User }>("/auth/me").then((r) => r.data.data),
};

// ─── Dashboard ───
export const dashboardApi = {
  summary: () => api.get<{ data: DashboardSummary }>("/dashboard").then((r) => r.data.data),
};

// ─── Products ───
export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
export const productApi = {
  list: (q: ProductQuery) =>
    api.get<Paginated<Product>>("/products", { params: q }).then((r) => r.data),
  categories: () => api.get<{ data: string[] }>("/products/categories").then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data),
  create: (payload: Partial<Product>) =>
    api.post<{ data: Product }>("/products", payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<Product>) =>
    api.put<{ data: Product }>(`/products/${id}`, payload).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};

// ─── Customers ───
export const customerApi = {
  list: (q: { page?: number; pageSize?: number; search?: string }) =>
    api.get<Paginated<Customer>>("/customers", { params: q }).then((r) => r.data),
  get: (id: string) => api.get<{ data: Customer }>(`/customers/${id}`).then((r) => r.data.data),
  history: (id: string) =>
    api.get<{ data: { customer: Customer; stats: { totalOrders: number; totalSpent: number }; orders: Order[] } }>(
      `/customers/${id}/history`
    ).then((r) => r.data.data),
  create: (payload: Partial<Customer>) =>
    api.post<{ data: Customer }>("/customers", payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<Customer>) =>
    api.put<{ data: Customer }>(`/customers/${id}`, payload).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
};

// ─── Orders ───
export interface OrderQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
}
export const orderApi = {
  list: (q: OrderQuery) => api.get<Paginated<Order>>("/orders", { params: q }).then((r) => r.data),
  get: (id: string) => api.get<{ data: Order }>(`/orders/${id}`).then((r) => r.data.data),
  create: (payload: { customerId: string; notes?: string; items: { productId: string; quantity: number }[] }) =>
    api.post<{ data: Order }>("/orders", payload).then((r) => r.data.data),
  updateStatus: (id: string, status: string) =>
    api.patch<{ data: Order }>(`/orders/${id}/status`, { status }).then((r) => r.data.data),
  update: (id: string, payload: Partial<Order>) =>
    api.put<{ data: Order }>(`/orders/${id}`, payload).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/orders/${id}`).then((r) => r.data),
};

// ─── Warehouse ───
export const warehouseApi = {
  inventory: () => api.get<{ data: InventoryItem[] }>("/warehouse/inventory").then((r) => r.data.data),
  lowStock: () => api.get<{ data: InventoryItem[] }>("/warehouse/low-stock").then((r) => r.data.data),
  history: (q: { page?: number; pageSize?: number; productId?: string; type?: string }) =>
    api.get<Paginated<InventoryTransaction>>("/warehouse/history", { params: q }).then((r) => r.data),
  stockIn: (payload: { productId: string; quantity: number; reason?: string }) =>
    api.post("/warehouse/stock-in", payload).then((r) => r.data),
  stockOut: (payload: { productId: string; quantity: number; reason?: string }) =>
    api.post("/warehouse/stock-out", payload).then((r) => r.data),
};
