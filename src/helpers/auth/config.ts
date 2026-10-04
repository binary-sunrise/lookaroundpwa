import { authClient, getStoredToken } from './client';
import type { AuthUser, AuthUserProfile } from './types';

export const userManager = {
  async getUser(): Promise<AuthUser | null> {
    try {
      const token = getStoredToken();
      const result = await authClient.getSession({
        fetchOptions: token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined,
      });
      if (!result?.data?.user) {
        return null;
      }

      const u = result.data.user as any;
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
        access_token: result.data.session?.token || '',
        token_type: 'Bearer',
        expires_at: result.data.session?.expiresAt
          ? Math.floor(new Date(result.data.session.expiresAt).getTime() / 1000)
          : undefined,
      };
    } catch {
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('[Auth] Error clearing user session:', err);
    }
  },
};
