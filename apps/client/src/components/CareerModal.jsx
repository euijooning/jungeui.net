export default function CareerModal({ open, onClose, careers = [] }) {
  if (!open) return null;

  const fmt = (d) => {
    if (!d) return '';
    const [y, m] = String(d).split('-');
    return y && m ? `${y}.${m}` : '';
  };

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-modal-title"
    >
      <div
        className="theme-bg-card theme-card-border rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
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
        <div className="overflow-y-auto p-4 space-y-4">
          {careers.length === 0 ? (
            <p className="theme-text-secondary text-center py-8">등록된 경력이 없습니다.</p>
          ) : (
            careers.map((c) => {
              const start = fmt(c.start_date);
              const end = c.end_date ? fmt(c.end_date) : '현재';
              const periodStr = start ? `${start} ~ ${end}` : '';
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-lg border theme-border theme-bg-secondary"
                >
                  <div className="font-semibold theme-text">{c.company_name || '(회사명)'}</div>
                  {c.role && (
                    <div className="text-sm theme-text-secondary mt-0.5">{c.role}</div>
                  )}
                  {periodStr && (
                    <div className="text-xs theme-text-secondary mt-1">{periodStr}</div>
                  )}
                  {c.description && (
                    <p className="text-sm theme-text-secondary mt-2 whitespace-pre-line">
                      {c.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
