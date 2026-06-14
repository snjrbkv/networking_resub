/**
 * Axios instance with auth + automatic refresh-token handling.
 * - Attaches the access token on every request.
 * - On a 401, attempts a single refresh and replays the original request.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const tokenStore = {
  get access() {
    return localStorage.getItem("accessToken");
  },
  get refresh() {
    return localStorage.getItem("refreshToken");
  },
  set(access: string, refresh: string) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes("/auth/");

    if (status === 401 && !original._retry && !isAuthRoute && tokenStore.refresh) {
      if (isRefreshing) {
        // Queue requests until the refresh completes.
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: tokenStore.refresh,
        });
        const { accessToken, refreshToken } = data.data;
        tokenStore.set(accessToken, refreshToken);
        flushQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        flushQueue(err, null);
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/** Extract a user-friendly error message from an Axios error. */
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as any)?.message ?? err.message;
  }
  return "An unexpected error occurred";
}
