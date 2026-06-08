/**
 * Central API base URL helper.
 * - In development: uses Vite proxy (empty string → relative /api/...)
 * - In production (Vercel): uses VITE_API_URL env var pointing to Render backend
 */
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
