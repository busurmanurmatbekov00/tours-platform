import { api } from './client';

export async function login(email, password) {
  const { data } = await api.post('/auth/login/', { email, password });
  return data;
}

export async function registerProvider(payload) {
  const { data } = await api.post('/auth/register/', payload);
  return data;
}

export async function requestEmailOtp(email) {
  const { data } = await api.post('/auth/email-otp/request/', { email });
  return data;
}

export async function verifyEmailOtp(email, code) {
  const { data } = await api.post('/auth/email-otp/verify/', { email, code });
  return data;
}