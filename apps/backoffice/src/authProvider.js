// Jungeui Lab- Python FastAPI 인증 (루트 .env 의 VITE_API_URL). API_BASE는 apiConfig에서 단일 소스 (순환 의존성 회피)
import { API_BASE } from './lib/apiConfig';

export const STORAGE_USER = 'user';
export const STORAGE_TOKEN = 'access_token';

function getStorage() {
  return localStorage;
}

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN) || sessionStorage.getItem(STORAGE_TOKEN);
}

function getUser() {
  return localStorage.getItem(STORAGE_USER) || sessionStorage.getItem(STORAGE_USER);
}

function clearAuth() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_TOKEN);
  sessionStorage.removeItem(STORAGE_USER);
  sessionStorage.removeItem(STORAGE_TOKEN);
}

export const authProvider = {
  login: ({ username, password, rememberMe = false }) => {
    return fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        remember_me: !!rememberMe,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return res.json().then((body) => {
          throw new Error(body.detail || '로그인에 실패했습니다.');
        });
      })
      .then((data) => {
        const storage = getStorage();
        storage.setItem(STORAGE_TOKEN, data.access_token);
        storage.setItem(STORAGE_USER, JSON.stringify(data.user));
        return Promise.resolve();
      })
      .catch((err) => {
        if (err.message?.includes('fetch')) {
          throw new Error('API 서버에 연결할 수 없습니다. (.env 의 VITE_API_URL 확인)');
        }
        throw err;
      });
  },

  logout: () => {
    clearAuth();
    return Promise.resolve();
  },

  checkAuth: () => {
    const token = getToken();
    const user = getUser();
    if (!token && !user) return Promise.reject(new Error('인증이 필요합니다.'));
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error?.status || error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        sessionStorage.setItem('login_expired_reason', 'session_expired');
      } catch (_) {}
      clearAuth();
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    try {
      const raw = getUser();
      const user = raw ? JSON.parse(raw) : {};
      return Promise.resolve({
        id: user.id,
        fullName: user.name || user.email,
        avatar: undefined,
      });
    } catch {
      return Promise.reject();
    }
  },

  getPermissions: () => Promise.resolve('admin'),
};
