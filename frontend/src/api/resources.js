import api from "./client";

export const categoriesApi = {
  list: () => api.get("/categories").then((r) => r.data),
  create: (payload) => api.post("/categories", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const productsApi = {
  list: (params) => api.get("/products", { params }).then((r) => r.data),
  create: (payload) => api.post("/products", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const customersApi = {
  list: (params) => api.get("/customers", { params }).then((r) => r.data),
  create: (payload) => api.post("/customers", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/customers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`).then((r) => r.data),
};

export const transactionsApi = {
  list: (params) => api.get("/transactions", { params }).then((r) => r.data),
  get: (id) => api.get(`/transactions/${id}`).then((r) => r.data),
  create: (payload) => api.post("/transactions", payload).then((r) => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};

export const uploadApi = {
  preview: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload/preview", formData).then((r) => r.data);
  },
  commit: (payload) => api.post("/upload/commit", payload).then((r) => r.data),
  progress: (importId) => api.get(`/upload/progress/${importId}`).then((r) => r.data),
  active: () => api.get("/upload/active").then((r) => r.data),
  history: (params) => api.get("/upload/history", { params }).then((r) => r.data),
  undo: (importId) => api.delete(`/upload/${importId}`).then((r) => r.data),
};

export const analyticsApi = {
  overview: (params) => api.get("/analytics/overview", { params }).then((r) => r.data),
  sales: (params) => api.get("/analytics/sales", { params }).then((r) => r.data),
  products: (params) => api.get("/analytics/products", { params }).then((r) => r.data),
  customers: (params) => api.get("/analytics/customers", { params }).then((r) => r.data),
  trends: (params) => api.get("/analytics/trends", { params }).then((r) => r.data),
};

export const forecastingApi = {
  revenue: (params) => api.get("/forecasting/revenue", { params }).then((r) => r.data),
  products: (params) => api.get("/forecasting/products", { params }).then((r) => r.data),
};

export const reportsApi = {
  types: () => api.get("/reports/types").then((r) => r.data),
  generate: (payload) => api.post("/reports/generate", payload).then((r) => r.data),
  history: (params) => api.get("/reports/history", { params }).then((r) => r.data),
  downloadUrl: (id) => `/api/reports/${id}/download`,
  remove: (id) => api.delete(`/reports/${id}`).then((r) => r.data),
};

export const aiApi = {
  status: () => api.get("/ai/status").then((r) => r.data),
  history: () => api.get("/ai/history").then((r) => r.data),
  ask: (message) => api.post("/ai/ask", { message }).then((r) => r.data),
};

export const contactApi = {
  submit: (payload) => api.post("/contact", payload).then((r) => r.data),
  list: (params) => api.get("/contact", { params }).then((r) => r.data),
  markRead: (id) => api.post(`/contact/${id}/mark-read`).then((r) => r.data),
};
