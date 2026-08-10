import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // send the Flask session cookie on every request
  // No default Content-Type here on purpose: axios sets application/json
  // automatically for plain-object payloads, and lets the browser set
  // multipart/form-data (with the right boundary) for FormData uploads.
});

// The backend requires an X-CSRFToken header on session-authenticated
// mutating requests (logout, change-password, etc). Pre-auth endpoints
// (register/login/forgot-password/reset-password) don't need it.
let cachedCsrfToken = null;

export async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;
  const { data } = await api.get("/auth/csrf-token");
  cachedCsrfToken = data.csrf_token;
  return cachedCsrfToken;
}

api.interceptors.request.use(async (config) => {
  const needsCsrf = config.method !== "get" && config.__skipCsrf !== true;
  if (needsCsrf) {
    const token = await getCsrfToken();
    config.headers["X-CSRFToken"] = token;
  }
  return config;
});

export default api;
