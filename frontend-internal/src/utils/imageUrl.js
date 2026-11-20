export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default getImageUrl;
