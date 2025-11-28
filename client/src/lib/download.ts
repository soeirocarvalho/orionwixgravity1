export async function downloadWithAuth(options: {
  url: string;
  fileName?: string;
}): Promise<void> {
  const { url, fileName } = options;

  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Download failed with status ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Download failed - received JSON instead of file');
  }

  const blob = await response.blob();
  
  const contentDisposition = response.headers.get('Content-Disposition');
  let downloadFileName = fileName;
  
  if (!downloadFileName && contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
    }
  }
  
  if (!downloadFileName) {
    const urlParts = url.split('/');
    downloadFileName = urlParts[urlParts.length - 1] || 'download';
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = downloadFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(blobUrl);
}
