import { api } from './client';

export const getVisaPolicies = () => api.get('/help/visa-policies/');
export const getCountries = (params) => api.get('/help/countries/', { params });
export const getCountryByIso = (iso) => api.get(`/help/countries/${iso}/`);
export const getInsuranceRequirements = (params) => api.get('/help/insurance/', { params });

export const getHelpCategories = () => api.get('/help/categories/');
export const getHelpArticles = (params) => api.get('/help/articles/', { params });
export const getHelpArticleBySlug = (slug) => api.get(`/help/articles/${slug}/`);