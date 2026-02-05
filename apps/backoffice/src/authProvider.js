// Jungeui Labs - Python FastAPI 인증 (루트 .env 의 VITE_API_URL)
const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) console.error('VITE_API_URL is required in .env');

const STORAGE_USER = 'user';
const STORAGE_TOKEN = 'access_token';

export const authProvider = {
  login: ({ username, password }) => {
    return fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return res.json().then((body) => {
          throw new Error(body.detail || '로그인에 실패했습니다.');
        });
      })
      .then((data) => {
        localStorage.setItem(STORAGE_TOKEN, data.access_token);
        localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
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
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    return Promise.resolve();
  },

  checkAuth: () => {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const user = localStorage.getItem(STORAGE_USER);
    if (!token && !user) return Promise.reject(new Error('인증이 필요합니다.'));
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error?.status || error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_USER) || '{}');
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
