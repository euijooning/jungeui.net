export const VITE_API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const VITE_CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
/** Utterances 댓글용 GitHub repo (예: 'username/repo'). 비어 있으면 댓글 영역 미표시. */
export const VITE_UTTERANCES_REPO = (import.meta.env.VITE_UTTERANCES_REPO || '').trim();

/** Google AdSense 클라이언트 ID (예: ca-pub-xxxxxxxx). 비어 있으면 광고 영역은 플레이스홀더만 표시. */
export const VITE_ADSENSE_CLIENT_ID = (import.meta.env.VITE_ADSENSE_CLIENT_ID || '').trim();
/** AdSense 상단 광고 슬롯 ID (디스플레이). */
export const VITE_ADSENSE_SLOT_TOP = (import.meta.env.VITE_ADSENSE_SLOT_TOP || '').trim();
/** AdSense 하단 광고 슬롯 ID (Multiplex/디스플레이). */
export const VITE_ADSENSE_SLOT_BOTTOM = (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM || '').trim();
