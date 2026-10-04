export function handleSignIn(): void {
  const params = new URLSearchParams(window.location.search);

  if (params.has('code') || params.has('state')) {
    params.delete('code');
    params.delete('state');

    const cleanQuery = params.toString();
    const newUrl = window.location.origin + window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '');
    window.history.replaceState({}, document.title, newUrl);
  }
}
