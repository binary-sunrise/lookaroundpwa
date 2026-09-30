import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { mockDb } from './mockDb';
import { refreshMockToken } from './auth';

/**
 * Normalizes a URL to easily match path endpoints regardless of hostname / origin.
 */
function getPathAndQuery(urlStr: string): { pathname: string; searchParams: URLSearchParams } {
  try {
    const url = new URL(urlStr, window.location.origin);
    return { pathname: url.pathname, searchParams: url.searchParams };
  } catch {
    const parts = urlStr.split('?');
    return {
      pathname: parts[0],
      searchParams: new URLSearchParams(parts[1] || ''),
    };
  }
}

/**
 * Handles all BioCollect API requests made via Axios.
 */
export async function handleMockAxiosRequest(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = config.url || '';
  const method = (config.method || 'GET').toUpperCase();
  const { pathname, searchParams } = getPathAndQuery(url);

  // 1. Hubs list: /ws/hub/pwaList
  if (pathname.includes('/ws/hub/pwaList') && method === 'GET') {
    console.log('[MockAPI] GET /ws/hub/pwaList');
    const hubs = mockDb.getHubs();
    return createAxiosResponse(config, 200, hubs);
  }

  // 2. Project search: /ws/project/search
  if (pathname.includes('/ws/project/search') && method === 'GET') {
    const hub = searchParams.get('hub') || undefined;
    const sort = searchParams.get('sort') || 'dateCreatedSort';
    const isUserPage = searchParams.get('isUserPage') === 'true';
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const max = Number.parseInt(searchParams.get('max') || '30', 10);
    const query = searchParams.get('q') || searchParams.get('queryText') || undefined;

    console.log('[MockAPI] GET /ws/project/search', { hub, sort, query, offset, max, isUserPage });
    const result = mockDb.getProjects({ hub, query, sort, offset, max, isUserPage });

    return createAxiosResponse(config, 200, {
      facets: [],
      total: result.total,
      projects: result.projects,
    });
  }

  // 3. Single project: /ws/project/:projectId
  const projectMatch = pathname.match(/\/ws\/project\/([^/?#]+)$/);
  if (projectMatch && method === 'GET') {
    const projectId = projectMatch[1];
    console.log(`[MockAPI] GET /ws/project/${projectId}`);
    const project = mockDb.getProjectById(projectId);

    if (project) {
      return createAxiosResponse(config, 200, project);
    }
    return createAxiosResponse(config, 404, { error: 'Project not found' });
  }

  // 4. Survey list: /ws/survey/list/:projectId
  const surveyMatch = pathname.match(/\/ws\/survey\/list\/([^/?#]+)$/);
  if (surveyMatch && method === 'GET') {
    const projectId = surveyMatch[1];
    console.log(`[MockAPI] GET /ws/survey/list/${projectId}`);
    const surveys = mockDb.getSurveys(projectId);
    return createAxiosResponse(config, 200, surveys);
  }

  // 5. BioActivity search: /ws/bioactivity/search
  if (pathname.includes('/ws/bioactivity/search') && method === 'GET') {
    const view = searchParams.get('view') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const max = Number.parseInt(searchParams.get('max') || '20', 10);
    const fq = searchParams.getAll('fq');

    console.log('[MockAPI] GET /ws/bioactivity/search', { view, projectId, searchTerm, offset, max });
    const result = mockDb.getActivities({ view, projectId, searchTerm, offset, max, fq });

    return createAxiosResponse(config, 200, result);
  }

  // 6. Delete BioActivity: /ws/bioactivity/delete/:activityId
  const deleteMatch = pathname.match(/\/ws\/bioactivity\/delete\/([^/?#]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const activityId = deleteMatch[1];
    console.log(`[MockAPI] DELETE /ws/bioactivity/delete/${activityId}`);
    mockDb.deleteActivity(activityId);
    return createAxiosResponse(config, 200, { success: true });
  }

  // Not a mocked request
  return null;
}

function createAxiosResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Not Found',
    headers: { 'content-type': 'application/json' },
    config,
    request: {},
  };
}

/**
 * Handles all fetch requests (e.g., OIDC discovery, token refresh).
 */
export async function handleMockFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const method = (init?.method || 'GET').toUpperCase();
  const { pathname } = getPathAndQuery(url);

  // 1. OIDC Token Endpoint (token refresh)
  if (pathname.includes('/token') && method === 'POST') {
    console.log('[MockAPI:Fetch] POST token refresh');
    const tokenData = await refreshMockToken();
    return new Response(JSON.stringify(tokenData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. OIDC Discovery
  if (pathname.includes('.well-known/openid-configuration')) {
    console.log('[MockAPI:Fetch] GET openid-configuration');
    const discovery = {
      issuer: 'https://auth.ala.org.au',
      authorization_endpoint: 'https://auth.ala.org.au/oauth2/authorize',
      token_endpoint: 'https://auth.ala.org.au/oauth2/token',
      userinfo_endpoint: 'https://auth.ala.org.au/oauth2/userInfo',
      end_session_endpoint: 'https://auth.ala.org.au/logout',
      jwks_uri: 'https://auth.ala.org.au/jwks',
      response_types_supported: ['code', 'token', 'id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],
    };
    return new Response(JSON.stringify(discovery), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. UserInfo
  if (pathname.includes('/userInfo')) {
    const active = mockDb.getActiveUser();
    return new Response(JSON.stringify(active), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

/**
 * Registers interceptors on Axios and global fetch.
 */
export function setupMockInterceptors(): void {
  // 1. Setup Axios interceptor
  const defaultAdapter = axios.defaults.adapter;

  axios.defaults.adapter = async (config) => {
    try {
      const mockResponse = await handleMockAxiosRequest(config);
      if (mockResponse) {
        return mockResponse;
      }
    } catch (err) {
      console.error('[MockAPI] Interceptor error:', err);
    }

    if (typeof defaultAdapter === 'function') {
      return defaultAdapter(config);
    }
    // Fallback to fetch adapter if default adapter was undefined
    const fetchAdapter = axios.getAdapter('fetch');
    return fetchAdapter(config);
  };

  // 2. Setup global window.fetch interceptor
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.href;
    } else {
      urlStr = (input as Request).url;
    }

    try {
      const mockResp = await handleMockFetch(urlStr, init);
      if (mockResp) {
        return mockResp;
      }
    } catch (err) {
      console.error('[MockFetch] Interceptor error:', err);
    }

    return originalFetch(input, init);
  };

  console.log('[MockAPI] Axios and Fetch interceptors initialized.');
}
