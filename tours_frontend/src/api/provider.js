import { api } from './client';

export const MEDIA_BASE = 'http://127.0.0.1:8000';
export const mediaUrl = (path) => (path ? `${MEDIA_BASE}/media/${path}` : null);

// ---------- Профиль исполнителя ----------
// Эти функции возвращают уже готовые данные (res.data), т.к. используются напрямую в react-query
export const getMyProfile = () => api.get('/providers/me/').then((res) => res.data);
export const updateMyProfile = (payload) => api.patch('/providers/me/', payload).then((res) => res.data);

// ---------- Верификация ----------
export const getMyVerificationRequests = () =>
  api.get('/providers/me/verification/').then((res) => res.data);

export const submitVerificationRequest = () =>
  api.post('/providers/me/verification/').then((res) => res.data);

export const uploadVerificationDocument = (requestId, file, documentTypeId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentTypeId);
  return api
    .post(`/providers/me/verification/${requestId}/documents/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

// ---------- Мои туры ----------
// Эти функции возвращают сырой axios-ответ (res.data достаётся снаружи, в TourFormPage/MyToursPage)
export const getMyTours = (params) => api.get('/providers/me/tours/', { params });
export const getMyTour = (tourId) => api.get(`/providers/me/tours/${tourId}/`);
export const createTour = (payload) => api.post('/providers/me/tours/', payload);
export const updateTour = (tourId, payload) => api.patch(`/providers/me/tours/${tourId}/`, payload);
export const deleteTour = (tourId) => api.delete(`/providers/me/tours/${tourId}/`);

export const uploadTourPhoto = (tourId, file, altText = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) formData.append('alt_text', altText);
  return api.post(`/providers/me/tours/${tourId}/photos/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteTourPhoto = (tourId, photoId) =>
  api.delete(`/providers/me/tours/${tourId}/photos/${photoId}/`);

export const addRoutePoint = (tourId, payload) =>
  api.post(`/providers/me/tours/${tourId}/route/`, payload);
export const deleteRoutePoint = (tourId, pointId) =>
  api.delete(`/providers/me/tours/${tourId}/route/${pointId}/`);

export const setVisaDetails = (tourId, payload) =>
  api.put(`/providers/me/tours/${tourId}/visa/`, payload);
export const setInsuranceDetails = (tourId, payload) =>
  api.put(`/providers/me/tours/${tourId}/insurance/`, payload);

export const submitTour = (tourId) => api.post(`/providers/me/tours/${tourId}/submit/`);

// ---------- Сертификаты ----------
export const getMyCertificates = () =>
  api.get('/providers/me/certificates/').then((res) => res.data);

export const createCertificate = (payload, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  if (file) formData.append('file', file);

  return api.post('/providers/me/certificates/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};

export const deleteCertificate = (certId) =>
  api.delete(`/providers/me/certificates/${certId}/`).then((res) => res.data);

export const getCertificateTypes = () =>
  api.get('/providers/certificate-types/').then((res) => res.data);