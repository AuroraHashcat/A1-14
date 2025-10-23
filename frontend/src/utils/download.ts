export type FileDownload = {
  blob: Blob;
  filename: string;
};

export function extractFilenameFromResponse(response: Response, fallback: string): string {
  const disposition =
    response.headers.get('Content-Disposition') ?? response.headers.get('content-disposition');
  if (!disposition) {
    return fallback;
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch (error) {
      console.error('Failed to decode UTF-8 filename', error);
      return utfMatch[1];
    }
  }

  const simpleMatch = /filename="?([^";]+)"?/i.exec(disposition);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return fallback;
}

export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
