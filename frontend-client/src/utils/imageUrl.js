export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const hostname = typeof window !== 'undefined' ? (window.location.hostname || '192.168.1.50') : '192.168.1.50';
  const baseUrl = import.meta.env.VITE_STORAGE_URL || `http://${hostname}:8000`;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default getImageUrl;
