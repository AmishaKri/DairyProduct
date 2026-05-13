import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// User API - only uses user tokens
export const userApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

userApi.interceptors.request.use((config) => {
  const userToken = localStorage.getItem("kshira_token");
  if (userToken) config.headers.Authorization = `Bearer ${userToken}`;
  return config;
});

// Admin API - only uses admin tokens
export const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

adminApi.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("kshira_admin_token");
  if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  return config;
});

// Legacy API for backward compatibility
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Prefer admin token; fall back to user token
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("kshira_admin_token");
  const userToken = localStorage.getItem("kshira_token");
  const token = adminToken || userToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const authAPI = {
  adminLogin: (data: { username: string; password: string }) =>
    api.post("/auth/admin-login", data),
};

export const productAPI = {
  getAll: (category?: string) =>
    api.get("/products", { params: category ? { category } : {} }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  toggleHighlight: (id: string) => api.patch(`/products/${id}/highlight`),
};

export const orderAPI = {
  create: (data: any) => userApi.post("/orders", data),
  getAll: () => adminApi.get("/orders"),
  getById: (id: string) => userApi.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    adminApi.patch(`/orders/${id}/status`, { status }),
  updatePayment: (id: string, data: { paymentStatus: string; transactionId?: string; razorpayPaymentId?: string; razorpayOrderId?: string }) =>
    api.patch(`/orders/${id}/payment`, data),
};

export const paymentAPI = {
  createOrder: (amount: number) => api.post("/payment/create-order", { amount }),
  verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post("/payment/verify", data),
};

export const couponAPI = {
  validate: (code: string, orderTotal: number) => api.post("/coupons/validate", { code, orderTotal }),
  apply: (code: string) => api.post("/coupons/apply", { code }),
  getAll: () => api.get("/coupons"),
  create: (data: any) => api.post("/coupons", data),
  toggle: (id: string) => api.patch(`/coupons/${id}/toggle`),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

export const wishlistAPI = {
  add: (productId: string, sessionId?: string) =>
    userApi.post("/wishlist", { productId, ...(sessionId ? { sessionId } : {}) }),
  remove: (productId: string, sessionId?: string) =>
    userApi.delete(`/wishlist/${productId}`, { params: sessionId ? { sessionId } : {} }),
  getAll: () => userApi.get("/wishlist"),
  getAllAdmin: () => adminApi.get("/wishlist/admin/all"),
  check: (productId: string) => userApi.get(`/wishlist/check/${productId}`),
};
