import { createAuthClient } from 'better-auth/react';

export const backendUrl = import.meta.env.VITE_API_BIOCOLLECT || 'http://localhost:3000';

const TOKEN_KEY = 'lookaround_auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage restrictions in private browsing
  }
};

export const authClient = createAuthClient({
  baseURL: backendUrl,
  fetchOptions: {
    credentials: 'include',
    onRequest: (ctx: any) => {
      const token = getStoredToken();
      if (token) {
        if (ctx.headers instanceof Headers) {
          ctx.headers.set('Authorization', `Bearer ${token}`);
        } else if (typeof ctx.headers === 'object' && ctx.headers !== null) {
          ctx.headers.Authorization = `Bearer ${token}`;
        } else {
          ctx.headers = { Authorization: `Bearer ${token}` };
        }
      }
      return ctx;
    },
    onSuccess: (ctx: any) => {
      const token = ctx.data?.token || ctx.data?.session?.token;
      if (token) {
        setStoredToken(token);
      }
    },
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
