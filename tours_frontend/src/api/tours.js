import { api } from './client';

// Каталог туров
export const getTours = (params) => api.get('/catalog/tours/', { params });
export const getTourBySlug = (slug) => api.get(`/catalog/tours/${slug}/`);
export const getTourTypes = () => api.get('/catalog/tour-types/');
export const getDifficultyLevels = () => api.get('/catalog/difficulty-levels/');
export const getLocations = () => api.get('/catalog/locations/');

// Исполнители
export const getProviders = (params) => api.get('/catalog/providers/', { params });
export const getProviderBySlug = (slug) => api.get(`/catalog/providers/${slug}/`);
export const getProviderTours = (slug, params) => api.get(`/catalog/providers/${slug}/tours/`, { params });