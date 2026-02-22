import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getStaticUrl } from '../api';
import { getLinkIcon } from '../utils/linkIcons';

export default function CareerModal({ open, onClose, careers = [] }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const fmt = (d) => {
    if (!d) return '';
    const [y, m] = String(d).split('-');
    return y && m ? `${y}.${m}` : '';
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-modal-title"
      onClick={onClose}
    >
      <div
        className="theme-bg-card theme-card-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
          <h2 id="career-modal-title" className="text-lg font-bold theme-text">
            경력
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded theme-text-secondary hover:bg-(--ui-border)"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4 md:p-6">
          {careers.length === 0 ? (
            <p className="theme-text-secondary text-center py-8">등록된 경력이 없습니다.</p>
          ) : (
            <div className="relative">
              {/* 세로 타임라인 선 (primary 계열) */}
              <div
                className="absolute left-[15px] top-2 bottom-2 w-0.5 rounded-full opacity-40"
                style={{ backgroundColor: 'var(--color-primary)' }}
                aria-hidden
              />
              <div className="space-y-6">
                {careers.map((c) => {
                  const start = fmt(c.start_date);
                  const end = c.end_date ? fmt(c.end_date) : '(현재)';
                  const periodStr = start ? `${start} ~ ${end}` : '';
                  const links = (c.links || [])
                    .filter((l) => l.link_url?.trim())
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .slice(0, 5);
                  const highlights = (c.highlights || []).slice(0, 5).map((h) => (h?.content != null ? String(h.content) : '')).filter(Boolean);
                  const tags = (c.tags || []).slice(0, 5);
                  const logoUrl = c.logo ? getStaticUrl(c.logo) : null;

                  return (
                    <div key={c.id} className="relative flex gap-4 pl-10">
                      {/* 원형 마커 (primary) */}
                      <div
                        className="absolute left-0 top-5 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'var(--ui-card-bg)',
                          borderColor: 'var(--color-primary)',
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                      </div>

                      {/* 카드 컨테이너 */}
                      <div className="flex-1 min-w-0 p-4 rounded-xl border theme-border theme-bg-card shadow-sm">
                        {/* 1. 기간 뱃지 (primary 배경) */}
                        {periodStr && (
                          <div
                            className="inline-block px-2.5 py-1 rounded-md text-xs font-medium mb-3"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
                              color: '#2563eb',
                            }}
                          >
                            {periodStr}
                          </div>
                        )}

                        {/* 2. 회사 이미지 + 3. 회사명 + 4. 역할: 한 블록 */}
                        <div className="flex gap-3 items-start mb-3">
                          {logoUrl && (
                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <img
                                src={logoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base theme-text">{c.company_name || '(회사명)'}</h3>
                            {c.role && (
                              <p className="text-sm theme-text-secondary mt-0.5">{c.role}</p>
                            )}
                          </div>
                        </div>

                        {/* 5. 링크 아이콘 */}
                        {links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {links.map((link) => {
                              const Icon = getLinkIcon(link);
                              return (
                                <a
                                  key={link.id}
                                  href={link.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-8 h-8 rounded-md border theme-btn-icon theme-bg-secondary hover:opacity-80"
                                  aria-label={link.link_name || '링크'}
                                >
                                  <Icon />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* 6. 한 일 (개조식) */}
                        {highlights.length > 0 && (
                          <ul className="list-disc list-outside text-sm theme-text-secondary space-y-1 mb-3 pl-5">
                            {highlights.map((item, i) => (
                              <li key={i} className="pl-1">{item}</li>
                            ))}
                          </ul>
                        )}

                        {/* 7. 태그 pill (primary 계열) */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                              <span
                                key={t.id}
                                className="text-xs px-2.5 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
                                  borderColor: 'color-mix(in srgb, var(--color-primary) 35%, transparent)',
                                  color: 'var(--ui-text)',
                                }}
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 레거시 description (API에 highlights 없을 때) */}
                        {highlights.length === 0 && c.description && (
                          <p className="text-sm theme-text-secondary mt-2 whitespace-pre-line">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
