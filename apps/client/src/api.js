import { VITE_API_URL } from './config';

// 개발 시 Vite proxy 사용 시 상대 경로, 프로덕션 시 VITE_API_URL 사용
const baseUrl = import.meta.env.PROD ? (VITE_API_URL || '') : '';

async function request(path, options = {}) {
  const url = baseUrl ? `${baseUrl}${path}` : path;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      let msg = '요청을 처리할 수 없습니다.';
      if (typeof data?.detail === 'string') {
        msg = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const parts = data.detail.map((d) => (typeof d?.msg === 'string' ? d.msg : '')).filter(Boolean);
        msg = parts.length ? parts.join('\n') : msg;
      }
      const err = new Error(msg);
      err.isApiError = true;
      throw err;
    }
    return res.json();
  } catch (e) {
    if (e && e.isApiError) throw e;
    throw new Error('네트워크 연결을 확인해 주세요.');
  }
}

export async function fetchPosts({ page = 1, per_page = 5, category_id, tag_id, q } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(per_page));
  params.set('status', 'PUBLISHED');
  if (category_id != null && category_id !== '') params.set('category_id', String(category_id));
  if (tag_id != null && tag_id !== '') params.set('tag_id', String(tag_id));
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

/** 소개 페이지 메시지 목록 (sort_order 순). */
export async function fetchAboutMessages() {
  return request('/api/about/messages');
}

/** 프로젝트/경력 섹션 소개 문구 한 줄 (최대 20자). */
export async function fetchProjectsCareersIntro() {
  const res = await request('/api/about/projects-careers-intro');
  return res?.text ?? '';
}

/** 프로젝트 목록 (sort_order 순). 링크·태그·썸네일 URL 포함. */
export async function fetchProjects() {
  return request('/api/projects');
}

/** 경력 목록 (sort_order 순). */
export async function fetchCareers() {
  return request('/api/careers');
}

/** 태그 목록. used_in_posts=true면 공개 포스트에 사용된 태그만 반환 (post_count 포함). */
export async function fetchTags(opts = {}) {
  const q = opts.used_in_posts ? '?used_in_posts=true' : '';
  return request(`/api/tags${q}`);
}

/** 첨부파일 등 정적 파일 전체 URL. 개발/프로덕션 모두 VITE_API_URL이 있으면 API 도메인 사용. */
export function getStaticUrl(path) {
  if (!path) return '';
  const base = (VITE_API_URL || '').replace(/\/$/, '');
  const segment = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${segment}` : segment;
}
