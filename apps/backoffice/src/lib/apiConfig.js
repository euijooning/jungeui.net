/**
 * 백오피스 API 베이스 URL·환경 플래그 단일 소스 (순환 의존성 회피용).
 * apiClient가 이 값을 사용·재export하며, authProvider만 여기서 직접 import.
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const isDev = import.meta.env.DEV;
const UPLOAD_URL = API_BASE ? `${API_BASE}/api/assets/upload` : '/api/assets/upload';

export { API_BASE, isDev, UPLOAD_URL };
