import api from './axios';

export const authApi = {
  getCsrf: () => api.get('/auth/csrf-token'),
  register: (payload) => api.post('/auth/register', payload),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  resendOtp: (payload) => api.post('/auth/resend-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  changePassword: (payload) => api.put('/auth/password', payload),
};

export const restaurantApi = {
  getFilters: () => api.get('/restaurants/filters'),
  list: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (payload) => api.post('/restaurants', payload),
  update: (id, payload) => api.put(`/restaurants/${id}`, payload),
  remove: (id) => api.delete(`/restaurants/${id}`),
};

export const reviewApi = {
  getByRestaurant: (restaurantId, params) =>
    api.get(`/reviews/restaurant/${restaurantId}`, { params }),
  getMyReviews: (params) => api.get('/reviews/my-reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (payload) => api.post('/reviews', payload),
  update: (id, payload) => api.put(`/reviews/${id}`, payload),
  remove: (id) => api.delete(`/reviews/${id}`),
};

export const ownerApi = {
  getDashboard: () => api.get('/owner/dashboard'),
  getRestaurant: () => api.get('/owner/restaurant'),
  updateRestaurant: (payload) => api.put('/owner/restaurant', payload),
  getReviews: (params) => api.get('/owner/reviews', { params }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) =>
    api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  assignOwner: (restaurantId, ownerId) =>
    api.put(`/admin/restaurants/${restaurantId}/assign-owner`, {
      ownerId: ownerId || null,
    }),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getOwners: (params) => api.get('/admin/owners', { params }),
  createOwner: (payload) => api.post('/admin/owners', payload),
  updateOwner: (id, payload) => api.put(`/admin/owners/${id}`, payload),
};
