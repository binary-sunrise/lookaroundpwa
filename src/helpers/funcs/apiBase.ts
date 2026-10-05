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
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Local PWA html frames (sync.html, settings.html, edit.html, index.html) are static files on the frontend
  if (cleanPath === '/pwa' || cleanPath.startsWith('/pwa?') || cleanPath.startsWith('/pwa/')) {
    const qIndex = cleanPath.indexOf('?');
    const pathname = qIndex !== -1 ? cleanPath.slice(0, qIndex) : cleanPath;
    const search = qIndex !== -1 ? cleanPath.slice(qIndex) : '';

    if (pathname === '/pwa' || pathname === '/pwa/' || pathname === '/pwa/index.html') {
      return `/pwa/index.html${search}`;
    }

    if (
      pathname.startsWith('/pwa/bioActivity/edit') ||
      pathname.startsWith('/pwa/bioActivity/view') ||
      pathname.startsWith('/pwa/bioActivity/index') ||
      pathname === '/pwa/edit' ||
      pathname === '/pwa/edit.html'
    ) {
      const parts = pathname.split('/');
      const editIdx = parts.indexOf('edit');
      const viewIdx = parts.indexOf('view');
      const indexIdx = parts.indexOf('index');
      const actionIdx = editIdx !== -1 ? editIdx : (viewIdx !== -1 ? viewIdx : indexIdx);
      const pathId = actionIdx !== -1 && parts[actionIdx + 1] ? parts[actionIdx + 1] : '';

      const usp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      if (pathId) {
        if (viewIdx !== -1) {
          if (!usp.has('activityId')) usp.set('activityId', pathId);
          if (!usp.has('view')) usp.set('view', 'true');
        } else {
          if (!usp.has('projectActivityId')) usp.set('projectActivityId', pathId);
        }
      }
      if (viewIdx !== -1 && !usp.has('view')) {
        usp.set('view', 'true');
      }

      const queryString = usp.toString() ? `?${usp.toString()}` : '';
      return `/pwa/edit.html${queryString}`;
    }

    if (pathname === '/pwa/settings' || pathname === '/pwa/settings.html') {
      return `/pwa/settings.html${search}`;
    }

    if (pathname === '/pwa/sync' || pathname === '/pwa/sync.html') {
      return `/pwa/sync.html${search}`;
    }

    return `${pathname.endsWith('.html') ? pathname : `${pathname}.html`}${search}`;
  }

  const base = getBioCollectBaseUrl();
  return `${base}${cleanPath}`;
}

/**
 * Returns the target origin for postMessage communications with BioCollect iframes.
 * Returning '*' ensures messages are successfully delivered even if iframe has an opaque/null origin or in cross-origin embeds.
 */
export function getBioCollectTargetOrigin(): string {
  return '*';
}
