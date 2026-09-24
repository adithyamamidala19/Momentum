/**
 * apiClient.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central, resilient fetch client for all Momentum API communication.
 *
 * Enforces:
 * 1. credentials: 'include' (transmits secure httpOnly session cookies)
 * 2. Cache-Control: 'no-store' (never allows browser disk/cache storage of user data)
 * 3. CSRF token header injection
 * 4. Automatic 401 Unauthorized detection for friendly re-authentication
 * 5. Strict rejection with typed API error objects
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_BASE_URL ||
  '/api';

// Callbacks for 401 handling
let onUnauthorizedCallback = null;

export function setOnUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

export class ApiError extends Error {
  constructor(message, status, details = null, code = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

/**
 * Universal API fetch wrapper
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, signal } = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const requestHeaders = {
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    ...headers
  };

  // Only set Content-Type: application/json if body is not FormData
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Get CSRF token from document meta or memory if available
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  if (csrfMeta && csrfMeta.content) {
    requestHeaders['X-CSRF-Token'] = csrfMeta.content;
  }

  const fetchOptions = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Transmits httpOnly cookie
    cache: 'no-store',
    signal
  };

  if (body) {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to the sanctuary server. Please check your connection.',
      0,
      networkError.message,
      'NETWORK_ERROR'
    );
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (onUnauthorizedCallback && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/logout')) {
      onUnauthorizedCallback();
    }
  }

  // Parse JSON response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else if (contentType.includes('text/')) {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data?.details, data?.code);
  }

  return data;
}

// Convenience REST methods
export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options) => apiRequest(endpoint, { ...options, method: 'POST', body: formData })
};
