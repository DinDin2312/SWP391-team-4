// Where the backend API lives. Set VITE_API_BASE_URL at build time:
// - local dev (default): http://localhost:8080/api
// - deployed behind the same domain (nginx proxy): /api
const fallback = 'http://localhost:8080/api';

export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || fallback).replace(/\/+$/, '');

// Origin part only ('' when the API is served from the same domain), for paths like /api/v1/... or /api/avatars/...
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
