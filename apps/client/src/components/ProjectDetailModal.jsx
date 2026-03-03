import React, { useEffect } from 'react';
import { X, Home } from 'lucide-react';
import { getStaticUrl } from '../api';

export default function ProjectDetailModal({ open, project, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const title = project?.title || '프로젝트';
  const thumbUrl = project?.thumbnail ? getStaticUrl(project.thumbnail) : null;
  const bullets = Array.isArray(project?.detail_bullets) ? project.detail_bullets.filter(Boolean) : [];
  const hasNotion = !!(project?.notion_url || '').trim();
  const hasWebsite = !!(project?.website_url || '').trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="p-6 space-y-4">
          <h2 id="project-modal-title" className="text-xl font-bold text-center text-gray-900 dark:text-white pt-1">
            {title}
          </h2>

          <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (!e.currentTarget.src.includes('/favicon.png')) {
                    e.currentTarget.src = '/favicon.png';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                이미지 없음
              </div>
            )}
          </div>

          {bullets.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">프로젝트 설명</h3>
              <ul className="list-disc list-inside space-y-1.5 text-base text-gray-600 dark:text-gray-400">
                {bullets.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            className={`w-full grid gap-3 pt-2 ${hasNotion && hasWebsite ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {hasNotion && (
              <a
                href={project.notion_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity"
              >
                자세히 보기
              </a>
            )}
            {hasWebsite && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Home size={18} />
                사이트 이동
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
