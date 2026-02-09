/**
 * Jungeui Lab API client (루트 .env의 VITE_API_URL 사용)
 *
 * - 개발: 상대 경로(/api/...) 사용 → Vite proxy가 VITE_API_URL로 전달 (same-origin, CORS 없음)
 * - 프로덕션: VITE_API_URL 기준 절대 URL 사용
 * - 네트워크 실패 시 status=0, isNetworkError=true 인 Error throw (호출부에서 구분 가능)
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const isDev = import.meta.env.DEV;

if (isDev && !import.meta.env.VITE_API_URL) {
  console.warn('[apiClient] VITE_API_URL not set; /api requests will use current origin.');
}

function getAccessToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

function getAuthHeaders() {
  const token = getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function resolveUrl(path) {
  if (path.startsWith('http')) return path;
  const base = isDev && API_BASE ? '' : API_BASE;
  const segment = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${segment}` : segment;
}

const apiClient = {
  async request(url, options = {}) {
    const fullUrl = resolveUrl(url);
    const init = {
      ...options,
      headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    };

    let response;
    try {
      response = await fetch(fullUrl, init);
    } catch (e) {
      const err = new Error(e?.message || 'Network request failed');
      err.status = 0;
      err.response = { status: 0, data: null };
      err.isNetworkError = true;
      throw err;
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.response = {
        status: response.status,
        data: await response.json().catch(() => ({})),
      };
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return { data, status: response.status, headers: response.headers };
  },

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  },

  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** multipart/form-data 업로드 (body에 FormData 전달, Content-Type은 제외) */
  async upload(url, formData, options = {}) {
    const fullUrl = resolveUrl(url);
    const headers = { ...getAuthHeaders() };
    delete headers['Content-Type'];
    const response = await fetch(fullUrl, {
      ...options,
      method: 'POST',
      headers: { ...headers, ...(options.headers || {}) },
      body: formData,
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.response = {
        status: response.status,
        data: await response.json().catch(() => ({})),
      };
      throw error;
    }
    const data = await response.json().catch(() => ({}));
    return { data, status: response.status, headers: response.headers };
  },

  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  },

  patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export { getAccessToken };
export default apiClient;
