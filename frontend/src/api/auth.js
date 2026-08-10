import api from "./client";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((r) => r.data),
  resetPassword: (token, payload) =>
    api.post(`/auth/reset-password/${token}`, payload).then((r) => r.data),
  changePassword: (payload) => api.post("/auth/change-password", payload).then((r) => r.data),
  updateProfile: (payload) => api.put("/auth/profile", payload).then((r) => r.data),
};
