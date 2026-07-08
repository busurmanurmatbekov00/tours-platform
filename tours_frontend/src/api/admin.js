import { api } from './client';

// Верификация
export const getAdminVerificationList = () =>
  api.get('/providers/admin/verification/').then((res) => res.data);
export const getAdminVerificationDetail = (id) =>
  api.get(`/providers/admin/verification/${id}/`).then((res) => res.data);
export const approveVerification = (id, comment = '') =>
  api.post(`/providers/admin/verification/${id}/approve/`, { admin_comment: comment }).then((res) => res.data);
export const rejectVerification = (id, comment = '') =>
  api.post(`/providers/admin/verification/${id}/reject/`, { admin_comment: comment }).then((res) => res.data);

// Исполнители
export const getAdminProviders = (params) =>
  api.get('/providers/admin/providers/', { params }).then((res) => res.data);
export const blockProvider = (profileId) =>
  api.post(`/providers/admin/providers/${profileId}/block/`).then((res) => res.data);
export const unblockProvider = (profileId) =>
  api.post(`/providers/admin/providers/${profileId}/unblock/`).then((res) => res.data);

// Туры
export const getAdminTours = (params) =>
  api.get('/providers/admin/tours/', { params }).then((res) => res.data);
export const approveTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/approve/`).then((res) => res.data);
export const hideTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/hide/`).then((res) => res.data);
export const unhideTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/unhide/`).then((res) => res.data);
export const deleteAdminTour = (tourId) =>
  api.delete(`/providers/admin/tours/${tourId}/delete/`).then((res) => res.data);