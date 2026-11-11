import axios from 'axios';

let inMemoryCsrfToken = null;
let onUnauthorizedHandler = null;

export const setCsrfToken = (token) => {
  if (token) {
    inMemoryCsrfToken = token;
  }
};

export const clearCsrfToken = () => {
  inMemoryCsrfToken = null;
};

export const registerUnauthorizedHandler = (handler) => {
  onUnauthorizedHandler = handler;
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const method = (config.method || 'get').toUpperCase();
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isMutating) {
      let token = inMemoryCsrfToken || getCookieValue('XSRF-TOKEN');
      if (!token && !config.url?.includes('/auth/csrf-token')) {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL || '/api'}/auth/csrf-token`,
            { withCredentials: true }
          );
          if (res.data?.csrfToken) {
            token = res.data.csrfToken;
            inMemoryCsrfToken = token;
          }
        } catch {
          // Proceed; server will respond cleanly if CSRF is required
        }
      }
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.data?.csrfToken) {
      setCsrfToken(response.data.csrfToken);
    }
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register') &&
      !error.config?.url?.includes('/auth/me')
    ) {
      if (typeof onUnauthorizedHandler === 'function') {
        onUnauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
