import { setupMockInterceptors } from './interceptors';
import { setupMockAuth, loginAsMockUser, mockSignOut, refreshMockToken } from './auth';
import { mockDb } from './mockDb';

let initialized = false;

/**
 * Initializes the complete mock backend layer:
 * - Axios adapter stubs all /ws/* endpoints
 * - Fetch interceptor stubs OIDC discovery and token refresh
 * - Mock authentication overrides userManager for seamless local login/logout
 */
export function setupMockBackend(): void {
  if (initialized) return;
  initialized = true;

  console.log('%c[BioCollect Mock Backend] Initializing...', 'color: #e13535; font-weight: bold;');

  setupMockInterceptors();
  setupMockAuth();

  console.log(
    '%c[BioCollect Mock Backend] Ready! Application running standalone without external API.',
    'color: #51cf66; font-weight: bold;',
  );
}

export { mockDb, loginAsMockUser, mockSignOut, refreshMockToken };
export default setupMockBackend;
