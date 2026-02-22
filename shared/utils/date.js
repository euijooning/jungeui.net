/**
 * 공통 날짜 포맷 (client·backoffice 공용).
 * 포맷 정책/로케일 변경 시 이 파일만 수정.
 *
 * @param {string|number|Date|null|undefined} iso - ISO 문자열 또는 Date
 * @param {{ dateStyle?: 'short' | 'medium' | 'long', withTime?: boolean, format?: 'dot' }} [options]
 * @returns {string} 포맷된 문자열. 무효 시 ''.
 */
export function formatDate(iso, options = {}) {
  if (iso == null || iso === '') return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';

  const locale = 'ko-KR';

  if (options.dateStyle === 'short') {
    return d.toLocaleDateString(locale, { dateStyle: 'short' });
  }
  if (options.withTime) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
  }
  if (options.format === 'dot') {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }
  if (options.monthShortWithTime) {
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}
