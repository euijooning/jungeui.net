/**
 * 클라이언트 앱 설정 (루트 .env 의 VITE_* 로드)
 * - VITE_CLIENT_URL: 이 사이트 공개 주소 (canonical, og:url, 공유 링크 등)
 * - VITE_API_URL: API 서버 (글/프로젝트 등 데이터 요청 시 사용)
 */
export const VITE_CLIENT_URL = import.meta.env.VITE_CLIENT_URL || '';
export const VITE_API_URL = import.meta.env.VITE_API_URL || '';

if (!VITE_CLIENT_URL) console.warn('VITE_CLIENT_URL is not set in .env');
