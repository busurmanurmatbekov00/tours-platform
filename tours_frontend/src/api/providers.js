import { api } from './client';

export async function getMyProfile() {
  const { data } = await api.get('/providers/me/');
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.patch('/providers/me/', payload);
  return data;
}

export async function getMyVerificationRequests() {
  const { data } = await api.get('/providers/me/verification/');
  return data;
}

export async function submitVerificationRequest() {
  const { data } = await api.post('/providers/me/verification/', {});
  return data;
}

export async function uploadVerificationDocument(requestId, file, documentTypeId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentTypeId);
  const { data } = await api.post(
    `/providers/me/verification/${requestId}/documents/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}
export async function getMyCertificates() {
  const { data } = await api.get('/providers/me/certificates/');
  return data;
}

export async function addCertificate(payload) {
  const { data } = await api.post('/providers/me/certificates/', payload);
  return data;
}

export async function deleteCertificate(id) {
  await api.delete(`/providers/me/certificates/${id}/`);
}