import api from '../services/api';

/**
 * Membuka atau mengunduh dokumen PDF resmi melalui request terotentikasi.
 * Menggunakan Blob URL dari Axios sehingga header Authorization Bearer token otomatis terpasang.
 *
 * @param {string} endpointUrl - Relatif path API (mis. '/payrolls/1/slip-pdf')
 * @param {string} fallbackTitle - Nama file saat disimpan
 */
export const openPdfDocument = async (endpointUrl, fallbackTitle = 'dokumen') => {
  const token = localStorage.getItem('kalebox_token') || localStorage.getItem('token') || '';

  try {
    const cleanUrl = endpointUrl.startsWith('/api') 
      ? endpointUrl.replace('/api', '') 
      : endpointUrl;

    const res = await api.get(cleanUrl, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Buka di tab baru
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Jika popup diblokir browser, buat link download sementara
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fallbackTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return true;
  } catch (err) {
    console.warn('Gagal memuat blob PDF via axios, mencoba tautan langsung ber-token:', err);
    
    // Fallback tautan langsung dengan token query param yang benar (kalebox_token)
    const base = 'http://localhost:8000/api';
    const path = endpointUrl.startsWith('/') ? endpointUrl : `/${endpointUrl}`;
    const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
    const separator = cleanPath.includes('?') ? '&' : '?';
    const directUrl = `http://localhost:8000${cleanPath}${separator}token=${encodeURIComponent(token)}`;
    
    window.open(directUrl, '_blank');
    return false;
  }
};

export default openPdfDocument;
