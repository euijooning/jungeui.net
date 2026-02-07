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

/** @param {{ tree?: boolean }} opts - tree=true면 대/소 계층 구조로 반환 */
export async function fetchCategories(opts = {}) {
  const q = opts.tree ? '?tree=true' : '';
  return request(`/api/categories${q}`);
}

/** 글 단건 조회 (공개용). 비공개 시 백엔드에서 404. */
export async function fetchPost(postId) {
  return request(`/api/posts/${postId}`);
}

/** 이전/다음 글 (published_at 기준). */
export async function fetchPostNeighbors(postId) {
  return request(`/api/posts/${postId}/neighbors`);
}

/** 첨부파일 등 정적 파일 전체 URL (프로덕션에서 API 도메인 사용). */
export function getStaticUrl(path) {
  if (!path) return '';
  const base = import.meta.env.PROD ? (VITE_API_URL || '') : '';
  return base ? `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}` : path;
}
