import React, { createContext, useContext, useMemo } from 'react';
import { authClient, useSession } from './client';
import type { AuthUser, AuthUserProfile } from './types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: any | null;
  signIn: typeof authClient.signIn;
  signUp: typeof authClient.signUp;
  signOut: () => Promise<void>;
  refetch: () => Promise<any>;
  error: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  signIn: authClient.signIn,
  signUp: authClient.signUp,
  signOut: async () => {},
  refetch: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, error, refetch } = useSession();

  const authUser: AuthUser | null = useMemo(() => {
    if (!data?.user) return null;

    const u = data.user as any;
    const nameParts = (u.name || '').trim().split(' ');
    const given_name = u.givenName || nameParts[0] || '';
    const family_name = u.familyName || nameParts.slice(1).join(' ') || '';

    const profile: AuthUserProfile = {
      id: u.id,
      name: u.name,
      email: u.email,
      given_name,
      family_name,
      role: u.role || 'Researcher',
      roles: Array.isArray(u.roles) ? u.roles : ['ROLE_USER'],
      avatar: u.avatar || (given_name[0] || 'U') + (family_name[0] || ''),
      organisation: u.organisation || '',
      image: u.image || null,
    };

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      profile,
      access_token: data.session?.token || '',
      token_type: 'Bearer',
      expires_at: data.session?.expiresAt
        ? Math.floor(new Date(data.session.expiresAt).getTime() / 1000)
        : undefined,
    };
  }, [data]);

  const signOutHandler = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('[Auth] SignOut error:', err);
    }
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    window.location.assign(`${base}/signin`);
  };

  const contextValue: AuthContextType = {
    isAuthenticated: !!data?.user,
    isLoading: isPending,
    user: authUser,
    session: data?.session || null,
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    signOut: signOutHandler,
    refetch: async () => refetch(),
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
