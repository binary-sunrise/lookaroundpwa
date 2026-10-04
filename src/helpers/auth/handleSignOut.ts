import { authClient, setStoredToken } from './client';

export async function handleSignOut(): Promise<void> {
  try {
    setStoredToken(null);
    await authClient.signOut();
  } catch (err) {
    console.error('[Auth] Error during signout:', err);
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  window.location.assign(`${base}/signin`);
}
