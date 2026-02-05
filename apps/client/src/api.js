import { VITE_API_URL } from './config';

// 개발 시 Vite proxy 사용 시 상대 경로, 프로덕션 시 VITE_API_URL 사용
const baseUrl = import.meta.env.PROD ? (VITE_API_URL || '') : '';

async function request(path, options = {}) {
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function fetchPosts({ page = 1, per_page = 5, category_id, q } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(per_page));
  params.set('status', 'PUBLISHED');
  if (category_id != null && category_id !== '') params.set('category_id', String(category_id));
  if (q && q.trim()) params.set('q', q.trim());
  return request(`/api/posts?${params}`);
}

export async function fetchCategories() {
  return request('/api/categories');
}
