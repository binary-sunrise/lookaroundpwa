import { useCallback, useEffect } from 'react';
import { useAuth, handleRefresh, handleSignOut } from '#/helpers/auth';
import { useOnLine } from '#/helpers/funcs';

export function TokenHandler() {
  const auth = useAuth();
  const onLine = useOnLine();

  // Helper function to check/refresh auth session
  const tryTokenRefresh = useCallback(async (from: string) => {
    try {
      await handleRefresh();
    } catch (error) {
      console.log('[Auth] Refresh error', error);
      await handleSignOut();
    }
  }, []);

  // Set up periodic session checks if configured
  useEffect(() => {
    const refreshInterval = Number.parseInt(import.meta.env.VITE_AUTH_TOKEN_REFRESH_INTERVAL, 10);
    let refreshHandler: ReturnType<typeof setInterval> | null = null;

    if (auth.isAuthenticated) {
      refreshHandler = setInterval(() => {
        tryTokenRefresh('interval hook');
      }, refreshInterval || 300000);
    }

    return () => {
      if (refreshHandler) clearInterval(refreshHandler);
    };
  }, [auth.isAuthenticated, tryTokenRefresh]);

  // Check authentication status when coming back online
  useEffect(() => {
    if (onLine && auth.isAuthenticated) {
      tryTokenRefresh('onLine hook');
    }
  }, [onLine, auth.isAuthenticated, tryTokenRefresh]);

  return null;
}
