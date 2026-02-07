export const VITE_API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const VITE_CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
/** Utterances 댓글용 GitHub repo (예: 'username/repo'). 비어 있으면 댓글 영역 미표시. */
export const VITE_UTTERANCES_REPO = (import.meta.env.VITE_UTTERANCES_REPO || '').trim();
