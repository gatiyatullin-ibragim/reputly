import api from './axios'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}

export const businessApi = {
  getAll:  ()           => api.get('/businesses'),
  create:  (data)       => api.post('/businesses', data),
  update:  (id, data)   => api.patch(`/businesses/${id}`, data),
  remove:  (id)         => api.delete(`/businesses/${id}`),
}

export const locationApi = {
  getAll:  ()    => api.get('/locations'),
  create:  (data) => api.post('/locations', data),
  sync:    (id)  => api.post(`/locations/${id}/sync`),
  remove:  (id)  => api.delete(`/locations/${id}`),
}

export const reviewApi = {
  getAll:       (params) => api.get('/reviews', { params }),
  getOne:       (id)     => api.get(`/reviews/${id}`),
  generate:     (id, style) => api.post(`/reviews/${id}/generate`, { style }),
  markReplied:  (id)     => api.patch(`/reviews/${id}/reply`),
}

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
}
