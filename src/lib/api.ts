const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if running inside native Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
  if (isCapacitor) {
    // 192.168.0.100 points to your machine's local IP
    // This allows physical Android devices on the same Wi-Fi to connect
    return 'http://192.168.0.100:5000';
  }

  // In development web, use relative path (proxied by Vite)
  return '';
};

export const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
