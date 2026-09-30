import { User, type IdTokenClaims } from 'oidc-client-ts';
import { authConfig, userManager } from '../helpers/auth/config';
import { mockDb } from './mockDb';
import type { MockUser } from '../../data';

/**
 * Creates a valid 3-part base64url JWT without requiring external cryptography libraries.
 */
function createMockJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const payload = btoa(JSON.stringify(claims))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signature = btoa('mock-biocollect-pwa-valid-signature')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${header}.${payload}.${signature}`;
}

/**
 * Creates a full oidc-client-ts User object for a mock user profile.
 */
export function createOidcUser(mockUser: MockUser, expiresInSeconds = 3600 * 24 * 7): User {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresInSeconds;
  const authority = authConfig.authority || 'https://auth.ala.org.au';
  const clientId = authConfig.client_id || 'biocollect-pwa-client';

  const claims: Record<string, unknown> = {
    sub: mockUser.sub,
    name: mockUser.name,
    given_name: mockUser.given_name,
    family_name: mockUser.family_name,
    email: mockUser.email,
    email_verified: true,
    'custom:userid': mockUser['custom:userid'],
    userid: Number.parseInt(mockUser['custom:userid'], 10) || 1001,
    roles: mockUser.roles,
    scope: authConfig.scope || 'email openid profile ala/attrs ala/roles',
    exp: expiresAt,
    iat: now,
    iss: authority,
    aud: clientId,
  };

  const idToken = createMockJwt(claims);
  const accessToken = createMockJwt(claims);
  const refreshToken = `mock-refresh-${mockUser.id}-${Date.now()}`;

  return new User({
    id_token: idToken,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    scope: authConfig.scope || 'email openid profile ala/attrs ala/roles',
    expires_at: expiresAt,
    profile: claims as unknown as IdTokenClaims,
  });
}

/**
 * Performs an end-to-end mock login for the specified mock user.
 * Persists the user in the OIDC userStore (localStorage) and notifies listeners.
 */
export async function loginAsMockUser(mockUser?: MockUser): Promise<User> {
  const userToLogin = mockUser || mockDb.getActiveUser();
  mockDb.setActiveUser(userToLogin.id);

  const oidcUser = createOidcUser(userToLogin);
  await userManager.storeUser(oidcUser);

  // Mark welcome as completed so the user is directly taken into the app
  localStorage.setItem('pwa-welcome', 'true');

  console.log(`[MockAuth] Logged in as: ${userToLogin.name} (${userToLogin.email})`);
  return oidcUser;
}

/**
 * Performs a mock sign-out: clears the user from OIDC store and localStorage.
 */
export async function mockSignOut(): Promise<void> {
  await userManager.removeUser();
  console.log('[MockAuth] Signed out successfully.');
}

/**
 * Generates refreshed tokens for the currently authenticated mock user.
 */
export async function refreshMockToken(): Promise<{
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}> {
  const activeUser = mockDb.getActiveUser();
  const newUser = createOidcUser(activeUser, 3600 * 24);

  await userManager.storeUser(newUser);

  console.log('[MockAuth] Tokens refreshed for:', activeUser.name);

  return {
    access_token: newUser.access_token,
    id_token: newUser.id_token || newUser.access_token,
    token_type: 'Bearer',
    expires_in: 86400,
  };
}

/**
 * Installs mock authentication handlers on the global userManager instance.
 * Allows signinRedirect, signoutRedirect, and metadata discovery to function offline.
 */
export function setupMockAuth(): void {
  // Override signinRedirect so calling auth.signinRedirect() from any component immediately logs in!
  userManager.signinRedirect = async (args) => {
    console.log('[MockAuth] userManager.signinRedirect called, performing mock login...');
    const user = await loginAsMockUser();
    // In react-oidc-context, userManager raises userLoaded event
    userManager.events.load(user);

    // If a redirect_uri is specified or current page is signin, navigate to app root
    const base = (import.meta.env.BASE_URL || '/lookaroundpwa').replace(/\/$/, '');
    const defaultRoot = base ? `${base}/` : '/';
    const targetUrl = args?.redirect_uri || authConfig.redirect_uri || defaultRoot;
    if (window.location.pathname.includes('/signin')) {
      window.location.assign(targetUrl);
    }
    return undefined as unknown as Promise<void>;
  };

  // Override signoutRedirect
  userManager.signoutRedirect = async () => {
    console.log('[MockAuth] userManager.signoutRedirect called, performing mock sign out...');
    await mockSignOut();
    const base = (import.meta.env.BASE_URL || '/lookaroundpwa').replace(/\/$/, '');
    window.location.assign(`${base}/signin`);
    return undefined as unknown as Promise<void>;
  };

  // Mock metadata service to prevent network failures on OIDC discovery
  try {
    const authority = authConfig.authority || 'https://auth.ala.org.au';
    userManager.metadataService.getAuthorizationEndpoint = async () => `${authority}/oauth2/authorize`;
    userManager.metadataService.getTokenEndpoint = async () => `${authority}/oauth2/token`;
    userManager.metadataService.getUserInfoEndpoint = async () => `${authority}/oauth2/userInfo`;
    userManager.metadataService.getEndSessionEndpoint = async () => `${authority}/logout`;
  } catch (err) {
    console.warn('[MockAuth] Could not patch metadataService:', err);
  }

  console.log('[MockAuth] Mock Authentication layer initialized.');
}
