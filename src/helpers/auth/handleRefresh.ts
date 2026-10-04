import { authClient } from './client';

export async function handleRefresh(): Promise<boolean> {
  try {
    const session = await authClient.getSession();
    return !!session?.data?.user;
  } catch (error) {
    console.error('[Auth] Session check/refresh failed:', error);
    return false;
  }
}
