import { getStaticUrl } from '../api';

/**
 * content_html 내 img src 중 상대 경로(또는 /static/ 경로)를 API 기준 절대 URL로 치환.
 * 이미 http://, https:// 로 시작하는 src는 그대로 둠.
 */
export function processContentHtml(html) {
  if (!html) return '';
  return html.replace(/src=(["'])([^"']+)\1/g, (match, quote, src) => {
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return match;
    const absoluteUrl = getStaticUrl(trimmed);
    return `src=${quote}${absoluteUrl}${quote}`;
  });
}
