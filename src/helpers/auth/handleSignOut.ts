import { authClient } from './client';

export async function handleSignOut(): Promise<void> {
  try {
    await authClient.signOut();
  } catch (err) {
    console.error('[Auth] Error during signout:', err);
  }

  const base = (import.meta.env.BASE_URL || '/lookaroundpwa').replace(/\/$/, '');
  window.location.assign(`${base}/signin`);
}
