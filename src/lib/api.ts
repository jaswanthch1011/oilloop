const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if running inside native Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
  if (isCapacitor) {
    // 10.0.2.2 points to host loopback interface in Android Emulator
    // For real devices, you would need to replace this with your machine's IP
    // or a deployed production URL.
    return 'http://10.0.2.2:5000';
  }

  // In development web, use relative path (proxied by Vite)
  return '';
};

export const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
