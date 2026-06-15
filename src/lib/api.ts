const getApiBase = () => {
  // 1. Check for explicit environment variable (Vite)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Check if running inside native Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
  if (isCapacitor) {
    // 192.168.0.100 points to your machine's local IP
    // This allows physical Android devices on the same Wi-Fi to connect
    return 'http://192.168.0.100:5000';
  }

  // 3. In development web, use relative path (proxied by Vite)
  // This helps avoid CORS issues in local browser testing
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }

  // 4. Fallback to local IP for other cases
  return 'http://192.168.0.100:5000';
};

export const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
