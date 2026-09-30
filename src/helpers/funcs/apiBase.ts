/**
 * Returns the base URL for BioCollect API and PWA iframe interactions.
 * In development or mock backend mode, returns an empty string to use local relative routing.
 */
export function getBioCollectBaseUrl(): string {
  if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_BACKEND !== 'false') {
    return '';
  }
  return import.meta.env.VITE_API_BIOCOLLECT || '';
}

/**
 * Constructs a fully qualified or relative URL for BioCollect endpoints.
 */
export function getBioCollectUrl(path: string): string {
  const base = getBioCollectBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Returns the target origin for postMessage communications with BioCollect iframes.
 * In dev or mock backend mode, returns '*' to ensure cross-origin/local messages are delivered.
 */
export function getBioCollectTargetOrigin(): string {
  if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_BACKEND !== 'false') {
    return '*';
  }
  return import.meta.env.VITE_API_BIOCOLLECT || '*';
}
