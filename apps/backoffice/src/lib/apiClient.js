// Jungeui LabAPI (루트 .env 의 VITE_API_URL 사용)
const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) console.error('VITE_API_URL is required in .env');

const apiClient = {
  async request(url, options = {}) {
    // URL이 절대 경로가 아니면 JSON Server URL 추가
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(fullUrl, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = {
        status: response.status,
        data: await response.json().catch(() => ({})),
      };
      throw error;
    }

    return {
      data: await response.json().catch(() => ({})),
      status: response.status,
      headers: response.headers,
    };
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
};

export default apiClient;
