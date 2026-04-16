// Re-export client utilities
export { apiFetch, getAccessToken, setTokens, clearTokens, resolveMediaUrl, ApiError, humanizeApiError } from './client';

// Re-export all API namespaces
export { auth } from './auth';
export { me } from './me';
export { users } from './users';
export { listings } from './listings';
export { categories } from './categories';
export { comments } from './comments';
export { ratings } from './ratings';
export { favorites } from './favorites';
export { appointments } from './appointments';
export { contactRequests } from './contact-requests';
export { reports } from './reports';
export { search } from './search';
export { legal } from './legal';
export { contactConfig } from './contact-config';
