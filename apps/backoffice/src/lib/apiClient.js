/**
 * Jungeui Lab API client (루트 .env의 VITE_API_URL 사용)
 *
 * - 개발: 상대 경로(/api/...) 사용 → Vite proxy가 VITE_API_URL로 전달 (same-origin, CORS 없음)
 * - 프로덕션: VITE_API_URL 기준 절대 URL 사용
 * - 네트워크 실패 시 status=0, isNetworkError=true 인 Error throw (호출부에서 구분 가능)
 * - 401/403 시: 저장소 정리 후 'session-expired' 이벤트 → 모달 표시, 확인 시 로그인 페이지로
 */
import { API_BASE, isDev, UPLOAD_URL } from './apiConfig';
import { STORAGE_TOKEN, STORAGE_USER } from '../authProvider';

if (isDev && !import.meta.env.VITE_API_URL) {
  console.warn('[apiClient] VITE_API_URL not set; /api requests will use current origin.');
}

function getAccessToken() {
  return localStorage.getItem(STORAGE_TOKEN) || sessionStorage.getItem(STORAGE_TOKEN);
}

function getAuthHeaders() {
  const token = getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

let sessionExpiredDispatched = false;

/** 401/403 시 저장소 정리 후 'session-expired' 이벤트 1회만 발생 → 레이아웃에서 모달 표시, 확인 시 로그인 페이지로 */
function handleUnauthorized() {
  try {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    sessionStorage.removeItem(STORAGE_TOKEN);
    sessionStorage.removeItem(STORAGE_USER);
  } catch (_) {}
  if (sessionExpiredDispatched) return;
  sessionExpiredDispatched = true;
  window.dispatchEvent(new CustomEvent('session-expired'));
}

/** 로그인 만료 모달 확인 후 로그인 페이지로 갈 때 플래그 리셋 (다음 401 시 이벤트 재발생용) */
export function resetSessionExpiredFlag() {
  sessionExpiredDispatched = false;
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
      credentials: 'include',
      headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    };

    let response;
    try {
      response = await fetch(fullUrl, init);
    } catch (e) {
      const err = new Error('네트워크 연결을 확인해 주세요.');
      err.status = 0;
      err.response = { status: 0, data: null };
      err.isNetworkError = true;
      throw err;
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        handleUnauthorized();
      }
      const data = await response.json().catch(() => ({}));
      const msg = typeof data?.detail === 'string' ? data.detail : '요청을 처리할 수 없습니다.';
      const error = new Error(msg);
      error.status = status;
      error.response = { status, data };
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
    let response;
    try {
      response = await fetch(fullUrl, {
        ...options,
        method: 'POST',
        credentials: 'include',
        headers: { ...headers, ...(options.headers || {}) },
        body: formData,
      });
    } catch (e) {
      const err = new Error('네트워크 연결을 확인해 주세요.');
      err.status = 0;
      err.response = { status: 0, data: null };
      err.isNetworkError = true;
      throw err;
    }
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        handleUnauthorized();
      }
      const data = await response.json().catch(() => ({}));
      const msg = typeof data?.detail === 'string' ? data.detail : '요청을 처리할 수 없습니다.';
      const error = new Error(msg);
      error.status = status;
      error.response = { status, data };
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

export { getAccessToken, API_BASE, isDev, UPLOAD_URL };
export default apiClient;
