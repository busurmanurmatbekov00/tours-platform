import { api } from './client';

export async function login(email, password) {
  const { data } = await api.post('/auth/login/', { email, password });
  return data; // { user, access, refresh }
}

export async function registerProvider(payload) {
  const { data } = await api.post('/auth/register/', payload);
  return data;
}