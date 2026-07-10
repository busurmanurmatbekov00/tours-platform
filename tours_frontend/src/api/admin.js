import { api } from './client';

// ============ ВЕРИФИКАЦИЯ ============
export const getAdminVerificationList = () =>
  api.get('/providers/admin/verification/').then((res) => res.data);

export const getAdminVerificationDetail = (id) =>
  api.get(`/providers/admin/verification/${id}/`).then((res) => res.data);

export const approveVerification = (id, comment = '') =>

export const rejectVerification = (id, comment = '') =>
  api.post(`/providers/admin/verification/${id}/reject/`, { comment }).then((res) => res.data);

// ============ ИСПОЛНИТЕЛИ ============
export const getAdminProviders = (params) =>
  api.get('/providers/admin/providers/', { params }).then((res) => res.data);

export const blockProvider = (profileId) =>
  api.post(`/providers/admin/providers/${profileId}/block/`).then((res) => res.data);

export const unblockProvider = (profileId) =>
  api.post(`/providers/admin/providers/${profileId}/unblock/`).then((res) => res.data);

// ============ ТУРЫ (список и действия из AdminToursPage) ============
export const getAdminTours = (params) =>
  api.get('/providers/admin/tours/', { params }).then((res) => res.data);

export const approveTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/approve/`).then((res) => res.data);

export const hideTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/hide/`, { reason: 'Скрыто модератором' }).then((res) => res.data);

export const unhideTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/unhide/`).then((res) => res.data);

export const deleteAdminTour = (tourId) =>
  api.post(`/providers/admin/tours/${tourId}/delete/`, { reason: 'Удалено модератором' }).then((res) => res.data);

// ============ ДЕТАЛЬНАЯ СТРАНИЦА ТУРА (с причиной) ============
// Просмотр деталей тура (только чтение)
export async function getAdminTourDetail(tourId) {
  const { data } = await api.get(`/providers/admin/tours/${tourId}/`);
  return data;
}

// Скрыть с причиной (для страницы деталей)
export async function hideAdminTour(tourId, reason) {
  const { data } = await api.post(
    `/providers/admin/tours/${tourId}/hide/`,
    { reason }
  );
  return data;
}

// Снять скрытие
export async function unhideAdminTour(tourId) {
  const { data } = await api.post(
    `/providers/admin/tours/${tourId}/unhide/`,
    {}
  );
  return data;
}

// Удалить в архив с причиной
export async function deleteAdminTourWithReason(tourId, reason) {
  const { data } = await api.post(
    `/providers/admin/tours/${tourId}/delete/`,
    { reason }
  );
  return data;
}