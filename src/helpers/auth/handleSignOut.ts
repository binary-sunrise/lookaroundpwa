import { userManager } from './config';

export async function handleSignOut() {
  await userManager.removeUser();

  if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_BACKEND !== 'false') {
    const base = (import.meta.env.BASE_URL || '/lookaroundpwa').replace(/\/$/, '');
    window.location.assign(`${base}/signin`);
    return;
  }

  // Handle Cognito signout differently (they don't supply an end session endpoint via OIDC discovery)
  if (import.meta.env.VITE_AUTH_AUTHORITY.startsWith('https://cognito-idp')) {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
      logout_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
    });

    window.location.replace(`${import.meta.env.VITE_AUTH_END_SESSION_URI}?${params.toString()}`);
  } else {
    await userManager.signoutRedirect({
      post_logout_redirect_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
    });
  }
}

